import { useRef, useState } from 'react'
import { gsap, useGSAP, hasFinePointer } from '../lib/motion'

// Custom cursor for fine pointers only. Elements opt in with:
//   data-cursor="hover"                     → ring swells
//   data-cursor="view" data-cursor-label="" → ring becomes a labelled disc
const SIZES = { idle: 36, hover: 68, view: 116 }

export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const [label, setLabel] = useState('')
  const [enabled] = useState(() => hasFinePointer())

  useGSAP(() => {
    if (!enabled) return
    const root = document.documentElement
    root.classList.add('has-cursor')

    gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50, autoAlpha: 0 })
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })

    let shown = false
    let mode = ''

    const move = (e) => {
      if (!shown) {
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY })
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.4 })
        shown = true
      }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY)
    }

    const setMode = (next, text = '') => {
      if (next === mode) return
      mode = next
      setLabel(text)
      ring.current.dataset.mode = next
      const size = SIZES[next || 'idle']
      gsap.to(ring.current, { width: size, height: size, duration: 0.6, ease: 'expo.out' })
      gsap.to(dot.current, { scale: next ? 0 : 1, duration: 0.3 })
    }

    const over = (e) => {
      const t = e.target.closest('[data-cursor]')
      if (t) setMode(t.dataset.cursor, t.dataset.cursorLabel || '')
      else if (e.target.closest('a, button, [role="button"]')) setMode('hover')
      else setMode('')
    }

    const down = () => gsap.to(ring.current, { scale: 0.8, duration: 0.15, ease: 'power2.out' })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    const leaveDoc = () => {
      gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 })
      shown = false
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leaveDoc)

    return () => {
      root.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leaveDoc)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor__ring">
        <span className="cursor__label">{label}</span>
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
