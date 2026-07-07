import { ReactLenis } from 'lenis/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Lenis gives the page its editorial "gliding" momentum-scroll feel. Tuned
// for weight (a cubic ease-out, moderate duration) rather than a floaty
// overshoot. Disabled entirely under prefers-reduced-motion, per DESIGN.md's
// motion personality — reduced motion means native, instant scrolling.
//
// syncTouch lets Lenis drive touch gestures too (not just the mouse wheel).
// Without it, Lenis half-intercepts touch and kills native flick momentum —
// the page only moves while a finger is pressed and dragging, and a quick
// swipe carries no inertia. Enabling it restores flick-to-scroll and extends
// the same weighty glide to mobile.
function SmoothScroll({ children }) {
  const reduced = usePrefersReducedMotion()

  if (reduced) return children

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.075,
      }}
    >
      {children}
    </ReactLenis>
  )
}

export default SmoothScroll
