import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP } from '../lib/motion'
import { services } from '../data/content'

export default function Services() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Note: hover transitions live on inner elements so CSS never fights GSAP for `transform`.
      gsap.utils.toArray('.service').forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 90%' } })
        tl.from(row.querySelector('.service__rule'), { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.inOut' })
          .from(row.querySelectorAll('.service__num, .service__name, .service__note, .service__arrow'),
            { yPercent: 60, autoAlpha: 0, stagger: 0.06, duration: 1 }, 0.35)
      })
    })
  }, { scope: root })

  return (
    <section ref={root} id="services" className="services section" data-theme="light">
      <p className="mono services__label"><span className="accent">●</span> (03) What we do</p>
      <ul className="services__list">
        {services.map((s, i) => (
          <li className="service" key={s.name} tabIndex={0}>
            <span className="service__rule" aria-hidden="true" />
            <span className="service__num mono">0{i + 1}</span>
            <span className="service__name"><span className="service__name-inner">{s.name}</span></span>
            <span className="service__note">{s.note}</span>
            <span className="service__arrow"><ArrowUpRight size={32} strokeWidth={1.25} aria-hidden="true" /></span>
          </li>
        ))}
        <li className="service service--end" aria-hidden="true"><span className="service__rule" /></li>
      </ul>
    </section>
  )
}
