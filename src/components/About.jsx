import { motion } from 'motion/react'
import GhostPillButton from './GhostPillButton'

const EASE = [0.19, 1, 0.22, 1]

// Kept deliberately small: a whisper-weight identity line and the two
// links that matter — no bio paragraph, no extra sections. Restraint is
// the design here.
function About() {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1078px] px-6 py-24 sm:px-10"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <h2 className="text-heading-whisper m-0 text-obsidian">Student. Developer.</h2>
      <div className="mt-10 flex gap-6">
        <GhostPillButton href="/resume.pdf" target="_blank" rel="noopener noreferrer">
          Résumé
        </GhostPillButton>
        <GhostPillButton href="https://linkedin.com/in/borauner" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </GhostPillButton>
      </div>
    </motion.section>
  )
}

export default About
