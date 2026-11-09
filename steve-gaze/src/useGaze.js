import { useEffect, useRef, useState } from 'react'
import { CENTRE, frameIndex } from './frames.js'

// Tuning ------------------------------------------------------------------
const TAU_TRACK = 0.06 // s — smoothing time constant while the pointer is present
const TAU_RETURN = 0.32 // s — slower, gentle drift back to neutral
const ENTER_X = 0.22 // normalised distance from head centre to enter a side zone
const ENTER_Y = 0.24
const HYST = 0.06 // hysteresis band: leave a zone only below ENTER - HYST
const MIN_HOLD = 0.07 // s — minimum time a frame is held before switching again
const TOUCH_RELEASE_DELAY = 700 // ms before a lifted finger lets the head return

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
 * smooths it, and maps it to one of nine gaze frames relative to `originRef`.
 */
export function useGaze(originRef, debugRef) {
  const [frames, setFrames] = useState({ active: CENTRE, prev: CENTRE })

  const s = useRef({
    target: null, // {x, y} or null when the pointer is away
    pos: null, // smoothed position
    col: 0,
    row: 0,
    lastSwitch: 0,
    origin: { x: 0, y: 0, rx: 1, ry: 1 },
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
      if (el) {
        const r = el.getBoundingClientRect()
        x = r.left + r.width / 2
        y = r.top + r.height * 0.46 // roughly eye level within the frame
      }
      // Normalise so the far edge of the viewport on each side reads as |1|.
      st.origin = { x, y, rx: Math.max(x, w - x, 1), ry: Math.max(y, h - y, 1) }
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

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const o = st.origin
      const goal = st.target ?? { x: o.x, y: o.y }
      if (!st.pos) st.pos = { x: o.x, y: o.y }

      const tau = st.target ? TAU_TRACK : TAU_RETURN
      const k = 1 - Math.exp(-dt / tau)
      st.pos.x += (goal.x - st.pos.x) * k
      st.pos.y += (goal.y - st.pos.y) * k

      const nx = (st.pos.x - o.x) / o.rx
      const ny = (st.pos.y - o.y) / o.ry
      const col = zone(st.col, nx, ENTER_X)
      const row = zone(st.row, ny, ENTER_Y)

      const t = now / 1000
      if ((col !== st.col || row !== st.row) && t - st.lastSwitch >= MIN_HOLD) {
        st.col = col
        st.row = row
        st.lastSwitch = t
        const next = frameIndex(col, row)
        // React only re-renders on an actual change; `prev` stays underneath while `active` fades in.
        setFrames((f) => (f.active === next ? f : { active: next, prev: f.active }))
      }

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
  }, [originRef, debugRef])

  return frames
}
