import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PROJECTS } from '../content.js'

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

  useEffect(() => {
    send({ type: 'SHOW', id: p.id })
    shownAt.current = Date.now()
  }, [p.id, send])

  const go = (d) => {
    if (d > 0 && !reading && Date.now() - shownAt.current < 4000) send({ type: 'SKIP' })
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
      ? `First, because you opened it ${opened === 1 ? 'once' : opened + ' times'} while wandering.`
      : i === 0
        ? 'Start here.'
        : null

  return (
    <motion.section
      className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8 } }}
      exit={{ opacity: 0, y: -40, transition: { duration: 0.5, ease: 'easeIn' } }}
    >
      {/* progress: the only chrome */}
      <div className="fixed left-0 right-0 top-0 z-20 h-px bg-smoke">
        <motion.div
          className="h-px origin-left bg-signal"
          animate={{ scaleX: (i + 1) / order.length }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      <motion.div
        className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-5 py-20 sm:px-10"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) go(1)
          else if (info.offset.x > 70) go(-1)
        }}
      >
        <p className="label mb-6 tabular-nums text-ash">
          {String(i + 1).padStart(2, '0')} / {String(order.length).padStart(2, '0')}
        </p>

        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={p.id}
            custom={dir}
            initial={{ opacity: 0, y: 60 * dir }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 * dir, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          >
            <motion.h1 layoutId={`title-${p.id}`} className="text-display font-serif">
              {p.title}
            </motion.h1>
            <p className="mt-6 max-w-2xl font-serif text-2xl italic leading-snug text-ash sm:text-3xl">{p.line}</p>

            <AnimatePresence initial={false}>
              {reading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-w-[52ch] pt-8">
                    <p className="label text-ash">
                      {p.kind} · {p.year}
                    </p>
                    <p className="mt-4 text-[15px] leading-relaxed text-bone/85">{p.body}</p>
                    <p className="mt-6 font-serif text-xl italic text-bone">“{p.quote}”</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={primary}
              className="group mt-12 inline-flex items-baseline gap-4 font-serif text-3xl sm:text-4xl"
            >
              <span className="underline decoration-signal decoration-1 underline-offset-[10px]">
                {reading ? 'Next project' : 'Read it'}
              </span>
              <span className="text-signal transition-transform group-hover:translate-x-2">{reading ? '→' : '↓'}</span>
            </button>
            {why && <p className="label mt-5 text-ash/70">{why}</p>}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="label pointer-events-none fixed bottom-5 right-5 hidden text-ash/50 sm:block">← → · enter</p>
    </motion.section>
  )
}
