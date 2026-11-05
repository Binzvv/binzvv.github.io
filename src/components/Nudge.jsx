import { AnimatePresence, motion } from 'framer-motion'

// The site proposing to change its own behaviour. It speaks from the mind
// (bottom-left), as a message bubble, because it is the site's idea, not a UI alert.
export default function Nudge({ nudge, send }) {
  return (
    <AnimatePresence>
      {nudge && (
        <motion.aside
          key={nudge.key}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: 0.6, type: 'spring', stiffness: 260, damping: 20 } }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          style={{ originX: 0, originY: 1 }}
          className="fixed bottom-24 left-4 z-[55] max-w-[min(22rem,calc(100vw-2rem))] rounded-[26px] rounded-bl-md bg-white p-4 shadow-[0_6px_0_rgba(21,21,21,0.15)] ring-[3px] ring-ink sm:bottom-28 sm:left-6"
          role="status"
        >
          <p className="text-sm font-semibold text-tomato">I’m changing my mind</p>
          <p className="mt-1 text-lg font-semibold leading-snug">{nudge.text}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={() => send(nudge.event)} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-cobalt">
              {nudge.cta} →
            </button>
            <button
              onClick={() => send({ type: 'DISMISS_NUDGE', key: nudge.key })}
              className="rounded-full px-3 py-2 text-sm font-bold text-mute hover:text-ink"
            >
              No, stay
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
