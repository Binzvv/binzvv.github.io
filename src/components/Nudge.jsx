import { AnimatePresence, motion } from 'framer-motion'

// A suggestion, stated as an observation plus an offer. It sits just above the
// intent switch, names what was observed, and is always easy to decline.
export default function Nudge({ nudge, send }) {
  return (
    <AnimatePresence>
      {nudge && (
        <motion.aside
          key={nudge.key}
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.8, duration: 0.5 } }}
          exit={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          className="pointer-events-none fixed inset-x-0 bottom-[4.6rem] z-[55] flex justify-center px-4 sm:bottom-[5.6rem]"
          role="status"
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-2xl border border-hair bg-white/75 px-4 py-2.5 text-[14px] backdrop-blur-xl">
            <span className="flex items-center gap-2 text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ultra" />
              {nudge.text}
            </span>
            <span className="flex items-center gap-3">
              <button onClick={() => send(nudge.event)} className="font-medium text-ultra hover:text-ink">
                {nudge.cta}
              </button>
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
