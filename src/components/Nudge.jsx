import { AnimatePresence, motion } from 'framer-motion'

// The site proposing to change its own behaviour.
export default function Nudge({ nudge, send }) {
  return (
    <AnimatePresence>
      {nudge && (
        <motion.aside
          key={nudge.key}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-16 right-4 z-[55] max-w-[19rem] border-l border-signal bg-ink py-1 pl-4 sm:bottom-20 sm:right-6 sm:max-w-sm"
          role="status"
        >
          <p className="label text-signal">The site is changing its mind</p>
          <p className="mt-2 font-serif text-xl leading-snug">{nudge.text}</p>
          <div className="mt-3 flex gap-5">
            <button
              onClick={() => send(nudge.event)}
              className="label text-bone underline decoration-signal underline-offset-4"
            >
              {nudge.cta} →
            </button>
            <button onClick={() => send({ type: 'DISMISS_NUDGE', key: nudge.key })} className="label text-ash hover:text-bone">
              Stay
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
