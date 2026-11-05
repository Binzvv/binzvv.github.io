import { useEffect, useReducer, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion'
import { reducer, initialState, saveMemory, suggestion } from './machine.js'
import { MODES } from './content.js'
import Field from './components/Field.jsx'
import Intro from './components/Intro.jsx'
import IntentSwitch from './components/IntentSwitch.jsx'
import Nudge from './components/Nudge.jsx'
import Explore from './modes/Explore.jsx'
import Focus from './modes/Focus.jsx'
import Surprise from './modes/Surprise.jsx'

export default function App() {
  const [state, send] = useReducer(reducer, undefined, initialState)
  const [preview, setPreview] = useState(null) // intro hover previews a mode's behaviour in the field
  const panRef = useRef({ x: 0, y: 0 })
  const { status, memory } = state

  useEffect(() => saveMemory(memory), [memory])
  useEffect(() => {
    if (status !== 'explore') panRef.current = { x: 0, y: 0 }
    setPreview(null)
  }, [status])

  const nudge = suggestion(state)

  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 90, damping: 20 }}>
      <LayoutGroup>
        <Field mode={status === 'intro' ? preview ?? 'intro' : status} panRef={panRef} />

        {/* Wordmark — present everywhere except Focus, where nothing unnecessary survives. */}
        <AnimatePresence>
          {status !== 'intro' && status !== 'focus' && (
            <motion.div
              key="wordmark"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-none fixed left-4 top-4 z-40 sm:left-6 sm:top-5"
            >
              <motion.p layoutId="wordmark" className="label hidden text-bone/70 sm:block">
                The site that changes its mind
              </motion.p>
              <p className="label text-ash/70 sm:mt-1">currently {MODES[status].verb}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 h-full w-full">
          <AnimatePresence>
            {status === 'intro' && <Intro key="intro" state={state} send={send} onPreview={setPreview} />}
            {status === 'explore' && <Explore key="explore" state={state} send={send} panRef={panRef} />}
            {status === 'focus' && <Focus key="focus" state={state} send={send} />}
            {status === 'surprise' && <Surprise key="surprise" state={state} send={send} />}
          </AnimatePresence>
        </main>

        {/* A brief "change of mind" between behaviours */}
        <AnimatePresence>
          {status !== 'intro' && (
            <motion.div
              key={'veil-' + status}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.3, times: [0, 0.2, 0.6, 1], ease: 'easeInOut' }}
            >
              <span className="label text-signal">→ now {MODES[status].verb}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {status !== 'intro' && <IntentSwitch status={status} memory={memory} send={send} />}
        <Nudge nudge={nudge} send={send} />
      </LayoutGroup>
    </MotionConfig>
  )
}
