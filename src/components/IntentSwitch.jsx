import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { MODES } from '../content.js'

// The site's "mind": a small character that is also the only persistent control.
// Its body changes with the current behaviour, its eyes follow you, and it says
// out loud when it changes its mind. Tap it (or press I) to change intent.

const LOOK = {
  intro: { bg: '#FFD23F', radius: '50%', rotate: 0 },
  explore: { bg: '#C6F24A', radius: '58% 42% 55% 45% / 48% 60% 40% 52%', rotate: -6 },
  focus: { bg: '#FFFFFF', radius: '14px', rotate: 0 },
  surprise: { bg: '#FF5A36', radius: '28% 72% 30% 70% / 70% 30% 70% 30%', rotate: 12 },
}

const SAYS = {
  intro: 'Hi. What do you need?',
  explore: 'Okay. Let’s wander.',
  focus: 'Okay. Quiet now.',
  surprise: 'Okay. My turn.',
}

function Mind({ status, onClick }) {
  const ref = useRef(null)
  const lx = useMotionValue(0)
  const ly = useMotionValue(0)
  const sx = useSpring(lx, { stiffness: 300, damping: 25 })
  const sy = useSpring(ly, { stiffness: 300, damping: 25 })

  useEffect(() => {
    const on = (e) => {
      const b = ref.current?.getBoundingClientRect()
      if (!b) return
      const dx = e.clientX - (b.left + b.width / 2)
      const dy = e.clientY - (b.top + b.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 200) * 4.5
      lx.set((dx / d) * k)
      ly.set((dy / d) * k)
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [lx, ly])

  const look = LOOK[status]
  const sleepy = status === 'focus'

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      aria-label="Change what you need"
      className="relative flex h-14 w-14 items-center justify-center gap-1.5 shadow-[0_5px_0_rgba(21,21,21,0.18)] ring-[3px] ring-ink"
      animate={{
        backgroundColor: look.bg,
        borderRadius: look.radius,
        rotate: status === 'surprise' ? [12, -12, 12] : look.rotate,
      }}
      transition={
        status === 'surprise'
          ? { rotate: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }, default: { type: 'spring', stiffness: 160, damping: 14 } }
          : { type: 'spring', stiffness: 160, damping: 14 }
      }
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      {[0, 1].map((i) => (
        <span key={i} className="relative h-[15px] w-[15px] overflow-hidden rounded-full bg-white ring-2 ring-ink">
          <motion.span className="absolute left-1/2 top-1/2 -ml-[4px] -mt-[4px] h-2 w-2 rounded-full bg-ink" style={{ x: sx, y: sy }} />
          <motion.span
            className="absolute inset-x-0 top-0 bg-ink"
            initial={false}
            animate={{ height: sleepy ? '55%' : '0%' }}
          />
        </span>
      ))}
    </motion.button>
  )
}

export default function IntentSwitch({ status, send }) {
  const [open, setOpen] = useState(false)
  const [line, setLine] = useState(SAYS[status])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if ((e.key === 'i' || e.key === 'I') && status !== 'intro') setOpen((o) => !o)
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  // Say it out loud whenever the behaviour changes.
  useEffect(() => {
    setOpen(false)
    setLine(SAYS[status])
    const t = setTimeout(() => setLine(null), 2600)
    return () => clearTimeout(t)
  }, [status])

  const tap = () => {
    if (status === 'intro') {
      setLine('Pick one. I’ll change to fit.')
      setTimeout(() => setLine(null), 2400)
    } else setOpen((o) => !o)
  }

  const quiet = status === 'focus' && !open

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] flex items-end gap-3 transition-opacity duration-500 sm:bottom-6 sm:left-6 ${
        quiet ? 'opacity-40 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <Mind status={status} onClick={tap} />

      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ originX: 0, originY: 1 }}
            className="flex flex-col gap-1 rounded-[26px] rounded-bl-md bg-white p-3 shadow-[0_6px_0_rgba(21,21,21,0.15)] ring-[3px] ring-ink"
          >
            <p className="px-3 pb-1 pt-1 text-sm font-semibold text-mute">What do you need now?</p>
            {Object.entries(MODES).map(([m, d]) => (
              <button
                key={m}
                onClick={() => send({ type: 'CHOOSE', mode: m })}
                className={`rounded-2xl px-3 py-1.5 text-left font-display text-2xl font-extrabold transition-colors ${
                  m === status ? 'bg-lime' : 'hover:bg-ground'
                }`}
              >
                {d.word}
                {m === status && <span className="ml-2 align-middle font-sans text-sm font-semibold">· now</span>}
              </button>
            ))}
            <div className="mt-1 flex justify-between gap-6 px-3 pb-1">
              <button onClick={() => send({ type: 'RESET' })} className="text-sm font-semibold text-tomato hover:underline">
                Forget me
              </button>
              <button onClick={() => setOpen(false)} className="text-sm font-semibold text-mute hover:text-ink">
                Close <span className="hidden sm:inline">· I</span>
              </button>
            </div>
          </motion.div>
        ) : (
          line && (
            <motion.p
              key={line}
              initial={{ opacity: 0, scale: 0.6, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ originX: 0, originY: 1 }}
              className="mb-1 whitespace-nowrap rounded-[20px] rounded-bl-md bg-ink px-4 py-2 text-[15px] font-semibold text-white"
              role="status"
            >
              {line}
            </motion.p>
          )
        )}
      </AnimatePresence>
    </div>
  )
}
