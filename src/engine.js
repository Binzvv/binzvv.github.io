import { useEffect, useRef } from 'react'

// Browser-side observers for the behavioural engine. They watch only
// observable input (pointer, keys, scroll, touch, tab visibility) and report
// plain events to the state machine. No content is changed from here.

export const THRESHOLDS = {
  skips: 3, // consecutive skips
  skipWindow: 4000, // a project/scene left within this time without reading counts as a skip
  dwell: 15000, // active time on one project
  activeWithin: 5000, // input within this window counts as "active" for dwell
  idle: 30000, // no input → reduce motion
  away: 15000, // tab hidden at least this long → returning
  revisits: 3, // same project opened this many times
  breadth: 5, // projects opened in one session
  expire: 25000, // an unanswered suggestion quietly goes away
}

// Live readings, read by the Field (motion), timers and the debug overlay.
export const live = {
  last: Date.now(),
  idle: false,
  hiddenAt: null,
  dwell: { id: null, ms: 0 },
}

const INPUT = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']

// Inactivity + returning. Mounted once in App.
export function useActivity(send) {
  useEffect(() => {
    const touch = () => {
      live.last = Date.now()
      if (live.idle) {
        live.idle = false
        document.documentElement.classList.remove('is-idle')
        send({ type: 'IDLE', on: false })
      }
    }
    INPUT.forEach((t) => window.addEventListener(t, touch, { passive: true, capture: true }))
    const tick = setInterval(() => {
      if (!live.idle && document.visibilityState === 'visible' && Date.now() - live.last >= THRESHOLDS.idle) {
        live.idle = true
        document.documentElement.classList.add('is-idle')
        send({ type: 'IDLE', on: true })
      }
    }, 1000)
    const vis = () => {
      if (document.visibilityState === 'hidden') live.hiddenAt = Date.now()
      else if (live.hiddenAt) {
        const away = Date.now() - live.hiddenAt
        live.hiddenAt = null
        live.last = Date.now()
        if (away >= THRESHOLDS.away) send({ type: 'RETURN', away })
      }
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      INPUT.forEach((t) => window.removeEventListener(t, touch, { capture: true }))
      clearInterval(tick)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [send])
}

// Dwell: active time spent with one project. Time only counts while the tab is
// visible and the visitor has given input in the last few seconds, so leaving a
// project open in the background is not "interest".
export function useDwell(id, send) {
  const sent = useRef(null)
  useEffect(() => {
    live.dwell = { id, ms: 0 }
    if (!id) return
    const step = 500
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - live.last > THRESHOLDS.activeWithin) return
      live.dwell = { id, ms: live.dwell.ms + step }
      if (live.dwell.ms >= THRESHOLDS.dwell && sent.current !== id) {
        sent.current = id
        send({ type: 'DWELL', id, ms: live.dwell.ms })
      }
    }, step)
    return () => {
      clearInterval(t)
      live.dwell = { id: null, ms: 0 }
    }
  }, [id, send])
}
