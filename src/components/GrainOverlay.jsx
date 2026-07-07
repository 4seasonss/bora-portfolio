// A subtle film-grain texture over the hero — breaks up the smooth
// gradient/reflection banding and gives the scene a tactile, filmic
// quality, like the reference. Pure SVG (feTurbulence), no images, no
// new dependencies.
function GrainOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full opacity-[0.15]"
      aria-hidden="true"
    >
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
        {/* feTurbulence's own alpha channel is noisy too, which silently
            compounds with the opacity above — force it fully opaque so
            the opacity value alone controls visible grain intensity. */}
        <feComponentTransfer in="grayNoise">
          <feFuncA type="linear" slope="0" intercept="1" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  )
}

export default GrainOverlay
