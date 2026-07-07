import { motion } from 'motion/react'
import IridescentScene from './IridescentScene'
import ScrollIndicator from './ScrollIndicator'
import GrainOverlay from './GrainOverlay'

const EASE = [0.19, 1, 0.22, 1]

// Hero Display Headline (DESIGN.md): 225px Roobert weight 400 over the
// iridescent backdrop. No subhead, no CTA — just the one monumental
// phrase, centered, breathing against the fluid light. The entrance's
// transform (y) is auto-reduced to instant by the app-level MotionConfig
// when the user prefers reduced motion; opacity keeps fading in.
function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4"
    >
      <IridescentScene />
      <motion.p
        className="text-display relative z-10 m-0 text-center text-paper"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        Bora Uner
      </motion.p>
      <ScrollIndicator />
      <GrainOverlay />
    </section>
  )
}

export default Hero
