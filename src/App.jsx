import { useEffect, useMemo, useReducer, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion'
import { reducer, initialState, saveMemory, suggestion } from './machine.js'
import { DISCOVERIES, MODES, PROJECTS, byId } from './content.js'
import Field from './components/Field.jsx'
import Intro from './components/Intro.jsx'
import IntentSwitch from './components/IntentSwitch.jsx'
import Nudge from './components/Nudge.jsx'
import Explore from './modes/Explore.jsx'
import Focus from './modes/Focus.jsx'
import Surprise from './modes/Surprise.jsx'

// What the system says it is doing while it reorganises. Every line names a
// real operation, with real counts from state, so the transition explains itself.
function reasoning(status, state) {
  const { memory, focusId } = state
  const opened = Object.keys(memory.opened).length
  if (status === 'explore')
    return ['Releasing the layout', `Placing ${PROJECTS.length} projects in space`, 'Mapping shared themes']
  if (status === 'focus')
    return [
      'Reducing to one composition',
      opened ? `Ranking by the ${opened} you opened` : 'Using the default order',
      focusId ? `Starting with ${byId[focusId].title}` : 'Hiding everything else',
    ]
  if (status === 'surprise') {
    const n = Object.values(memory.opened).reduce((a, b) => a + b, 0) + memory.discoveries.length + memory.switches
    return ['Taking the lead', `Curating from ${n} recorded interactions`, 'Skip or pause at any time']
  }
  return []
}

function steady(status, state) {
  const { memory, session } = state
  if (status === 'explore') return `${session.opens} opened · ${memory.discoveries.length} of ${DISCOVERIES.length} notes found`
  if (status === 'focus') return 'One project at a time'
  if (status === 'surprise') return `Scene ${memory.scenes}`
  return ''
}

function Status({ status, state }) {
  const [run, setRun] = useState({ status, step: 0 })
  const lines = useMemo(() => reasoning(status, state), [status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setRun({ status, step: 0 })
    const ids = [1, 2, 3].map((n) => setTimeout(() => setRun({ status, step: n }), n * 560))
    return () => ids.forEach(clearTimeout)
  }, [status])
  const step = run.status === status ? run.step : 0
  const thinking = step < 3 && lines.length > 0
  const text = thinking ? lines[step] : steady(status, state)
  return (
    <div className="flex items-center gap-2.5 text-[13px] font-medium text-quiet sm:justify-end">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`absolute inset-0 rounded-full ${thinking ? 'pulse-dot bg-ultra' : 'bg-ink/25'}`} />
      </span>
      <motion.span
        key={text}
        initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.3 }}
        className="tnum"
      >
        {text}
      </motion.span>
    </div>
  )
}

export default function App() {
  const [state, send] = useReducer(reducer, undefined, initialState)
  const [preview, setPreview] = useState(null)
  const { status, memory } = state

  useEffect(() => saveMemory(memory), [memory])
  useEffect(() => setPreview(null), [status])

  const nudge = suggestion(state)

  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 120, damping: 22 }}>
      <LayoutGroup>
        <Field />

        <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col gap-1.5 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-8 sm:pt-6">
          <motion.p layout className="whitespace-nowrap text-[14px] font-medium tracking-snug sm:text-[15px]">
            The Site That Changes Its Mind
            <AnimatePresence>
              {status !== 'intro' && (
                <motion.span
                  key={status}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="ml-2 text-quiet"
                >
                  / {MODES[status].word}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.p>
          {status !== 'intro' && <Status status={status} state={state} />}
        </header>

        <main className="relative z-10 h-full w-full">
          <AnimatePresence>
            {status === 'intro' && <Intro key="intro" state={state} send={send} preview={preview} onPreview={setPreview} />}
            {status === 'explore' && <Explore key="explore" state={state} send={send} />}
            {status === 'focus' && <Focus key="focus" state={state} send={send} />}
            {status === 'surprise' && <Surprise key="surprise" state={state} send={send} />}
          </AnimatePresence>
        </main>

        {status !== 'intro' && <IntentSwitch status={status} send={send} suggested={nudge?.event?.mode} />}
        <Nudge nudge={nudge} send={send} />
      </LayoutGroup>
    </MotionConfig>
  )
}
