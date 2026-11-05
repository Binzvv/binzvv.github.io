import { AnimatePresence, motion } from 'motion/react'
import { MODES } from '../data/content'

/*
  The signature moment. Stages are driven by App:
  1 secondary content fades · 2 controls recede · 3 photograph fills the frame
  4 motion slows · 5 complexity reduces · 6 the message · 7 a quiet way back
*/
export default function Gone({ stage, mode, onReturn, reduced }) {
  const m = mode ? MODES[mode] : null
  const veil = m?.id === 'push' ? '#0E0E0C' : '#E9E6DF'
  const ink = m?.id === 'push' ? '#EDEBE5' : '#121211'
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      {/* complexity reduces: the image flattens toward a single tone */}
      <motion.div className="absolute inset-0" style={{ background: veil }} initial={{ opacity: 0 }} animate={{ opacity: stage >= 5 ? 0.62 : 0 }} transition={{ duration: reduced ? 0.8 : 3.6, ease: [0.16, 1, 0.3, 1] }} />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center" style={{ color: ink }}>
        <AnimatePresence>
          {stage >= 6 && (
            <motion.h2
              className="vt leading-[0.86]"
              style={{ fontSize: 'clamp(56px, 12vw, 230px)', '--wdth': 125 }}
              initial={{ opacity: 0, letterSpacing: reduced ? '0em' : '0.18em', '--wght': 200 }}
              animate={{ opacity: 1, letterSpacing: '-0.01em', '--wght': 720 }}
              transition={{ duration: reduced ? 0.8 : 3.2, ease: [0.16, 1, 0.3, 1] }}
            >
              GO RUN.
            </motion.h2>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {stage >= 6 && (
            <motion.p
              className="vt mt-4"
              style={{ fontSize: 'clamp(18px, 2.4vw, 40px)', '--wdth': 125, '--wght': 300, letterSpacing: '0.2em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ delay: reduced ? 0.4 : 1.8, duration: reduced ? 0.6 : 2.4 }}
            >
              WE’LL BE HERE.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {stage >= 7 && (
          <motion.div
            className="pointer-events-auto absolute inset-x-0 bottom-0 flex justify-center pb-8 sm:pb-10"
            style={{ color: ink }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 2.4 }}
          >
            <button className="label underline-grow" onClick={onReturn}>
              {m ? `Back already? Return to ${m.word}` : 'Back already? Return'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
