import { MotionConfig } from 'motion/react'
import SmoothScroll from './components/SmoothScroll'
import TopNav from './components/TopNav'
import Hero from './components/Hero'
import About from './components/About'
import Footer from './components/Footer'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <TopNav />
        <Hero />
        <About />
        <Footer />
      </SmoothScroll>
    </MotionConfig>
  )
}

export default App
