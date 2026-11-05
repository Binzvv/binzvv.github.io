import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { THRESHOLDS } from '../engine.js'

// A suggestion: one observation and a few choices, sitting just above the
// intent switch. It never blocks content, is always easy to decline, and
// quietly goes away if left unanswered. Nothing happens unless a choice is made.
export default function Nudge({ nudge, send }) {
  useEffect(() => {
    if (!nudge) return
    const t = setTimeout(() => send({ type: 'EXPIRE', key: nudge.key }), THRESHOLDS.expire)
    return () => clearTimeout(t)
  }, [nudge, send])

  return (
    <AnimatePresence>
      {nudge && (
        <motion.aside
          key={nudge.key}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.6, duration: 0.5 } }}
          exit={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          className="pointer-events-none fixed inset-x-0 bottom-[4.6rem] z-[55] flex justify-center px-4 sm:bottom-[5.6rem]"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-hair bg-white/75 px-4 py-2.5 text-[14px] backdrop-blur-xl">
            <span className="flex items-center gap-2 text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ultra" />
              {nudge.text}
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {nudge.actions.map((a, i) => (
                <button
                  key={a.label}
                  onClick={() => {
                    send({ type: 'ACCEPT', key: nudge.key, choice: a.label })
                    send(a.event)
                  }}
                  className={`font-medium hover:text-ink ${i === 0 ? 'text-ultra' : 'text-ink/80'}`}
                >
                  {a.label}
                </button>
              ))}
              <button onClick={() => send({ type: 'DISMISS_NUDGE', key: nudge.key })} className="text-quiet hover:text-ink">
                Not now
              </button>
            </span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
