import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MODES } from '../content.js'

// The only persistent control: a quiet way to change intent. Press "I" anywhere.
export default function IntentSwitch({ status, send }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'i' || e.key === 'I') setOpen((o) => !o)
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => setOpen(false), [status])

  const quiet = status === 'focus' && !open

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] transition-opacity duration-500 sm:bottom-6 sm:left-6 ${
        quiet ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col gap-3 bg-ink/90 py-2 pr-4"
          >
            <p className="label text-ash">Change your mind</p>
            {Object.entries(MODES).map(([m, d]) => (
              <button
                key={m}
                onClick={() => send({ type: 'CHOOSE', mode: m })}
                className={`text-left font-serif text-3xl leading-none transition-colors ${
                  m === status ? 'text-signal' : 'text-bone hover:text-signal'
                }`}
              >
                {d.word}
                {m === status && <span className="label ml-3 align-middle text-ash">current</span>}
              </button>
            ))}
            <div className="mt-1 flex gap-5">
              <button onClick={() => send({ type: 'RESET' })} className="label text-ash hover:text-signal">
                Forget me
              </button>
              <button onClick={() => setOpen(false)} className="label text-ash hover:text-bone">
                Close
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="group flex items-center gap-3"
            aria-label="Change intent"
          >
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full border border-bone/60 transition-transform group-hover:scale-150" />
              <span className="h-1 w-1 rounded-full bg-signal" />
            </span>
            <span className="label text-bone/70 group-hover:text-bone">
              intent: {MODES[status].word.toLowerCase()}
              <span className="ml-2 hidden text-ash sm:inline">[i]</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
