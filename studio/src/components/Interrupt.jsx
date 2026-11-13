import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../lib/motion'
import Blob from './Blob'

// A full-bleed typographic interruption: two rows of cropped giant type that
// slide against each other with scroll and lurch with scroll speed.
// Blob lives behind the letters, sneaks a look now and then, and ducks
// if you come too close.
export default function Interrupt({ words, tone = 'acid' }) {
  const root = useRef(null)
  const peek = useRef(null)
  const [a, b] = words
  const repeat = (w) => Array.from({ length: 4 }, () => w).join(' ✶ ')

  useGSAP(() => {
    const el = root.current
    const rows = gsap.utils.toArray('.interrupt__row', el)

    if (prefersReducedMotion()) {
      gsap.set(peek.current, { left: '62%', yPercent: 28 })
      return
    }

    // Rows travel in opposite directions while the band is on screen.
    gsap.fromTo(rows[0], { xPercent: 0 }, {
      xPercent: -22, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    })
    gsap.fromTo(rows[1], { xPercent: -26 }, {
      xPercent: -4, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
    })

    // Fast scrolling skews the type, then it springs upright.
    const skew = rows.map((r) => gsap.quickTo(r, 'skewX', { duration: 0.5, ease: 'power3' }))
    let settle
    const st = ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-14, 14, self.getVelocity() / -160)
        skew.forEach((s) => s(v))
        settle?.kill()
        settle = gsap.delayedCall(0.12, () => skew.forEach((s) => s(0)))
      },
    })

    // Blob: peek, wait, duck — and duck early if the pointer gets close.
    const p = peek.current
    gsap.set(p, { yPercent: 105, left: '58%' })
    let hidden = true
    let next
    const duck = (fast = false) => {
      next?.kill()
      hidden = true
      gsap.to(p, { yPercent: 105, rotate: 0, duration: fast ? 0.22 : 0.6, ease: fast ? 'power3.in' : 'power2.in', overwrite: true })
      next = gsap.delayedCall(fast ? gsap.utils.random(2.5, 4) : gsap.utils.random(1.6, 3.2), pop)
    }
    const pop = () => {
      if (!ScrollTrigger.isInViewport(el)) { next = gsap.delayedCall(1, pop); return }
      hidden = false
      gsap.set(p, { left: `${gsap.utils.random(8, 78)}%` })
      gsap.to(p, {
        yPercent: gsap.utils.random(18, 34), rotate: gsap.utils.random(-14, 14),
        duration: 0.9, ease: 'back.out(1.6)', overwrite: true,
      })
      next = gsap.delayedCall(gsap.utils.random(1.8, 3), () => duck())
    }
    next = gsap.delayedCall(1.2, pop)

    const near = (e) => {
      if (hidden) return
      const r = p.getBoundingClientRect()
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      if (d < r.width * 1.3) duck(true)
    }
    el.addEventListener('pointermove', near)
    el.addEventListener('pointerdown', near)

    return () => {
      next?.kill()
      settle?.kill()
      st.kill()
      el.removeEventListener('pointermove', near)
      el.removeEventListener('pointerdown', near)
    }
  }, { scope: root })

  return (
    <section ref={root} className="interrupt" data-tone={tone} aria-label={`${a} ${b}`}>
      <div className="interrupt__row is-outline" aria-hidden="true">{repeat(a)}</div>
      <span ref={peek} className="interrupt__peek">
        <Blob className="interrupt__blob" label="Blob is hiding" />
      </span>
      <div className="interrupt__row is-solid" aria-hidden="true">{repeat(b)}</div>
    </section>
  )
}
