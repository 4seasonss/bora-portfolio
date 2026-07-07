import { useRef, useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'motion/react'
import TextLink from './TextLink'

// Top Navigation Bar (DESIGN.md): fixed, transparent, 66px tall, no
// background fill — wordmark left, menu right. It floats over both the
// dark hero and the white sections below, so its color flips (Motion,
// scroll-linked) once the page has scrolled past the hero.
function TopNav() {
  const lastPastRef = useRef(false)
  const [color, setColor] = useState('#ffffff')
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', () => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const isPast = hero.getBoundingClientRect().bottom <= 66
    if (isPast !== lastPastRef.current) {
      lastPastRef.current = isPast
      setColor(isPast ? '#000000' : '#ffffff')
    }
  })

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-20 flex h-[66px] items-center justify-between px-6 sm:px-10"
      animate={{ color }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <span className="font-roobert text-base font-normal">Bora Uner</span>
      <nav className="flex items-center gap-7">
        <TextLink href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="text-xs">
          RESUME
        </TextLink>
        <TextLink href="https://linkedin.com/in/borauner" target="_blank" rel="noopener noreferrer" className="text-xs">
          LINKEDIN
        </TextLink>
      </nav>
    </motion.header>
  )
}

export default TopNav
