import { AnimatePresence, motion } from 'motion/react'
import { useEngine } from '../engine/engine'
import { byId, MODES } from '../data/content'
import { useState } from 'react'

/* The one primary action. Same words everywhere; its posture changes with the mode. */
export function GoRunButton({ mode, onClick, className = '', size = 'md' }) {
  const styles = {
    escape: 'border border-white/70 text-white hover:bg-white hover:text-ink',
    push: 'bg-signal text-ink hover:bg-bone tracking-[0.04em]',
    wander: 'bg-ink text-bone hover:bg-transparent hover:text-ink border border-ink',
  }
  const pad = size === 'lg' ? 'px-7 py-5 text-[15px]' : 'px-5 py-3.5 text-[13px]'
  return (
    <button
      onClick={onClick}
      className={`vt tracking-[0.12em] transition-colors duration-300 ${pad} ${styles[mode] || styles.wander} ${className}`}
      style={mode === 'push' ? { '--wdth': 70, '--wght': 900, fontSize: size === 'lg' ? 22 : 17 } : { '--wdth': 112, '--wght': 760 }}
    >
      GO RUN.
    </button>
  )
}

/* Minimal chrome: wordmark returns to the question. Memory is visible and controllable. */
export function Chrome({ tone, mode, onHome, onOpenStory, hidden }) {
  const { consent, setConsent, memory, forget } = useEngine()
  const [open, setOpen] = useState(false)
  const kept = memory.saved.map(byId).filter(Boolean)
  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-[45] flex items-start justify-between px-5 pt-5 sm:px-10 sm:pt-8"
      style={{ color: tone }}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? -12 : 0 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="pointer-events-auto text-left" onClick={onHome} aria-label="Back to the question">
        <span className="vt block text-[15px] tracking-[0.28em]" style={{ '--wdth': 125, '--wght': 700 }}>
          ELSEWHERE
        </span>
        <span className="label mt-1 block opacity-50">{mode ? `${MODES[mode].word} · change direction` : 'Experiment 02'}</span>
      </button>

      <div className="pointer-events-auto relative text-right">
        <button className="label opacity-60 hover:opacity-100" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {consent ? `Memory on${kept.length ? ` · kept ${kept.length}` : ''}` : 'Memory off'}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="absolute right-0 top-7 w-[260px] bg-bone p-4 text-left text-ink shadow-[0_0_0_1px_#12121115]"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <p className="label opacity-50">What this device remembers</p>
              {consent ? (
                <>
                  <ul className="mt-3 space-y-1 text-[13px]">
                    <li>Last direction: {memory.lastMode ? MODES[memory.lastMode].word : '—'}</li>
                    <li>Last story: {memory.lastStory ? byId(memory.lastStory)?.title : '—'}</li>
                    <li>Went running: {memory.wentRunning ? 'yes' : 'not yet'}</li>
                  </ul>
                  {kept.length > 0 && (
                    <>
                      <p className="label mt-4 opacity-50">Kept</p>
                      <ul className="mt-2 space-y-1">
                        {kept.map((s) => (
                          <li key={s.id}>
                            <button
                              className="underline-grow text-[13px]"
                              onClick={() => {
                                setOpen(false)
                                onOpenStory(s)
                              }}
                            >
                              {s.title} <span className="opacity-40">— {MODES[s.mode].word}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <button
                    className="label underline-grow mt-5 opacity-70"
                    onClick={() => {
                      forget()
                      setOpen(false)
                    }}
                  >
                    Forget everything & start fresh
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-[13px] leading-snug">Nothing is stored. Choices last only until you close this tab.</p>
                  <button className="label underline-grow mt-4" onClick={() => setConsent(true)}>
                    Remember my choices on this device
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

/* One quiet voice. States what it observed, never what it assumes. */
export function SuggestionLine({ tone = 'light', hidden }) {
  const { suggestion, accept, dismiss } = useEngine()
  const dark = tone === 'dark'
  return (
    <AnimatePresence>
      {suggestion && !hidden && (
        <motion.aside
          key={suggestion.id}
          role="status"
          className={`fixed bottom-28 right-5 z-[60] max-w-[min(400px,calc(100vw-40px))] p-4 sm:bottom-32 sm:right-10 ${dark ? 'bg-ink text-bone' : 'bg-bone text-ink'}`}
          initial={{ opacity: 0, y: 14, clipPath: 'inset(0 0 100% 0)' }}
          animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.5 } }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {suggestion.basis && <p className="label opacity-50">{suggestion.basis}</p>}
          <p className="vt mt-1 text-[19px] leading-tight" style={{ '--wdth': 100, '--wght': 600 }}>
            {suggestion.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {suggestion.actions.map((a) => (
              <button key={a.value} className="label underline-grow" onClick={() => accept(a.value)}>
                {a.label}
              </button>
            ))}
            <button className="label underline-grow opacity-50" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/* Asked once, quietly, after the first meaningful choice. */
export function ConsentLine({ show, tone }) {
  const { setConsent } = useEngine()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="label fixed right-5 top-14 z-[55] flex max-w-[calc(100vw-40px)] flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:right-10 sm:top-[68px]"
          style={{ color: tone }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <span>Remember your choices on this device?</span>
          <button className="underline-grow" onClick={() => setConsent(true)}>
            Yes
          </button>
          <button className="underline-grow opacity-60" onClick={() => setConsent(false)}>
            Not now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Note({ text, tone }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          key={text}
          className="label pointer-events-none fixed left-1/2 top-6 z-[55] -translate-x-1/2 sm:top-9"
          style={{ color: tone }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
