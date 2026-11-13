import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger } from '../lib/motion'
import { marquee } from '../data/content'

// Endless ticker whose speed and direction follow your scroll velocity.
export default function Marquee() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const loop = gsap.to('.marquee__track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
      // Start deep into the loop so it can also run backwards.
      loop.totalTime(loop.duration() * 500)

      let dir = 1
      let target = 1
      let current = 1
      const st = ScrollTrigger.create({
        trigger: root.current, start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          dir = self.direction
          target = dir * (1 + Math.min(Math.abs(self.getVelocity()) / 220, 6))
        },
      })
      const spin = gsap.quickSetter('.marquee__star', 'rotate', 'deg')
      let angle = 0
      const tick = () => {
        target += (dir - target) * 0.04          // ease back to cruising speed
        current += (target - current) * 0.1      // smooth acceleration
        loop.timeScale(current)
        angle += current * 0.6
        spin(angle)
      }
      gsap.ticker.add(tick)
      return () => { gsap.ticker.remove(tick); st.kill() }
    })
  }, { scope: root })

  const row = (copy) => (
    <div className="marquee__row" aria-hidden={copy ? 'true' : undefined}>
      {marquee.map((m) => (
        <span key={m} className="marquee__item">
          {m}<span className="marquee__star">✶</span>
        </span>
      ))}
    </div>
  )

  return (
    <section ref={root} className="marquee" data-theme="light" aria-label={marquee.join(', ')}>
      <div className="marquee__track">{row(false)}{row(true)}</div>
    </section>
  )
}
