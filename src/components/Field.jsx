import { useEffect, useRef } from 'react'

// One persistent canvas behind every mode. It never unmounts, so switching
// intent feels like the same space changing behaviour rather than a new page.
// Each mode is a set of target parameters; the canvas eases toward them.
const PRESETS = {
  intro: { alpha: 0.32, drift: 0.35, repel: 40, jitter: 0, accent: 0, size: 1.1, wave: 1 },
  explore: { alpha: 0.42, drift: 0.9, repel: 120, jitter: 0, accent: 0.015, size: 1.2, wave: 1.4 },
  focus: { alpha: 0.08, drift: 0, repel: 0, jitter: 0, accent: 0, size: 0.9, wave: 0 },
  surprise: { alpha: 0.5, drift: 0.2, repel: -60, jitter: 2.2, accent: 0.05, size: 1.5, wave: 3 },
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
    let dpr = 1
    let raf = 0
    const p = { ...PRESETS.intro }
    const mouse = { x: -9999, y: -9999 }
    const GAP = 34

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
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
    const leave = () => {
      mouse.x = mouse.y = -9999
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', leave)

    const tick = (now) => {
      const t = now / 1000
      const tg = target.current
      for (const k in p) p[k] += (tg[k] - p[k]) * 0.04

      ctx.clearRect(0, 0, w, h)
      const pan = panRef?.current ?? { x: 0, y: 0 }
      // Parallax: the grid moves at a fraction of the explore pan.
      const ox = ((pan.x * 0.25) % GAP + GAP) % GAP
      const oy = ((pan.y * 0.25) % GAP + GAP) % GAP

      for (let gx = -GAP; gx < w + GAP; gx += GAP) {
        for (let gy = -GAP; gy < h + GAP; gy += GAP) {
          let x = gx + ox
          let y = gy + oy
          if (!reduce) {
            x += Math.sin(t * 0.6 + gy * 0.01) * 4 * p.drift
            y += Math.cos(t * 0.5 + gx * 0.012) * 4 * p.drift
            if (p.jitter > 0.05) {
              x += Math.sin(t * 7 + gx * 13.1 + gy) * p.jitter
              y += Math.cos(t * 6 + gy * 7.3 + gx) * p.jitter
            }
          }
          const dx = x - mouse.x
          const dy = y - mouse.y
          const d2 = dx * dx + dy * dy
          const R = 160
          let s = p.size
          if (d2 < R * R && Math.abs(p.repel) > 1) {
            const d = Math.sqrt(d2) || 1
            const f = (1 - d / R) ** 2
            x += (dx / d) * f * p.repel * 0.4
            y += (dy / d) * f * p.repel * 0.4
            s += f * 1.6
          }
          const wave = p.wave * 0.5 * (1 + Math.sin(t * 0.8 - (gx + gy) * 0.006))
          const hash = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453) % 1
          const isAccent = hash < p.accent
          ctx.globalAlpha = Math.min(1, p.alpha * (0.55 + wave * 0.3))
          ctx.fillStyle = isAccent ? '#ff4a1c' : '#e8e4da'
          ctx.fillRect(x - s / 2, y - s / 2, s, s)
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', leave)
    }
  }, [panRef])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
}
