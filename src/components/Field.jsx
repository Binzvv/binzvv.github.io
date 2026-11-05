import { useEffect, useRef } from 'react'

// One persistent canvas behind every mode. Five flat, wobbling colour shapes
// that never unmount: they peek in at the start, roam in Explore, leave the
// room in Focus, and swell to take over the screen in Surprise. Switching
// intent is the same shapes changing behaviour, not a page load.
//
// Each preset gives every blob a target (fractions of the viewport), a radius
// (fraction of the short side), a wobble and a cursor response.
const COLORS = ['#C6F24A', '#FFA3D7', '#2B4BFF', '#FFD23F', '#FF5A36']

const PRESETS = {
  intro: { pos: [[1.02, 0.08], [0.5, 1.12], [-0.06, 0.62], [1.06, 0.86], [0.78, -0.12]], r: [0.3, 0.26, 0.2, 0.14, 0.12], wob: 0.06, speed: 0.5, push: 0.3 },
  'peek-explore': { pos: [[0.82, 0.32], [0.62, 0.92], [0.9, 0.78], [1.08, 0.5], [0.66, 0.1]], r: [0.36, 0.2, 0.16, 0.18, 0.14], wob: 0.12, speed: 1, push: 0.6 },
  'peek-focus': { pos: [[1.5, 0.08], [0.5, 1.6], [-0.6, 0.62], [1.6, 0.86], [0.78, -0.7]], r: [0.3, 0.26, 0.2, 0.14, 0.12], wob: 0.01, speed: 0.2, push: 0 },
  'peek-surprise': { pos: [[0.84, 0.5], [0.72, 0.2], [0.9, 0.84], [0.62, 0.66], [1.0, 0.16]], r: [0.5, 0.22, 0.24, 0.16, 0.14], wob: 0.22, speed: 2.4, push: -0.4 },
  explore: { pos: [[0.12, 0.22], [0.88, 0.3], [0.3, 0.9], [0.78, 0.86], [0.55, 0.55]], r: [0.2, 0.16, 0.07, 0.13, 0.08], wob: 0.12, speed: 1, push: 0.8 },
  focus: { pos: [[1.6, -0.4], [1.6, 1.4], [-0.6, 1.4], [-0.6, -0.4], [0.5, 1.8]], r: [0.2, 0.2, 0.2, 0.2, 0.2], wob: 0, speed: 0.2, push: 0 },
  surprise: { pos: [[0.5, 0.5], [0.2, 0.2], [0.8, 0.8], [0.8, 0.2], [0.2, 0.8]], r: [1.4, 0.2, 0.2, 0.16, 0.16], wob: 0.25, speed: 2.6, push: -0.3 },
}

export default function Field({ mode = 'intro', panRef }) {
  const ref = useRef(null)
  const target = useRef(PRESETS.intro)

  useEffect(() => {
    target.current = PRESETS[mode] ?? PRESETS.intro
  }, [mode])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    const mouse = { x: -9999, y: -9999 }
    const blobs = COLORS.map((c, i) => ({
      c,
      x: PRESETS.intro.pos[i][0],
      y: PRESETS.intro.pos[i][1],
      r: PRESETS.intro.r[i],
      vx: 0,
      vy: 0,
      phase: i * 1.7,
    }))
    const p = { wob: 0.06, speed: 0.5, push: 0.3 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const move = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move, { passive: true })

    const blob = (cx, cy, r, t, wob, seed) => {
      const n = 9
      const pts = []
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const k = 1 + wob * (Math.sin(t * 1.3 + i * 2.1 + seed) * 0.6 + Math.sin(t * 0.7 + i * 1.3 + seed * 2) * 0.4)
        pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k])
      }
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const [x0, y0] = pts[i]
        const [x1, y1] = pts[(i + 1) % n]
        const mx = (x0 + x1) / 2
        const my = (y0 + y1) / 2
        if (i === 0) ctx.moveTo(mx, my)
        else ctx.quadraticCurveTo(x0, y0, mx, my)
      }
      const [x0, y0] = pts[0]
      const [x1, y1] = pts[1]
      ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      ctx.closePath()
      ctx.fill()
    }

    let last = performance.now()
    let t = 0
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const tg = target.current
      for (const k in p) p[k] += (tg[k] - p[k]) * 0.05
      t += reduce ? 0 : dt * p.speed

      ctx.clearRect(0, 0, w, h)
      const short = Math.min(w, h)
      const pan = panRef?.current ?? { x: 0, y: 0 }

      blobs.forEach((b, i) => {
        // spring toward this mode's spot for the blob
        const tx = tg.pos[i][0]
        const ty = tg.pos[i][1]
        b.vx = (b.vx + (tx - b.x) * 0.012) * 0.9
        b.vy = (b.vy + (ty - b.y) * 0.012) * 0.9
        b.x += b.vx
        b.y += b.vy
        b.r += (tg.r[i] - b.r) * 0.04

        let cx = b.x * w + Math.sin(t + b.phase) * 18
        let cy = b.y * h + Math.cos(t * 0.8 + b.phase) * 18
        // depth: each blob drifts with the explore pan at its own rate
        cx += pan.x * (0.05 + i * 0.03)
        cy += pan.y * (0.05 + i * 0.03)
        const r = b.r * short

        const dx = cx - mouse.x
        const dy = cy - mouse.y
        const d = Math.hypot(dx, dy) || 1
        if (d < r + 160 && p.push) {
          const f = (1 - d / (r + 160)) * 60 * p.push
          cx += (dx / d) * f
          cy += (dy / d) * f
        }
        ctx.fillStyle = b.c
        blob(cx, cy, r, t, p.wob, b.phase)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
    }
  }, [panRef])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
}
