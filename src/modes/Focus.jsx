import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PROJECTS } from '../content.js'
import { center, indexOf, mass, useFormation } from '../formation.js'
import { THRESHOLDS, useDwell } from '../engine.js'
import { Deeper } from './Explore.jsx'

// FOCUS — navigation is linear and singular. One project, one action.
// The order is decided by behaviour: what you lingered on in Explore comes
// first, what you've already read sinks to the end.

export default function Focus({ state, send }) {
  const order = useMemo(() => {
    const { opened, read } = state.memory
    return [...PROJECTS].sort((a, b) => {
      const ra = read.includes(a.id) ? 1 : 0
      const rb = read.includes(b.id) ? 1 : 0
      if (ra !== rb) return ra - rb
      return (opened[b.id] ?? 0) - (opened[a.id] ?? 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [i, setI] = useState(() => Math.max(0, order.findIndex((p) => p.id === state.focusId)))
  const [reading, setReading] = useState(false)
  const [dir, setDir] = useState(1)
  const shownAt = useRef(Date.now())
  const readBefore = useRef(state.memory.read).current
  const p = order[i]
  const anchor = useRef(null)
  useDwell(p.id, send)
  const deep = state.engine.deep === p.id

  // "Continue with…", "See related…" and kept projects bring a project forward here.
  const jumpN = state.engine.jump?.n
  useEffect(() => {
    const id = state.engine.jump?.id
    const k = order.findIndex((x) => x.id === id)
    if (k >= 0 && k !== i) {
      setDir(k > i ? 1 : -1)
      setReading(false)
      setI(k)
    }
  }, [jumpN]) // eslint-disable-line react-hooks/exhaustive-deps
  // Asking for more opens the reading layer too.
  useEffect(() => {
    if (deep) setReading(true)
  }, [deep])
  const live = useRef({})
  live.current = { lead: indexOf[p.id], reading }

  // Every form gathers into one calm mass. The current project's form leads it;
  // moving to the next project visibly re-sorts the mass around a new lead.
  useFormation(
    (t, w, h) => {
      const a = center(anchor.current) ?? { x: w * 0.27, y: h * 0.5, w: 400, h: 400 }
      const R = Math.min(a.w, a.h) * (live.current.reading ? 0.22 : 0.27)
      return mass(a.x, a.y, R, t, live.current.lead, 0.35)
    },
    [],
    { stiffness: 0.035, soft: 0.05 },
  )

  useEffect(() => {
    send({ type: 'SHOW', id: p.id })
    shownAt.current = Date.now()
  }, [p.id, send])

  const go = (d) => {
    const ms = Date.now() - shownAt.current
    if (d > 0 && !reading && ms < THRESHOLDS.skipWindow) send({ type: 'SKIP', id: p.id, ms })
    setDir(d)
    setReading(false)
    setI((n) => (n + d + order.length) % order.length)
  }

  const primary = () => {
    if (!reading) {
      setReading(true)
      send({ type: 'READ', id: p.id })
    } else go(1)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        primary()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const opened = state.memory.opened[p.id] ?? 0
  const why = readBefore.includes(p.id)
    ? 'You have read this before.'
    : opened > 0
      ? `Ranked up: you opened it ${opened === 1 ? 'once' : opened + ' times'}.`
      : i === 0
        ? 'Default order. Open projects in Explore to change it.'
        : null

  return (
    <motion.section
      className="absolute inset-0 overflow-y-auto no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.4 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      {/* progress: the only chrome besides the switch */}
      <div className="fixed left-0 right-0 top-0 z-20 h-px bg-hair">
        <motion.div
          className="h-full origin-left bg-ink"
          animate={{ scaleX: (i + 1) / order.length }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      <motion.div
        className="mx-auto grid min-h-full w-full max-w-7xl items-center gap-2 px-5 pb-28 pt-20 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) go(1)
          else if (info.offset.x > 70) go(-1)
        }}
      >
        <div ref={anchor} className="h-[24vh] lg:h-[60vh]" aria-hidden="true" />

        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={p.id}
            custom={dir}
            initial={{ opacity: 0, y: 24 * dir, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -24 * dir, filter: 'blur(8px)', transition: { duration: 0.25 } }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.1, 1] }}
            className="min-w-0"
          >
            <p className="tnum text-[13px] text-quiet">
              {String(i + 1).padStart(2, '0')} / {String(order.length).padStart(2, '0')}
            </p>
            <motion.h1
              layoutId={`title-${p.id}`}
              className="balance mt-3 text-[clamp(2.8rem,6.5vw,6.2rem)] font-light leading-[0.98] tracking-display"
            >
              {p.title}
            </motion.h1>
            <p className="mt-5 max-w-2xl text-[clamp(1.2rem,1.8vw,1.55rem)] leading-snug text-ink/80">{p.line}</p>

            <AnimatePresence initial={false}>
              {reading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-w-[60ch] border-l border-hair pl-5 pt-1">
                    <p className="mt-6 text-[13px] text-quiet">
                      {p.kind} · {p.year}
                    </p>
                    <p className="mt-2 text-[17px] leading-relaxed text-ink/75">{p.body}</p>
                    <p className="mt-4 text-[17px] italic text-ink">“{p.quote}”</p>
                    <Deeper p={p} open={deep} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                onClick={primary}
                className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-ultra"
              >
                {reading ? 'Next project' : 'Read it'}
                <span className="transition-transform group-hover:translate-x-0.5">{reading ? '→' : '↓'}</span>
              </button>
              {why && <p className="text-[13px] text-quiet">{why}</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="pointer-events-none fixed bottom-7 right-8 hidden text-[13px] text-quiet lg:block">← → to move · Enter to read</p>
    </motion.section>
  )
}
