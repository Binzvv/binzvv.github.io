import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MODES, byId } from '../content.js'

const ORDER = ['explore', 'focus', 'surprise']

// The three intents are physical objects: drag them about, tap one to commit.
// Each one's shape and type already behaves like the mode it stands for.
const CHOICE = {
  explore: {
    cls: 'bg-lime w-[15.5rem] h-[11rem] sm:w-[19rem] sm:h-[13rem]',
    radius: '58% 42% 55% 45% / 48% 60% 40% 52%',
    tilt: -7,
    word: 'w-wide text-[2.1rem] sm:text-[2.6rem]',
    sub: 'wander around',
  },
  focus: {
    cls: 'bg-white w-[12rem] h-[9.5rem] sm:w-[14rem] sm:h-[11rem] ring-[3px] ring-ink',
    radius: '14px',
    tilt: 3,
    word: 'w-cond text-[3.2rem] sm:text-[4rem]',
    sub: 'one thing at a time',
  },
  surprise: {
    cls: 'bg-tomato w-[14rem] h-[14rem] sm:w-[17rem] sm:h-[17rem]',
    radius: '0',
    tilt: 9,
    clip: 'polygon(50% 0%,61% 18%,82% 8%,80% 30%,100% 36%,86% 52%,100% 68%,79% 72%,80% 94%,61% 84%,50% 100%,39% 84%,18% 93%,20% 72%,0% 66%,14% 50%,0% 34%,21% 30%,18% 7%,39% 18%)',
    word: 'w-norm whitespace-pre-line text-[1.9rem] sm:text-[2.3rem]',
    sub: 'let the site drive',
  },
}

function ago(ts) {
  if (!ts) return ''
  const s = (Date.now() - ts) / 1000
  if (s < 90) return 'a moment ago'
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`
  return `${Math.round(s / 86400)} days ago`
}

const Hi = ({ children }) => <span className="rounded-md bg-lime px-1.5 font-bold text-ink">{children}</span>

export default function Intro({ state, send, onPreview }) {
  const { memory, returning } = state
  const [asking, setAsking] = useState(!returning)
  const [hover, setHover] = useState(null)
  const dragged = useRef(false)

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
      className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden px-4 pb-24 pt-4 no-scrollbar sm:px-8 sm:pt-6"
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.45 } }}
    >
      <header className="flex items-start justify-between gap-6">
        <motion.p layoutId="wordmark" className="w-wide font-display text-base font-extrabold">
          The site that changes its mind
        </motion.p>
        <p className="hidden max-w-[19rem] text-right text-sm font-semibold leading-snug text-mute sm:block">
          Experiment 01. No homepage, no menu, no fixed journey.
        </p>
      </header>

      {asking ? (
        <div className="flex flex-1 flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 80, damping: 16 }}
            className="mt-8 font-display font-black uppercase leading-[0.86] tracking-[-0.02em] sm:mt-10"
          >
            <span className="w-cond block text-[clamp(3.4rem,10vw,9.5rem)]">What do you</span>
            <span className="w-wide block text-[clamp(1.9rem,6.4vw,6.4rem)]">need right now?</span>
          </motion.h1>

          <ul
            className="relative mt-6 flex flex-1 flex-wrap items-center justify-center gap-y-2 sm:mt-2 lg:justify-start lg:pl-[6vw]"
            onMouseLeave={() => preview(null)}
          >
            {ORDER.map((m, i) => {
              const c = CHOICE[m]
              return (
                <motion.li
                  key={m}
                  className="-mx-3 sm:mx-1"
                  style={{ zIndex: hover === m ? 5 : 1 }}
                  initial={{ opacity: 0, scale: 0.4, rotate: c.tilt * 3 }}
                  animate={{ opacity: hover && hover !== m ? 0.55 : 1, scale: hover === m ? 1.06 : 1, rotate: hover === m ? 0 : c.tilt }}
                  transition={{ delay: hover === null ? 0.35 + i * 0.12 : 0, type: 'spring', stiffness: 200, damping: 14 }}
                >
                  <motion.button
                    drag
                    dragMomentum
                    dragElastic={0.3}
                    whileDrag={{ scale: 1.1, rotate: 0 }}
                    onPointerDown={() => (dragged.current = false)}
                    onDragStart={() => (dragged.current = true)}
                    onMouseEnter={() => preview(m)}
                    onFocus={() => preview(m)}
                    onClick={() => !dragged.current && send({ type: 'CHOOSE', mode: m })}
                    className={`flex cursor-grab touch-none flex-col items-center justify-center text-center shadow-[0_8px_0_rgba(21,21,21,0.16)] active:cursor-grabbing ${c.cls}`}
                    style={{ borderRadius: c.radius, clipPath: c.clip }}
                    aria-label={`${MODES[m].word}: ${c.sub}`}
                  >
                    <span className={`font-display font-black leading-[0.9] ${c.word}`}>{MODES[m].word.replace(' ', '\n')}</span>
                    <span className="mt-1 text-sm font-bold">{c.sub}</span>
                  </motion.button>
                </motion.li>
              )
            })}
          </ul>

          {/* What actually changes with each choice: the behaviour, not the paint. */}
          <motion.div
            key={hover ?? 'idle'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none mt-4 hidden self-end text-right lg:absolute lg:bottom-8 lg:right-8 lg:block lg:max-w-[24rem]"
          >
            {hover ? (
              <>
                <p className="text-lg font-bold leading-snug">{MODES[hover].promise}</p>
                <ul className="mt-3 flex flex-wrap justify-end gap-1.5">
                  {MODES[hover].rules.map(([k, v]) => (
                    <li key={k} className="rounded-full bg-white px-3 py-1 text-sm font-semibold ring-2 ring-ink">
                      <span className="text-mute">{k}:</span> {v}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-lg font-bold leading-snug">
                Same site, three behaviours. Hover to preview one, drag them about, tap to choose. Or press 1, 2 or 3.
              </p>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 16 }}
            className="font-display font-black uppercase leading-[0.86]"
          >
            <span className="w-cond block text-[clamp(3.6rem,11vw,10rem)]">Oh, it’s</span>
            <span className="w-wide block text-[clamp(2.4rem,8vw,7.5rem)]">you again.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-2xl text-xl font-semibold leading-relaxed sm:text-2xl"
          >
            Last time, {ago(memory.updatedAt)}, you were <Hi>{MODES[memory.lastMode].verb}</Hi>
            {last ? <> and kept looking at <Hi>{last.title}</Hi></> : null}. You opened {opened}{' '}
            {opened === 1 ? 'thing' : 'things'}, found {memory.discoveries.length} of my secrets and changed your mind{' '}
            {memory.switches} {memory.switches === 1 ? 'time' : 'times'}.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={() => send({ type: 'RESUME' })}
              className="rounded-full bg-ink px-6 py-3.5 font-display text-xl font-extrabold text-white shadow-[0_5px_0_rgba(21,21,21,0.2)] hover:bg-cobalt"
            >
              Continue {MODES[memory.lastMode].verb} →
            </button>
            <button
              onClick={() => setAsking(true)}
              className="rounded-full bg-white px-6 py-3.5 font-display text-xl font-extrabold ring-[3px] ring-ink hover:bg-lime"
            >
              Ask me again
            </button>
            <button onClick={() => send({ type: 'RESET' })} className="px-3 py-3 text-base font-bold text-tomato hover:underline">
              Forget me
            </button>
          </motion.div>
          <p className="mt-6 text-sm font-semibold text-mute">I only remember this in your browser.</p>
        </div>
      )}
    </motion.section>
  )
}
