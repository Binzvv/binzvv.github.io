import { useEffect, useRef, useState } from 'react'
import { FRAMES } from './frames.js'
import { useGaze } from './useGaze.js'
import Orbit from './Orbit.jsx'

/** Preload and decode every frame so switching never waits on the network. */
function usePreload(frames) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all(
      frames.map(
        (f) =>
          new Promise((resolve) => {
            const img = new Image()
            img.src = f.src
            const done = () => resolve()
            if (img.decode) img.decode().then(done, done)
            else img.onload = img.onerror = done
          }),
      ),
    ).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [frames])
  return ready
}

function param(name) {
  try {
    return new URLSearchParams(location.search).get(name)
  } catch {
    return null
  }
}

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export default function App() {
  const headRef = useRef(null)
  const debugRef = useRef(null)
  const ready = usePreload(FRAMES)
  const motionRef = useRef(null)
  const motionEl = useRef(null)
  const blurEl = useRef(null)
  const [debug, setDebug] = useState(() => param('debug') !== null)
  const [effects, setEffects] = useState(() => param('effects') !== '0')
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    motionRef.current = { el: motionEl.current, blur: blurEl.current }
  }, [])
  const { active, prev } = useGaze(headRef, debugRef, motionRef, reducedMotion)

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'd') setDebug((d) => !d)
      if (e.key === 'e') setEffects((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="stage">
      <div className={`head ${ready ? 'is-ready' : ''}`} ref={headRef}>
        <div className="float" role="img" aria-label="Portrait character whose gaze follows your cursor">
          <div className="motion" ref={motionEl}>
          {FRAMES.map((f, i) => (
            <img
              key={f.file}
              src={f.src}
              alt=""
              draggable="false"
              decoding="async"
              className={i === active ? 'frame is-active' : i === prev ? 'frame is-prev' : 'frame'}
            />
          ))}
          </div>
        </div>
      </div>

      {/* Directional motion blur, applied to the head only while it changes gaze. */}
      <svg className="defs" aria-hidden="true" focusable="false">
        <filter id="gaze-motion-blur" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
          <feGaussianBlur ref={blurEl} stdDeviation="0 0" edgeMode="none" />
        </filter>
      </svg>

      {effects && <Orbit headRef={headRef} visible={ready} reducedMotion={reducedMotion} />}

      <div className="toggles">
        <button type="button" className="toggle" aria-pressed={effects} onClick={() => setEffects((v) => !v)}>
          effects
        </button>
        <button type="button" className="toggle" aria-pressed={debug} onClick={() => setDebug((d) => !d)}>
          debug
        </button>
      </div>

      {debug && <DebugPanel active={active} debugRef={debugRef} />}
    </main>
  )
}

function DebugPanel({ active, debugRef }) {
  const dot = useRef(null)
  const values = useRef(null)
  useEffect(() => {
    debugRef.current = { dot: dot.current, values: values.current }
    return () => {
      debugRef.current = null
    }
  }, [debugRef])

  return (
    <>
      <div className="debug-dot" ref={dot} aria-hidden="true" />
      <div className="debug-panel" aria-live="polite">
        <div className="debug-grid" aria-hidden="true">
          {FRAMES.map((f, i) => (
            <span key={f.file} className={i === active ? 'on' : ''} />
          ))}
        </div>
        <div>
          <strong>{FRAMES[active].name}</strong>
          <div className="debug-values" ref={values} />
        </div>
      </div>
    </>
  )
}
