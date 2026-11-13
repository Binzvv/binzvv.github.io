import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/motion'
import { manifesto } from '../data/content'
import { SplitWords } from './Split'

// Words "ink in" one by one as you scroll through the statement.
export default function Manifesto() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.manifesto .word',
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true },
        })
      gsap.from('.manifesto__label', {
        y: 20, autoAlpha: 0, duration: 1,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
    })
  }, { scope: root })

  return (
    <section ref={root} id="studio" className="manifesto section" data-theme="light">
      <p className="manifesto__label mono"><span className="accent">●</span> (01) The studio</p>
      <p className="manifesto__text">
        {manifesto.map((seg, i) => (
          <span key={i} className={seg.em ? 'serif' : ''}>
            <SplitWords text={seg.t} />{' '}
          </span>
        ))}
      </p>
    </section>
  )
}
