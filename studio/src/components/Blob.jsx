import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/motion'
import { blobLines } from '../data/content'

// "Blob" — the studio's placeholder character.
// Eyes track the pointer, it blinks on its own, wobbles idly,
// and squashes + talks back when poked. Swap the markup for an
// illustration or Lottie later; the behaviours are independent.
export default function Blob({ className = '', label = 'Poke Blob, the studio mascot' }) {
  const root = useRef(null)
  const [line, setLine] = useState('')
  const lineIdx = useRef(0)
  const hideCall = useRef(null)

  const { contextSafe } = useGSAP(() => {
    const el = root.current
    const body = el.querySelector('.blob__body')
    const eyes = gsap.utils.toArray('.blob__eye', el)
    const pupils = gsap.utils.toArray('.blob__pupil', el)
    const reduced = prefersReducedMotion()

    // Pupils follow pointer / touch anywhere on the page.
    const movers = pupils.map((p) => ({
      x: gsap.quickTo(p, 'x', { duration: reduced ? 0.01 : 0.35, ease: 'power3' }),
      y: gsap.quickTo(p, 'y', { duration: reduced ? 0.01 : 0.35, ease: 'power3' }),
    }))
    const look = (e) => {
      eyes.forEach((eye, i) => {
        const r = eye.getBoundingClientRect()
        const ang = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2))
        const max = r.width * 0.24
        const dist = Math.min(max, Math.hypot(e.clientX - r.left, e.clientY - r.top) / 12)
        movers[i].x(Math.cos(ang) * dist)
        movers[i].y(Math.sin(ang) * dist)
      })
    }
    window.addEventListener('pointermove', look, { passive: true })
    window.addEventListener('pointerdown', look, { passive: true })

    if (reduced) {
      return () => {
        window.removeEventListener('pointermove', look)
        window.removeEventListener('pointerdown', look)
      }
    }

    // Idle wobble: morph the border-radius between organic shapes.
    gsap.to(body, {
      keyframes: [
        { borderRadius: '58% 42% 46% 54% / 52% 48% 52% 48%' },
        { borderRadius: '44% 56% 60% 40% / 46% 58% 42% 54%' },
        { borderRadius: '52% 48% 40% 60% / 60% 44% 56% 40%' },
      ],
      duration: 6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })

    // Randomised blinking.
    let blinkCall
    const blink = () => {
      gsap.timeline()
        .to(eyes, { scaleY: 0.08, duration: 0.07, ease: 'power2.in' })
        .to(eyes, { scaleY: 1, duration: 0.16, ease: 'power2.out' })
      blinkCall = gsap.delayedCall(gsap.utils.random(1.8, 4.5), blink)
    }
    blinkCall = gsap.delayedCall(2.2, blink)

    return () => {
      blinkCall?.kill()
      window.removeEventListener('pointermove', look)
      window.removeEventListener('pointerdown', look)
    }
  }, { scope: root })

  const poke = contextSafe(() => {
    const el = root.current
    const next = blobLines[lineIdx.current++ % blobLines.length]
    setLine(next)
    hideCall.current?.kill()
    hideCall.current = gsap.delayedCall(1.8, () => setLine(''))

    if (prefersReducedMotion()) return
    gsap.timeline({ overwrite: true })
      .to(el.querySelector('.blob__squash'), { scaleX: 1.22, scaleY: 0.78, duration: 0.12, ease: 'power2.out' })
      .to(el.querySelector('.blob__squash'), { scaleX: 1, scaleY: 1, duration: 1.1, ease: 'elastic.out(1.1, 0.3)' })
    gsap.fromTo(el.querySelector('.blob__bubble'),
      { scale: 0.4, rotate: -12 },
      { scale: 1, rotate: -4, duration: 0.7, ease: 'back.out(2.5)' })
  })

  return (
    <button ref={root} type="button" className={`blob ${className}`} onClick={poke} aria-label={label} data-cursor="hover">
      <span className="blob__squash">
        <span className="blob__body" />
        <span className="blob__face">
          <span className="blob__eye"><span className="blob__pupil" /></span>
          <span className="blob__eye"><span className="blob__pupil" /></span>
        </span>
        <span className="blob__mouth" />
      </span>
      <span className="blob__bubble" data-show={!!line} aria-live="polite">{line}</span>
    </button>
  )
}
