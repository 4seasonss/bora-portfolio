import { motion, useScroll, useTransform } from 'motion/react'

// Rotating Scroll Indicator (DESIGN.md): circular badge, text tracing the
// circumference, rotating continuously at a slow tempo. Bottom-left corner,
// white stroke/text on transparent fill (white reads against the dark
// iridescent scene it floats over) — a punctuation mark, not a button, so
// it isn't focusable/clickable. Its job is nudging the user into an
// initial scroll, so it fades out (scroll-linked, via Motion) once they've
// actually started — otherwise, on a page this short, it would sit on top
// of the footer. The rotation itself is auto-reduced to a static frame by
// the app-level MotionConfig under prefers-reduced-motion.
function ScrollIndicator() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 200], [1, 0])

  return (
    <motion.div
      className="pointer-events-none fixed bottom-6 left-6 z-10 h-[88px] w-[88px]"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Soft dark glow so the white badge stays legible no matter what
          part of the shifting scene is behind it. */}
      <div className="absolute -inset-3 rounded-full bg-black/30 blur-md" />
      <motion.svg
        width="88"
        height="88"
        viewBox="0 0 88 88"
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <path id="scroll-circle-path" d="M 44,44 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
        </defs>
        <circle cx="44" cy="44" r="34" fill="none" stroke="#ffffff" strokeWidth="1" />
        <circle cx="38.5" cy="44" r="7" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        <circle cx="49.5" cy="44" r="7" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        <text fontSize="7.2" fill="#ffffff" letterSpacing="1.5" fontFamily="var(--font-roobert)">
          <textPath href="#scroll-circle-path">
            SCROLL DOWN · SCROLL DOWN ·&#160;
          </textPath>
        </text>
      </motion.svg>
    </motion.div>
  )
}

export default ScrollIndicator
