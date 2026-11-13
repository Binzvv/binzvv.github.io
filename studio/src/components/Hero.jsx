import { useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { gsap, useGSAP, ScrollTrigger, hasFinePointer, EASE } from '../lib/motion'
import { hero, studio } from '../data/content'
import { SplitChars } from './Split'
import Blob from './Blob'
import { scrollToHash } from '../lib/scrollTo'

export default function Hero() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const chars = gsap.utils.toArray('.hero__title .char')

      // 1 · Intro — characters rise out of their line masks.
      const intro = gsap.timeline({ delay: 0.15 })
      intro
        .from(chars, { yPercent: 115, rotate: 8, duration: 1.4, stagger: { each: 0.035 }, ease: EASE.out })
        .from('.hero__blob', { scale: 0, rotate: -40, duration: 1.3, ease: 'elastic.out(1, 0.5)' }, 0.55)
        .from('.hero__meta > *', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1 }, 0.9)

      // 2 · Kinetic type — letters near the pointer stretch wider and lighter.
      let cleanupPointer
      if (hasFinePointer()) {
        const kinetic = chars.filter((c) => !c.closest('.is-serif'))
        const weight = kinetic.map((c) => gsap.quickTo(c, '--w', { duration: 0.7, ease: 'power3' }))
        const width = kinetic.map((c) => gsap.quickTo(c, '--wd', { duration: 0.9, ease: 'power3' }))
        const move = (e) => {
          kinetic.forEach((c, i) => {
            const r = c.getBoundingClientRect()
            const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
            const t = Math.max(0, 1 - d / 300) ** 2
            weight[i](900 - 520 * t)
            width[i](62 + 48 * t)
          })
        }
        const reset = () => { weight.forEach((s) => s(900)); width.forEach((s) => s(62)) }
        const el = root.current
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', reset)
        cleanupPointer = () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', reset)
        }
      }

      // 3 · Scroll exit — lines drift apart, the block sinks and fades.
      const exit = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
      })
      exit
        .to('.hero__line:nth-child(1) .hero__line-inner', { xPercent: -18, ease: 'none' }, 0)
        .to('.hero__line:nth-child(2) .hero__line-inner', { xPercent: 10, ease: 'none' }, 0)
        .to('.hero__line:nth-child(3) .hero__line-inner', { xPercent: -6, ease: 'none' }, 0)
        .to('.hero__title', { yPercent: 25, ease: 'none' }, 0)
        .to('.hero__meta', { autoAlpha: 0, y: -40, ease: 'none' }, 0)

      return () => cleanupPointer?.()
    })

    // Fonts change line widths → recalc trigger positions once loaded.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, { scope: root })

  return (
    <section ref={root} className="hero" id="top" data-theme="light">
      <h1 className="hero__title">
        {hero.lines.map((line, i) => (
          <span className={`hero__line ${line.serif ? 'is-serif' : ''}`} key={i}>
            <span className="hero__line-inner">
              {line.blob && <Blob className="hero__blob" />}
              <SplitChars text={line.text} />
              {line.dot && <span className="hero__dot" aria-hidden="true">.</span>}
            </span>
          </span>
        ))}
      </h1>

      <div className="hero__meta">
        <p className="hero__intro">{hero.intro}</p>
        <p className="mono hero__where">
          Independent studio
          <br />
          {studio.city} &amp; everywhere
        </p>
        <a href="#studio" className="hero__scroll mono" data-cursor="hover"
          onClick={(e) => scrollToHash(e, '#studio')}>
          Scroll <ArrowDown size={14} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
