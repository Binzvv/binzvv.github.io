import { motion } from 'motion/react'
import { MODES, MODE_ORDER } from '../data/content'

const ease = [0.22, 1, 0.36, 1]

export default function Opening({ hover, setHover, onChoose, onGoRun, returning, leaving }) {
  const m = hover ? MODES[hover] : null
  // The question's own width & weight respond to the intention being considered.
  const wdth = m ? m.wdth : 100
  const wght = m ? m.wght : 640

  return (
    <motion.section
      key="opening"
      className="fixed inset-0 z-20 flex flex-col justify-end px-5 pb-8 sm:px-10 sm:pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1.2, ease }}
    >
      <div className="max-w-[1400px]">
        {returning?.wentRunning && (
          <motion.p className="label mb-6 opacity-60" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.2, duration: 1.2 }}>
            Last time, you left to run. Good.
          </motion.p>
        )}
        <motion.h1
          className="vt select-none leading-[0.86] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(46px, 9.4vw, 172px)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0, '--wdth': wdth, '--wght': wght }}
          transition={{ duration: 1.1, ease, opacity: { duration: 1.6 }, y: { duration: 1.6, ease } }}
        >
          WHAT ARE YOU
          <br />
          CHASING?
        </motion.h1>

        <ul className="mt-8 flex flex-col gap-1 sm:mt-12 sm:flex-row sm:items-end sm:gap-14" onMouseLeave={() => setHover(null)}>
          {MODE_ORDER.map((id, i) => {
            const mode = MODES[id]
            const dim = hover && hover !== id
            return (
              <motion.li key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: dim ? 0.28 : 1, y: 0 }} transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease, opacity: { duration: 0.5 } }}>
                <button
                  className="group block text-left"
                  onMouseEnter={() => setHover(id)}
                  onFocus={() => setHover(id)}
                  onClick={() => onChoose(id)}
                  aria-label={`${mode.word} — ${mode.verb}`}
                >
                  <span className="label block opacity-50">
                    0{i + 1} — {mode.verb}
                  </span>
                  <motion.span
                    className="vt block leading-none"
                    style={{ fontSize: 'clamp(34px, 4.8vw, 84px)' }}
                    animate={{ '--wdth': hover === id ? mode.wdth : 100, '--wght': hover === id ? mode.wght : 520 }}
                    transition={{ duration: id === 'push' ? 0.3 : id === 'escape' ? 1.4 : 0.8, ease }}
                  >
                    {mode.word}
                  </motion.span>
                </button>
              </motion.li>
            )
          })}
        </ul>

        <div className="mt-6 flex flex-col items-start gap-3 sm:mt-10 sm:h-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <motion.p className="label" key={hover || 'none'} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6 }}>
            {m ? m.line : 'Three intentions. Choose one — you can always change direction.'}
          </motion.p>
          <motion.button
            className="label underline-grow shrink-0 opacity-60 hover:opacity-100"
            onClick={onGoRun}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            Or skip all this — go run.
          </motion.button>
        </div>
      </div>
    </motion.section>
  )
}
