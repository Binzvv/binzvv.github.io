import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MODES } from '../content.js'

// The only persistent control: a quiet segmented switch. In Focus it collapses
// to the current intent and expands on hover, tap or the I key. A suggested
// intent gets a small marker, so the system's idea shows up in the control itself.
export default function IntentSwitch({ status, send, suggested }) {
  const [expanded, setExpanded] = useState(false)
  const collapsed = status === 'focus' && !expanded

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'i' || e.key === 'I') setExpanded((x) => !x)
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => setExpanded(false), [status])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 sm:pb-6">
      <motion.nav
        layout
        aria-label="Change what you need"
        onMouseEnter={() => status === 'focus' && setExpanded(true)}
        onMouseLeave={() => status === 'focus' && setExpanded(false)}
        className={`pointer-events-auto flex items-center gap-0.5 rounded-full border border-hair bg-white/75 p-1 shadow-[0_8px_30px_rgba(13,13,16,0.06)] backdrop-blur-xl transition-opacity duration-500 ${
          collapsed ? 'opacity-70' : 'opacity-100'
        }`}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {Object.entries(MODES).map(([m, d]) => {
          const active = m === status
          if (collapsed && !active) return null
          return (
            <motion.button
              layout="position"
              key={m}
              onClick={() => (active ? setExpanded(true) : send({ type: 'CHOOSE', mode: m }))}
              className={`relative whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium transition-colors sm:px-5 sm:text-[14px] ${
                active ? 'text-white' : 'text-quiet hover:text-ink'
              }`}
              aria-current={active ? 'true' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="seg"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{d.word}</span>
              {suggested === m && !active && <span className="pulse-dot absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-ultra" />}
            </motion.button>
          )
        })}
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              onClick={() => send({ type: 'RESET' })}
              className="overflow-hidden whitespace-nowrap rounded-full border-l border-hair px-3 py-2 text-[13px] font-medium text-quiet hover:text-ink sm:px-4"
              title="Clear what this site remembers about your visits"
            >
              Forget me
            </motion.button>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  )
}
