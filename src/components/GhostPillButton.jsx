import { motion } from 'motion/react'

const EASE = [0.19, 1, 0.22, 1]

// Ghost Pill Button, Light Surface (DESIGN.md): transparent fill, 75px
// radius. Hover animates border-opacity + letter-spacing on the signature
// easing curve — no fill on hover, per the Agent Prompt Guide's example
// recipe. Only the light-surface variant is used anywhere in this build;
// re-add a dark-surface variant if a dark-background CTA shows up later.
function GhostPillButton({ href, children, className = '', ...props }) {
  return (
    <motion.a
      href={href}
      className={`ghost-pill ${className}`}
      style={{ borderColor: 'rgba(0, 0, 0, 0.4)', color: 'var(--color-obsidian)', letterSpacing: '0px' }}
      whileHover={{ borderColor: 'rgba(0, 0, 0, 1)', letterSpacing: '0.5px' }}
      transition={{ duration: 0.8, ease: EASE }}
      {...props}
    >
      {children}
    </motion.a>
  )
}

export default GhostPillButton
