import { useEffect, useRef } from 'react'
import { DEVICES } from './devices.jsx'

// Orbit tuning. Distances are fractions of the head box.
const PERIOD = 32 // s per revolution (base)
const CENTRE_Y = 0.56 // ring centre, about nose/upper-lip height
const RADIUS = 0.58 // ring radius
const PITCH = (15 * Math.PI) / 180 // camera looks slightly down onto the ring
const ROLL = (-8 * Math.PI) / 180 // ring tilts a little in the picture plane
const FOCAL = 4.2 // perspective strength, in ring radii (smaller = stronger)
const BASE_SCALE = 0.95 // overall device scale at the sides of the ring
const SIDE_MARGIN = 8 // px kept clear of the viewport edge

// Small per-device differences so the ring feels hand-placed, not mechanical.
// r: radius factor, h: height offset, bob/sway: amplitudes, p*: periods (s).
const VARIATION = {
  imac: { r: 1.0, h: 0.0, bob: 0.010, pb: 7.1, sway: 0.05, ps: 13.3, breathe: 0.015, tilt: -1 },
  ipad: { r: 0.95, h: -0.02, bob: 0.013, pb: 5.9, sway: 0.07, ps: 11.1, breathe: 0.02, tilt: 1 },
  ipod: { r: 1.05, h: 0.02, bob: 0.015, pb: 6.4, sway: 0.06, ps: 15.7, breathe: 0.02, tilt: -1 },
  iphone: { r: 0.97, h: -0.01, bob: 0.014, pb: 5.3, sway: 0.08, ps: 12.4, breathe: 0.02, tilt: 1 },
  'macbook-air': { r: 1.03, h: 0.01, bob: 0.009, pb: 8.3, sway: 0.05, ps: 17.9, breathe: 0.012, tilt: -1 },
}

const HEAD_Z = 100 // must match .head z-index in styles.css

/** Perspective scale for a point at depth z (in ring radii, + toward viewer). */
const persp = (z) => FOCAL / (FOCAL - z)

/**
 * Devices travel on a real 3D ring around the head, projected with perspective:
 * near-side devices are larger, lower and move faster; far-side devices are
 * smaller, higher, softer, and pass behind the head's silhouette. Each device
 * is depth-sorted against the others and against the head every frame.
 */
export default function Orbit({ headRef, visible, reducedMotion }) {
  const items = useRef([])

  useEffect(() => {
    let raf = 0
    let box = { cx: 0, cy: 0, size: 1, radii: DEVICES.map(() => RADIUS) }
    const start = performance.now() - 3000 // begin mid-flight

    const measure = () => {
      const el = headRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const size = r.width
      const half = window.innerWidth / 2 - SIDE_MARGIN

      // Per-device radius, shrunk only as far as needed to stay on screen.
      const radii = DEVICES.map((d) => {
        const v = VARIATION[d.key]
        const hw = (d.w * size * BASE_SCALE * (1 + v.breathe)) / 2
        let rad = RADIUS * v.r
        for (let k = 0; k < 40; k++) {
          let extent = 0
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 36) {
            const s = persp(Math.sin(a) * Math.cos(PITCH))
            extent = Math.max(extent, s * (Math.abs(Math.cos(a)) * rad * size + hw))
          }
          if (extent <= half) break
          rad *= 0.97
        }
        return rad
      })

      box = { cx: r.left + r.width / 2, cy: r.top + r.height * CENTRE_Y, size, radii }
      items.current.forEach((node, i) => {
        if (node) node.style.width = `${DEVICES[i].w * size * BASE_SCALE}px`
      })
    }

    const cosP = Math.cos(PITCH)
    const sinP = Math.sin(PITCH)
    const cosR = Math.cos(ROLL)
    const sinR = Math.sin(ROLL)
    const TAU = Math.PI * 2

    const place = (now) => {
      const t = reducedMotion ? 3.5 : (now - start) / 1000
      const base = (t / PERIOD) * TAU
      const { size } = box

      items.current.forEach((node, i) => {
        if (!node) return
        const v = VARIATION[DEVICES[i].key]
        const R = box.radii[i] * size

        // Even spacing + slow, small drift so gaps breathe without ever closing.
        const a = base + (i / DEVICES.length) * TAU + Math.sin((t / v.ps) * TAU + i) * v.sway

        // Ring point in 3D (units: px). z > 0 is toward the viewer.
        const x3 = Math.cos(a) * R
        const z3 = Math.sin(a) * R
        const y3 = (v.h + Math.sin((t / v.pb) * TAU + i * 1.7) * v.bob) * size

        // Camera pitch: the near side drops lower on screen, far side rises.
        const yP = y3 * cosP + z3 * sinP
        const zP = z3 * cosP - y3 * sinP
        const s = persp(zP / (RADIUS * size))

        // Project, then roll the whole ring slightly in the picture plane.
        const px = x3 * s
        const py = yP * s
        const sx = box.cx + px * cosR - py * sinR
        const sy = box.cy + px * sinR + py * cosR

        const depth = zP / R // -1 far .. +1 near
        const scale = s * (1 + Math.sin((t / v.pb) * TAU * 0.7 + i) * v.breathe)
        // Gentle bank into the turn: devices lean as they sweep round the sides.
        const lean = Math.cos(a) * -6 * v.tilt + Math.sin((t / v.ps) * TAU) * 1.2

        node.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(4)}) rotate(${lean.toFixed(2)}deg)`
        // Depth-sort against each other, and in front of / behind the head.
        node.style.zIndex = String(HEAD_Z + Math.round(depth * 90) + (depth >= 0 ? 1 : -1))
        node.style.setProperty('--depth', ((depth + 1) / 2).toFixed(3))
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
