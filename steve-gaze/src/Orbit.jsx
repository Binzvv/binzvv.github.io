import { useEffect, useRef } from 'react'
import { DEVICES } from './devices.jsx'

// Orbit tuning (fractions of the head box unless noted)
const PERIOD = 28 // s per revolution
const CENTRE_Y = 0.56 // ring centre, about nose/upper-lip height
const RX = 0.56
const RY = 0.15
const TILT = (-9 * Math.PI) / 180 // ring tilt
const SCALE_BACK = 0.72
const SCALE_FRONT = 1.06

/**
 * Devices circle the head on a tilted ellipse. Items on the near half of the
 * ring sit above the head (z-index), items on the far half pass behind it.
 */
export default function Orbit({ headRef, visible, reducedMotion }) {
  const items = useRef([])

  useEffect(() => {
    let raf = 0
    let box = { cx: 0, cy: 0, size: 1, rx: 1 }
    const start = performance.now() - 2600 // begin mid-flight, not bunched up

    const measure = () => {
      const el = headRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const size = r.width
      const widest = Math.max(...DEVICES.map((d) => d.w)) * size * SCALE_FRONT
      // Keep the whole ring on screen on narrow phones.
      const rx = Math.min(RX * size, window.innerWidth / 2 - widest / 2 - 8)
      box = { cx: r.left + r.width / 2, cy: r.top + r.height * CENTRE_Y, size, rx }
      items.current.forEach((node, i) => {
        if (node) node.style.width = `${DEVICES[i].w * size}px`
      })
    }

    const place = (now) => {
      const t = (now - start) / 1000
      const spin = reducedMotion ? 0.35 : (t / PERIOD) * Math.PI * 2
      const cos = Math.cos(TILT)
      const sin = Math.sin(TILT)
      items.current.forEach((node, i) => {
        if (!node) return
        const a = spin + (i / DEVICES.length) * Math.PI * 2
        const ex = Math.cos(a) * box.rx
        const ey = Math.sin(a) * box.size * RY
        const x = box.cx + ex * cos - ey * sin
        const y = box.cy + ex * sin + ey * cos
        const depth = Math.sin(a) // +1 nearest the viewer, -1 furthest
        const k = (depth + 1) / 2
        const s = SCALE_BACK + (SCALE_FRONT - SCALE_BACK) * k
        const lean = Math.cos(a) * -7
        node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)}) rotate(${lean.toFixed(2)}deg)`
        node.style.zIndex = depth > 0 ? '6' : '1'
        node.style.setProperty('--depth', k.toFixed(3))
      })
    }

    const tick = (now) => {
      place(now)
      if (!reducedMotion) raf = requestAnimationFrame(tick)
    }

    measure()
    const ro = new ResizeObserver(() => {
      measure()
      if (reducedMotion) place(performance.now())
    })
    if (headRef.current) ro.observe(headRef.current)
    window.addEventListener('resize', measure)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [headRef, reducedMotion])

  return (
    <div className={`orbit ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      {DEVICES.map((d, i) => (
        <div
          key={d.key}
          className="device"
          title={d.label}
          style={{ '--i': i }}
          ref={(n) => (items.current[i] = n)}
        >
          {d.svg}
        </div>
      ))}
    </div>
  )
}
