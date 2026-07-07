import { motion } from 'motion/react'
import TextLink from './TextLink'

const EASE = [0.19, 1, 0.22, 1]

// Footer Address Block (DESIGN.md): compact, left-aligned, 11px Roobert,
// Felt Gray, tight 8px gaps between lines, no dividers or labels.
function Footer() {
  return (
    <motion.footer
      className="mx-auto w-full max-w-[1078px] px-6 py-16 sm:px-10"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <p className="font-roobert m-0 text-[11px] leading-[1.36] text-obsidian">Bora Uner</p>
      <p className="font-roobert mt-2 text-[11px] leading-[1.36] text-felt-gray">Student Developer</p>

      <div className="mt-6 flex gap-6">
        <TextLink href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-obsidian">
          Résumé
        </TextLink>
        <TextLink href="https://linkedin.com/in/borauner" target="_blank" rel="noopener noreferrer" className="text-xs text-obsidian">
          LinkedIn
        </TextLink>
      </div>

      <p className="font-roobert mt-8 text-[11px] leading-[1.36] text-felt-gray">© 2026 Bora Uner</p>
    </motion.footer>
  )
}

export default Footer
