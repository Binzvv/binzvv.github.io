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
        <Field mode={status === 'intro' ? (preview ? `peek-${preview}` : 'intro') : status} panRef={panRef} />

        {/* The name reads as a sentence about what the site is doing. Gone in Focus. */}
        <AnimatePresence>
          {status !== 'intro' && status !== 'focus' && (
            <motion.p
              key="wordmark"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`pointer-events-none fixed left-4 top-4 z-40 max-w-[15rem] font-display ${
                status === 'surprise' ? 'rounded-2xl bg-white px-3 py-1.5 ring-2 ring-ink' : ''
              } text-[15px] font-extrabold leading-tight sm:left-6 sm:top-5 sm:max-w-none sm:text-base`}
            >
              <motion.span layoutId="wordmark" className="w-wide">
                The site that changes its mind
              </motion.span>{' '}
              <span className="font-sans font-semibold text-mute">is {MODES[status].verb}.</span>
            </motion.p>
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

        <IntentSwitch status={status} send={send} />
        <Nudge nudge={nudge} send={send} />
      </LayoutGroup>
    </MotionConfig>
  )
}
