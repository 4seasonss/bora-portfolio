import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Iridescent Hero Backdrop: a large enclosing background sphere and a lit
// reflector sphere sample the *same* flow field at their shared world-space
// XY position, so the ribbons of color visibly continue from the backdrop
// onto the reflector's surface rather than reading as two separately-
// textured objects. WebGL/Three.js — JS-driven, not CSS keyframes.
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Classic 3D simplex noise (Ashima Arts / Stefan Gustavson) — the standard
// public-domain-style GLSL noise utility used across creative coding.
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Cheaper 2-octave version for the domain-warp offset, which doesn't need
  // as much fine detail as the final color sample — keeps the flow smooth
  // (fewer noise evaluations per pixel) without looking any less organic.
  float fbm2(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 2; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Shared flow field: sampled by world-space XY (not local geometry
  // coordinates), so the sphere and background — at different depths and
  // on different meshes — read the same underlying liquid rather than two
  // independently-textured objects. Anisotropic stretch along a fixed
  // diagonal gives long flowing ribbons instead of round, blobby patches.
  float flow(vec2 worldXY, float t) {
    float angle = 0.55;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 q = rot * worldXY;
    q *= vec2(0.4, 1.0);

    vec3 p = vec3(q * 0.6, 0.0);
    vec3 warp = vec3(
      fbm2(p + vec3(0.0, 0.0, t * 0.09)),
      fbm2(p + vec3(5.2, 1.3, t * 0.075)),
      fbm2(p + vec3(1.7, 9.1, t * 0.06))
    );
    return fbm(p + warp * 0.55);
  }
`

const COLOR_UNIFORMS = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMoss;
  uniform vec3 uTeal;
  uniform vec3 uIndigo;
`

// The sphere: a lit, reflective 3D object — real diffuse falloff, a mirror
// reflection of its surroundings (via a live cube-camera capture of the
// background), and a crisp bright rim at the silhouette. The rim is driven
// by that same live reflection (not a fixed color), so the border flows
// and shifts with the scene instead of sitting static.
const SPHERE_FRAGMENT_SHADER = /* glsl */ `
  ${COLOR_UNIFORMS}
  uniform samplerCube uEnvMap;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    // Shared low-frequency flow (aligns with the background at the
    // silhouette edge) plus a finer local layer sampled from the same
    // world position — the sphere is small enough that the shared field
    // alone doesn't vary much across its face, so this adds surface
    // richness without breaking the edge continuity.
    float n = flow(vWorldPosition.xy, uTime);
    n += fbm2(vWorldPosition * 1.6 + vec3(0.0, 0.0, uTime * 0.075)) * 0.9;
    // The shared field has a wide dark valley wherever the background is
    // also dark; a small bias keeps the sphere's own surface from sinking
    // as deep into it as the flat backdrop does, so it reads as shaded
    // liquid rather than a blank patch.
    n += 0.15;

    // Kept off true black — the sphere and background share one
    // low-frequency flow field, so a large dark valley in that field
    // covers a correspondingly large area; if "dark" were near-black,
    // that area loses all visible hue and reads as an undefined blank
    // patch rather than a shaded part of the same liquid surface.
    vec3 dark = vec3(0.045, 0.06, 0.055);
    vec3 color = mix(dark, uMoss, smoothstep(-0.55, 0.35, n));
    color = mix(color, uTeal, smoothstep(-0.2, 0.65, n));
    color = mix(color, uIndigo, smoothstep(0.15, 1.0, n));
    color = mix(color, dark, smoothstep(0.95, 1.35, n) * 0.15);

    // Lift the sphere's own surface brightness broadly (not via reflection —
    // reflecting the shared field broadly just mirrors the same correlated
    // dark patches back, which made things darker, not brighter) so the
    // whole face reads closer to the border's vividness rather than only
    // a thin rim.
    color = color * 1.35 + 0.05;

    // Barely-there falloff — just enough to hint the sphere is a 3D object,
    // without darkening most of its face relative to the bright border.
    vec3 lightDir = normalize(vec3(0.25, 0.3, 1.0));
    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.15 + 0.85;
    color *= diffuse;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = max(dot(viewDir, vNormal), 0.0);

    // Mirror reflection of the surrounding scene — concentrated at the
    // grazing edge, where reflection vectors sweep across a much wider,
    // more varied slice of the scene (which is why the border reads bright
    // and lively); reflecting broadly across the face just mirrors the
    // correlated, often-dark field directly behind each point.
    vec3 reflectDir = reflect(-viewDir, vNormal);
    vec3 envColor = textureCube(uEnvMap, reflectDir).rgb;
    float reflectivity = mix(0.08, 0.55, pow(1.0 - ndotv, 4.0));
    color = mix(color, envColor, reflectivity);

    // A crisp bright border right at the silhouette — brightened from the
    // same live reflection, so it flows and shifts with the scene rather
    // than sitting as a static tint.
    float rim = pow(1.0 - ndotv, 8.0);
    vec3 borderColor = envColor * 1.6 + 0.12;
    color = mix(color, borderColor, rim * 0.85);

    gl_FragColor = vec4(color, 1.0);
  }
`

// The background: the same flow field, unlit — a large sphere enclosing
// the whole scene (see the geometry setup below) so it reads as ambient
// surroundings rather than a second solid object.
const BACKGROUND_FRAGMENT_SHADER = /* glsl */ `
  ${COLOR_UNIFORMS}
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    float n = flow(vWorldPosition.xy, uTime);

    vec3 dark = vec3(0.045, 0.06, 0.055);
    vec3 color = mix(dark, uMoss, smoothstep(-0.65, 0.25, n));
    color = mix(color, uTeal, smoothstep(-0.3, 0.6, n));
    color = mix(color, uIndigo, smoothstep(0.1, 1.05, n));

    gl_FragColor = vec4(color, 1.0);
  }
`

const COLORS = {
  moss: new THREE.Color(0.55, 0.75, 0.46),
  teal: new THREE.Color(0.22, 0.58, 0.6),
  indigo: new THREE.Color(0.22, 0.38, 0.58),
}

function IridescentScene() {
  const containerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer
    try {
      // No MSAA: the scene is soft-focus (blurred flow field, grain overlay)
      // and antialiasing was adding real GPU cost for barely-visible benefit.
      renderer = new THREE.WebGLRenderer({ antialias: false })
    } catch {
      return undefined // no WebGL — the dark base color still shows behind the hero text
    }
    renderer.setClearColor(0x05060a, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 30)
    camera.position.z = 3.6

    const colorUniforms = () => ({
      uTime: { value: 0 },
      uMoss: { value: COLORS.moss },
      uTeal: { value: COLORS.teal },
      uIndigo: { value: COLORS.indigo },
    })

    // Captures the surrounding scene (background only — the sphere hides
    // itself during capture) into a cube map, used as a live mirror
    // reflection on the sphere's surface. No mipmaps: generating them for a
    // cubemap that's re-rendered every frame blends incorrectly across the
    // 6 face boundaries and shows up as a visible seam line on the sphere.
    // This capture is genuinely expensive (6 extra render passes every
    // frame) — 128 is plenty since the reflection is soft/blurry by design,
    // and halves the fill-rate cost of the previous 256 (a 4x pixel-count
    // difference) with no visible quality loss.
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
    })
    const cubeCamera = new THREE.CubeCamera(0.1, 30, cubeRenderTarget)

    // 64 segments is still perfectly smooth at this on-screen size — 128
    // was double the triangle count for no visible benefit.
    const sphereGeometry = new THREE.SphereGeometry(1.7, 64, 64)
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: SPHERE_FRAGMENT_SHADER,
      uniforms: {
        ...colorUniforms(),
        uEnvMap: { value: cubeRenderTarget.texture },
      },
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(1.75, 0.4, 0)
    scene.add(sphere)

    cubeCamera.position.copy(sphere.position)
    scene.add(cubeCamera)

    // A large sphere enclosing the whole scene, seen from the inside — not
    // a flat plane. A plane only fills the *main* camera's narrow view, so
    // the reflection's CubeCamera (which looks in all 6 directions from the
    // reflector sphere) saw the plane in one direction and empty space in
    // the rest, and that boundary showed up as a hard line in the
    // reflection. An enclosing sphere gives the reflection continuous
    // content in every direction, no seam.
    const backgroundGeometry = new THREE.SphereGeometry(15, 64, 64)
    const backgroundMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: BACKGROUND_FRAGMENT_SHADER,
      uniforms: colorUniforms(),
      side: THREE.BackSide,
      depthWrite: false,
    })
    const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial)
    scene.add(background)

    const setSize = () => {
      const { clientWidth, clientHeight } = container
      renderer.setSize(clientWidth, clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    setSize()
    container.appendChild(renderer.domElement)

    const resizeObserver = new ResizeObserver(setSize)
    resizeObserver.observe(container)

    let frameId
    const clock = new THREE.Clock()

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime()
      sphereMaterial.uniforms.uTime.value = elapsed
      backgroundMaterial.uniforms.uTime.value = elapsed
      if (!reducedMotion) {
        sphere.rotation.y = elapsed * 0.13
        sphere.rotation.x = Math.sin(elapsed * 0.08) * 0.1
      }
      sphere.visible = false
      cubeCamera.update(renderer, scene)
      sphere.visible = true
      renderer.render(scene, camera)
      if (!reducedMotion) frameId = requestAnimationFrame(renderFrame)
    }
    renderFrame()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      sphereGeometry.dispose()
      sphereMaterial.dispose()
      backgroundGeometry.dispose()
      backgroundMaterial.dispose()
      cubeRenderTarget.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [reducedMotion])

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />
}

export default IridescentScene
