import { motion } from 'motion/react'

// Underline-Free Text Link (DESIGN.md): inline navigation, menu items,
// footer links. No underline ever — a quiet opacity fade (Motion
// whileHover, 0.4s plain ease per the micro-transition spec) is the only
// affordance.
function TextLink({ href, children, className = '', ...props }) {
  return (
    <motion.a
      href={href}
      className={`text-link font-roobert ${className}`}
      whileHover={{ opacity: 0.6 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.a>
  )
}

export default TextLink
