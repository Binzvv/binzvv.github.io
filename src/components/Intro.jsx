import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MODES, byId } from '../content.js'

const ORDER = ['explore', 'focus', 'surprise']

function ago(ts) {
  if (!ts) return ''
  const s = (Date.now() - ts) / 1000
  if (s < 90) return 'a moment ago'
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`
  return `${Math.round(s / 86400)} days ago`
}

export default function Intro({ state, send, onPreview }) {
  const { memory, returning } = state
  const [asking, setAsking] = useState(!returning)
  const [hover, setHover] = useState(null)

  const preview = (m) => {
    setHover(m)
    onPreview(m)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (!asking && e.key === 'Enter') return send({ type: 'RESUME' })
      const m = ORDER[Number(e.key) - 1]
      if (asking && m) send({ type: 'CHOOSE', mode: m })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [asking, send])

  const opened = Object.values(memory.opened).reduce((a, b) => a + b, 0)
  const last = memory.lastProject && byId[memory.lastProject]

  return (
    <motion.section
      className="absolute inset-0 flex flex-col justify-between px-4 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-8"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.5 } }}
    >
      <header className="flex items-start justify-between gap-6">
        <motion.p layoutId="wordmark" className="label text-bone/80">
          The site that changes its mind
        </motion.p>
        <p className="label hidden text-right text-ash sm:block">
          Behavioural experiment 01
          <br />
          No homepage · no menu · no fixed journey
        </p>
      </header>

      {asking ? (
        <div className="flex flex-1 flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 1, ease: [0.2, 0.7, 0.1, 1] }}
            className="font-serif text-[clamp(2.4rem,6.4vw,6.2rem)] leading-[0.92] tracking-tight"
          >
            What do you need
            <br />
            <em className="text-ash">right now?</em>
          </motion.h1>

          <ul className="mt-10 flex flex-col gap-1 sm:mt-16" onMouseLeave={() => preview(null)}>
            {ORDER.map((m, i) => (
              <motion.li
                key={m}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: hover && hover !== m ? 0.25 : 1, x: hover === m ? 18 : 0 }}
                transition={{ delay: hover === null ? 0.4 + i * 0.12 : 0, type: 'spring', stiffness: 160, damping: 22 }}
              >
                <button
                  onMouseEnter={() => preview(m)}
                  onFocus={() => preview(m)}
                  onClick={() => send({ type: 'CHOOSE', mode: m })}
                  className="group flex w-full items-baseline gap-4 text-left sm:gap-8"
                >
                  <span className="label w-6 shrink-0 text-ash">0{i + 1}</span>
                  <span className="font-serif text-[clamp(3.4rem,8vw,7.5rem)] leading-[0.95] tracking-tight">
                    {MODES[m].word}
                    <span className="text-signal opacity-0 transition-opacity group-hover:opacity-100">.</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>

          {/* The behaviour contract for each intent — what actually changes. */}
          <div className="pointer-events-none absolute right-10 top-1/2 hidden w-[22rem] -translate-y-1/2 lg:block">
            <motion.div
              key={hover ?? 'idle'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            >
              <p className="label text-signal">{hover ? `If you choose ${MODES[hover].word.toLowerCase()}` : 'Same site. Three behaviours.'}</p>
              <dl className="mt-5 border-t border-smoke">
                {(hover ? MODES[hover].rules : [['navigation', '?'], ['order', '?'], ['content', '?'], ['you', '?']]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-smoke py-3">
                    <dt className="label text-ash">{k}</dt>
                    <dd className="text-right font-serif text-xl italic leading-tight text-bone">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.2, 0.7, 0.1, 1] }}
            className="font-serif text-[clamp(2.8rem,8vw,8rem)] leading-[0.9] tracking-tight"
          >
            You came back.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-xl font-serif text-xl italic leading-snug text-ash sm:text-2xl"
          >
            Last time, {ago(memory.updatedAt)}, you were {MODES[memory.lastMode].verb}
            {last ? <> and lingering on “{last.title}”</> : null}. {opened} opened ·{' '}
            {memory.discoveries.length} secrets found · {memory.switches} changes of mind.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <button
              onClick={() => send({ type: 'RESUME' })}
              className="font-serif text-3xl underline decoration-signal decoration-1 underline-offset-8 sm:text-4xl"
            >
              Continue {MODES[memory.lastMode].verb} →
            </button>
            <button onClick={() => setAsking(true)} className="label text-bone/80 hover:text-bone">
              Ask me again
            </button>
            <button onClick={() => send({ type: 'RESET' })} className="label text-ash hover:text-signal">
              Forget me
            </button>
          </motion.div>
        </div>
      )}

      <footer className="flex min-h-[3.5rem] items-end justify-between gap-6">
        <motion.p
          key={hover ?? 'none'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md font-mono text-xs leading-relaxed text-ash"
        >
          {asking
            ? hover
              ? MODES[hover].promise
              : 'Choose a behaviour. You can change your mind at any time — so can the site.'
            : 'Memory lives only in this browser.'}
        </motion.p>
        {asking && <p className="label hidden text-ash/60 sm:block">Press 1 · 2 · 3</p>}
      </footer>
    </motion.section>
  )
}
