import { useEffect } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from './lib/motion'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Manifesto from './components/Manifesto'
import Work from './components/Work'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Contact from './components/Contact'

const THEMES = {
  light: { '--bg': '#f3f1ec', '--fg': '#0c0c0c' },
  dark: { '--bg': '#0c0c0c', '--fg': '#f3f1ec' },
}

export default function App() {
  // Page colour crossfades as each section takes over the middle of the screen.
  useGSAP(() => {
    const root = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    const apply = (theme) => {
      gsap.to(root, { ...THEMES[theme], duration: prefersReducedMotion() ? 0 : 0.9, ease: 'power2.inOut', overwrite: true })
      meta?.setAttribute('content', THEMES[theme]['--bg'])
    }
    gsap.utils.toArray('[data-theme]').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => self.isActive && apply(section.dataset.theme),
      })
    })
  })

  // A small wink when the tab loses focus.
  useEffect(() => {
    const original = document.title
    const onVis = () => { document.title = document.hidden ? '(•‿•) psst… come back' : original }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <>
      <a href="#work" className="skip mono">Skip to work</a>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Work />
        <Marquee />
        <Services />
        <Contact />
      </main>
    </>
  )
}
