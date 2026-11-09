import { useEffect, useRef, useState } from 'react'
import { CENTRE, frameIndex } from './frames.js'

// Tracking ----------------------------------------------------------------
// The pointer is followed by a damped spring rather than a plain lerp, so the
// gaze eases off the mark and settles with a little weight (inertia).
const SPRING_TRACK = { w: 15, zeta: 0.82 } // rad/s, damping ratio: lively, ~2% overshoot
const SPRING_RETURN = { w: 6.5, zeta: 1 } // slower, no overshoot when drifting home
const ENTER_X = 0.22 // normalised distance from head centre to enter a side zone
const ENTER_Y = 0.24
const HYST = 0.06 // hysteresis band: leave a zone only below ENTER - HYST
const MIN_HOLD = 0.08 // s — minimum time a frame is held before switching again
const TOUCH_RELEASE_DELAY = 700 // ms before a lifted finger lets the head return

// Head motion -------------------------------------------------------------
// Momentum lean: the head drifts a few pixels in the direction of travel while
// the gaze is moving, and comes back to exactly zero (no transform) at rest.
const LEAN_MAX = 0.006 // fraction of head size (~4px on desktop)
const LEAN_GAIN = 0.0012 // per px/s of smoothed pointer speed
// Directional motion blur, only during a frame change: rises and falls on a
// half-sine over BLUR_TIME, along the axis of the gaze change.
const BLUR_TIME = 0.17 // s
const BLUR_PEAK = 0.0034 // fraction of head size (~2.4px std-dev on desktop)

/**
 * Per-axis zone with hysteresis. Returns -1, 0 or 1.
 * Entering a side zone needs |n| > enter + HYST; leaving it needs |n| < enter - HYST.
 */
function zone(current, n, enter) {
  const a = Math.abs(n)
  const sign = n < 0 ? -1 : 1
  if (current === 0) return a > enter + HYST ? sign : 0
  if (sign !== current && a > enter + HYST) return sign // jumped straight across
  if (a < enter - HYST) return 0
  return current
}

/**
 * Tracks the pointer across the whole viewport with requestAnimationFrame,
 * smooths it with a spring, and maps it to one of nine gaze frames relative
 * to `originRef`. Optionally drives a momentum lean and directional blur on
 * `motion.current = { el, blur }` (blur is an <feGaussianBlur>).
 */
export function useGaze(originRef, debugRef, motion, reducedMotion = false) {
  const [frames, setFrames] = useState({ active: CENTRE, prev: CENTRE })

  const s = useRef({
    target: null, // {x, y} or null when the pointer is away
    pos: null, // smoothed position
    vel: { x: 0, y: 0 },
    col: 0,
    row: 0,
    lastSwitch: 0,
    blur: { t0: -1, x: 0, y: 0 },
    lean: { x: 0, y: 0 },
    styled: false, // whether the motion element currently has inline styles
    origin: { x: 0, y: 0, rx: 1, ry: 1, size: 1 },
  })

  useEffect(() => {
    const st = s.current
    let raf = 0
    let last = performance.now()
    let releaseTimer = 0

    const measure = () => {
      const el = originRef.current
      const w = window.innerWidth
      const h = window.innerHeight
      let x = w / 2
      let y = h / 2
      let size = Math.min(w, h)
      if (el) {
        const r = el.getBoundingClientRect()
        x = r.left + r.width / 2
        y = r.top + r.height * 0.46 // roughly eye level within the frame
        size = r.width
      }
      // Normalise so the far edge of the viewport on each side reads as |1|.
      st.origin = { x, y, rx: Math.max(x, w - x, 1), ry: Math.max(y, h - y, 1), size }
    }

    const setTarget = (x, y) => {
      clearTimeout(releaseTimer)
      st.target = { x, y }
      if (!st.pos) st.pos = { x: st.origin.x, y: st.origin.y }
    }
    const release = () => {
      st.target = null
    }

    const onMove = (e) => setTarget(e.clientX, e.clientY)
    const onDown = (e) => setTarget(e.clientX, e.clientY)
    const onUp = (e) => {
      if (e.pointerType !== 'mouse') {
        clearTimeout(releaseTimer)
        releaseTimer = setTimeout(release, TOUCH_RELEASE_DELAY)
      }
    }
    const onOut = (e) => {
      if (!e.relatedTarget) release() // pointer left the window
    }
    const onVisibility = () => document.hidden && release()

    /** Semi-implicit Euler spring step, sub-stepped for stability. */
    const stepSpring = (dt, goal, { w, zeta }) => {
      const k = w * w
      const c = 2 * zeta * w
      const n = Math.ceil(dt / (1 / 120))
      const h = dt / n
      for (let i = 0; i < n; i++) {
        st.vel.x += (k * (goal.x - st.pos.x) - c * st.vel.x) * h
        st.vel.y += (k * (goal.y - st.pos.y) - c * st.vel.y) * h
        st.pos.x += st.vel.x * h
        st.pos.y += st.vel.y * h
      }
    }

    const applyMotion = (t, dt) => {
      const m = motion?.current
      if (!m?.el) return
      const size = st.origin.size

      // Momentum lean from the smoothed pointer velocity, eased toward its goal.
      const clamp = (v) => Math.max(-1, Math.min(1, v))
      const goalX = reducedMotion ? 0 : clamp(st.vel.x * LEAN_GAIN) * LEAN_MAX * size
      const goalY = reducedMotion ? 0 : clamp(st.vel.y * LEAN_GAIN) * LEAN_MAX * size * 0.7
      const k = 1 - Math.exp(-dt / 0.09)
      st.lean.x += (goalX - st.lean.x) * k
      st.lean.y += (goalY - st.lean.y) * k
      if (Math.abs(st.lean.x) < 0.05 && Math.abs(goalX) < 0.05) st.lean.x = 0
      if (Math.abs(st.lean.y) < 0.05 && Math.abs(goalY) < 0.05) st.lean.y = 0

      // Directional blur envelope.
      let bx = 0
      let by = 0
      const b = st.blur
      if (b.t0 >= 0) {
        const p = (t - b.t0) / BLUR_TIME
        if (p >= 1) b.t0 = -1
        else {
          const env = Math.sin(Math.PI * p) * BLUR_PEAK * size
          bx = env * b.x
          by = env * b.y
        }
      }

      const moving = st.lean.x !== 0 || st.lean.y !== 0 || bx > 0.02 || by > 0.02
      if (moving) {
        m.el.style.transform = `translate3d(${st.lean.x.toFixed(2)}px, ${st.lean.y.toFixed(2)}px, 0)`
        if (bx > 0.02 || by > 0.02) {
          m.blur?.setAttribute('stdDeviation', `${bx.toFixed(2)} ${by.toFixed(2)}`)
          m.el.style.filter = 'url(#gaze-motion-blur)'
        } else {
          m.el.style.filter = ''
        }
        st.styled = true
      } else if (st.styled) {
        // At rest: no transform and no filter, so the face is pixel-sharp.
        m.el.style.transform = ''
        m.el.style.filter = ''
        st.styled = false
      }
    }

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      const o = st.origin
      const goal = st.target ?? { x: o.x, y: o.y }
      if (!st.pos) st.pos = { x: o.x, y: o.y }

      stepSpring(dt, goal, st.target ? SPRING_TRACK : SPRING_RETURN)

      const nx = (st.pos.x - o.x) / o.rx
      const ny = (st.pos.y - o.y) / o.ry
      const col = zone(st.col, nx, ENTER_X)
      const row = zone(st.row, ny, ENTER_Y)

      if ((col !== st.col || row !== st.row) && t - st.lastSwitch >= MIN_HOLD) {
        // Blur along the axis of the gaze change (diagonals share it evenly).
        const dc = Math.abs(col - st.col)
        const dr = Math.abs(row - st.row)
        const diag = dc && dr ? Math.SQRT1_2 : 1
        if (!reducedMotion) st.blur = { t0: t, x: dc * diag, y: dr * diag }
        st.col = col
        st.row = row
        st.lastSwitch = t
        const next = frameIndex(col, row)
        // React only re-renders on an actual change; `prev` stays underneath while `active` fades in.
        setFrames((f) => (f.active === next ? f : { active: next, prev: f.active }))
      }

      applyMotion(t, dt)

      const dbg = debugRef?.current
      if (dbg) {
        dbg.dot.style.transform = `translate(${st.pos.x}px, ${st.pos.y}px)`
        dbg.values.textContent = `x ${nx.toFixed(2)}  y ${ny.toFixed(2)}`
      }

      raf = requestAnimationFrame(tick)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (originRef.current) ro.observe(originRef.current)
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('mouseout', onOut)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(releaseTimer)
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [originRef, debugRef, motion, reducedMotion])

  return frames
}
