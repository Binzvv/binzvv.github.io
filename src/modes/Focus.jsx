import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PROJECTS } from '../content.js'
import Sticker from '../components/Sticker.jsx'

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
      ? `Here because you opened it ${opened === 1 ? 'once' : opened + ' times'} while wandering.`
      : i === 0
        ? 'Start here.'
        : null

  return (
    <motion.section
      className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6 } }}
      exit={{ opacity: 0, y: -40, transition: { duration: 0.45, ease: 'easeIn' } }}
    >
      {/* progress: the only chrome */}
      <div className="fixed left-0 right-0 top-0 z-20 h-1.5 bg-ink/10">
        <motion.div
          className="h-full origin-left bg-ink"
          animate={{ scaleX: (i + 1) / order.length }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      <motion.div
        className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center px-5 pb-28 pt-14 sm:px-10"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) go(1)
          else if (info.offset.x > 70) go(-1)
        }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={p.id}
            custom={dir}
            initial={{ opacity: 0, x: 80 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 * dir, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-12"
          >
            <motion.div layoutId={`art-${p.id}`} className="w-fit">
              <Sticker id={p.id} size={reading ? 150 : 230} tilt={0} className="transition-[width,height] duration-500" />
            </motion.div>

            <div className="min-w-0">
              <p className="tnum text-[15px] font-bold text-mute">
                {i + 1} of {order.length}
              </p>
              <motion.h1
                layoutId={`title-${p.id}`}
                className="w-cond mt-2 font-display text-[clamp(3.4rem,11vw,9.5rem)] font-black uppercase leading-[0.82] [text-wrap:balance]"
              >
                {p.title}
              </motion.h1>
              <p className="mt-4 max-w-2xl text-2xl font-bold leading-snug sm:text-[1.7rem]">{p.line}</p>

              <AnimatePresence initial={false}>
                {reading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="max-w-[60ch] pt-5">
                      <p className="text-[15px] font-bold text-mute">
                        {p.kind}, {p.year}
                      </p>
                      <p className="mt-2 text-lg leading-relaxed">{p.body}</p>
                      <p className="mt-4 inline-block rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-lg font-bold ring-2 ring-ink">
                        “{p.quote}”
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  onClick={primary}
                  className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-display text-xl font-extrabold text-white shadow-[0_5px_0_rgba(21,21,21,0.2)] hover:bg-cobalt sm:text-2xl"
                >
                  {reading ? 'Next project' : 'Read it'}
                  <span className="transition-transform group-hover:translate-x-1">{reading ? '→' : '↓'}</span>
                </button>
                {why && <p className="text-[15px] font-semibold text-mute">{why}</p>}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="pointer-events-none fixed bottom-6 right-6 hidden text-sm font-semibold text-mute sm:block">← → to move · Enter to read</p>
    </motion.section>
  )
}
