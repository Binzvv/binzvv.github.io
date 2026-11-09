import { useEffect, useRef, useState } from 'react'
import { FRAMES } from './frames.js'
import { useGaze } from './useGaze.js'

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

function initialDebug() {
  try {
    return new URLSearchParams(location.search).has('debug')
  } catch {
    return false
  }
}

export default function App() {
  const headRef = useRef(null)
  const debugRef = useRef(null)
  const ready = usePreload(FRAMES)
  const { active, prev } = useGaze(headRef, debugRef)
  const [debug, setDebug] = useState(initialDebug)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) setDebug((d) => !d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="stage">
      <div className={`head ${ready ? 'is-ready' : ''}`} ref={headRef}>
        <div className="float" role="img" aria-label="Portrait character whose gaze follows your cursor">
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

      <button
        type="button"
        className="debug-toggle"
        aria-pressed={debug}
        onClick={() => setDebug((d) => !d)}
      >
        debug
      </button>

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
