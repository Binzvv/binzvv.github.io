import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MODES, byId } from '../content.js'
import { describeAction } from '../machine.js'
import { COLORS, FORM_COUNT, center, mass, projectColor, useFormation } from '../formation.js'

const ORDER = ['explore', 'focus', 'surprise']
const INTENT = { explore: 9, focus: 10, surprise: 11 }
const INTENT_COLOR = { explore: COLORS[1], focus: COLORS[0], surprise: COLORS[2] }

function ago(ts) {
  if (!ts) return ''
  const s = (Date.now() - ts) / 1000
  if (s < 90) return 'a moment ago'
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`
  return `${Math.round(s / 86400)} days ago`
}

// Formations for the question. At rest: three forms, one per intent, each
// holding a share of the work. Hovering an intent previews how the same forms
// would behave in it.
function introFormation(anchor, previewRef) {
  return (t, w, h) => {
    const a = center(anchor.current) ?? { x: w * 0.72, y: h * 0.45, w: 400, h: 400 }
    const R = Math.min(a.w, a.h) * 0.2
    const m = previewRef.current
    const out = []
    if (m === 'explore') {
      // opens up: everything separates and spreads out
      for (let i = 0; i < FORM_COUNT; i++) {
        const ang = i * 2.39996 + t * 0.12
        const d = R * (0.9 + (i % 4) * 0.45)
        out.push({ x: a.x + Math.cos(ang) * d * 1.2, y: a.y + Math.sin(ang) * d, r: R * (i < 9 ? 0.36 : 0.18), c: i < 9 ? projectColor(i) : COLORS[1] })
      }
      return out
    }
    if (m === 'focus') return mass(a.x, a.y, R * 1.35, t, INTENT.focus, 0.4).map((f, i) => (i === INTENT.focus ? { ...f, c: COLORS[0] } : f))
    if (m === 'surprise') {
      // a curated ring that rotates as one
      for (let i = 0; i < FORM_COUNT; i++) {
        const ang = (i / FORM_COUNT) * Math.PI * 2 + t * 0.6
        const d = R * 1.6
        out.push({ x: a.x + Math.cos(ang) * d, y: a.y + Math.sin(ang) * d * 0.8, r: R * (0.26 + 0.14 * Math.sin(t * 2 + i)), c: i % 2 ? COLORS[2] : COLORS[0] })
      }
      return out
    }
    // rest: three intent forms, each carrying three projects inside it
    const spots = ORDER.map((k, j) => {
      const ang = -Math.PI / 2 + (j * Math.PI * 2) / 3 + Math.sin(t * 0.2) * 0.2
      return { k, x: a.x + Math.cos(ang) * R * 1.15, y: a.y + Math.sin(ang) * R * 1.0 }
    })
    for (let i = 0; i < 9; i++) {
      const s = spots[i % 3]
      const ang = t * 0.3 + i
      out.push({ x: s.x + Math.cos(ang) * R * 0.3, y: s.y + Math.sin(ang) * R * 0.3, r: R * 0.42, c: projectColor(i) })
    }
    spots.forEach((s) => out.push({ x: s.x, y: s.y, r: R * 0.66, c: INTENT_COLOR[s.k] }))
    return out
  }
}

export default function Intro({ state, send, preview, onPreview }) {
  const { memory, returning } = state
  const [asking, setAsking] = useState(!returning)
  const anchor = useRef(null)
  const previewRef = useRef(null)
  previewRef.current = preview

  useFormation(introFormation(anchor, previewRef), [], { stiffness: 0.05, soft: 0.07 })

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
      className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      {/* where the forms live on this screen */}
      <div
        ref={anchor}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] h-[26vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 lg:left-auto lg:right-[2vw] lg:top-1/2 lg:h-[70vh] lg:w-[44vw] lg:translate-x-0"
      />

      <div className="relative flex min-h-full flex-col justify-end px-4 pb-10 pt-[38vh] sm:px-8 lg:max-w-[56vw] lg:justify-center lg:pb-16 lg:pt-24">
        {asking ? (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.1, 1] }}
              className="balance text-[clamp(2.6rem,6vw,5.8rem)] font-light leading-[0.98] tracking-display"
            >
              What do you need right now?
            </motion.h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-quiet">
              One site, three behaviours. Choose how it should work for you. You can change it at any time.
            </p>

            <ul className="mt-10 border-t border-hair" onMouseLeave={() => onPreview(null)}>
              {ORDER.map((m, i) => (
                <motion.li
                  key={m}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: preview && preview !== m ? 0.4 : 1, y: 0 }}
                  transition={{ delay: preview === null ? 0.3 + i * 0.08 : 0, duration: 0.4 }}
                  className="border-b border-hair"
                >
                  <button
                    onMouseEnter={() => onPreview(m)}
                    onFocus={() => onPreview(m)}
                    onBlur={() => onPreview(null)}
                    onClick={() => send({ type: 'CHOOSE', mode: m })}
                    className="group flex w-full flex-wrap items-center gap-x-6 gap-y-1 py-4 text-left sm:flex-nowrap sm:py-5"
                  >
                    <span className="flex w-auto shrink-0 items-center gap-3 whitespace-nowrap text-[clamp(1.6rem,2.6vw,2.2rem)] font-normal tracking-snug sm:w-[13rem]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${INTENT_COLOR[m].map((v) => v * 255).join(',')})` }} />
                      {MODES[m].word}
                    </span>
                    <span className="order-3 w-full text-[15px] leading-snug text-quiet sm:order-none sm:w-auto sm:flex-1">
                      {MODES[m].promise}
                    </span>
                    <span className="ml-auto text-[13px] text-quiet transition-transform group-hover:translate-x-1">{i + 1} →</span>
                  </button>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 hidden min-h-[4.5rem] lg:block">
              {preview && (
                <motion.dl
                  key={preview}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-4 gap-6 text-[13px]"
                >
                  {MODES[preview].rules.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-quiet">{k}</dt>
                      <dd className="mt-1 font-medium leading-snug">{v}</dd>
                    </div>
                  ))}
                </motion.dl>
              )}
            </div>
          </>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.1, 1] }}
              className="text-[clamp(2.6rem,6vw,5.8rem)] font-light leading-[0.98] tracking-display"
            >
              Welcome back.
            </motion.h1>
            <p className="mt-6 max-w-xl text-[19px] leading-relaxed text-ink/80">
              Last visit, {ago(memory.updatedAt)}:{' '}
              {memory.lastAction ? (
                <>
                  you {describeAction(memory.lastAction)} while {MODES[memory.lastAction.mode]?.verb ?? MODES[memory.lastMode].verb}
                </>
              ) : (
                <>
                  you were {MODES[memory.lastMode].verb}
                  {last ? <>, most recently on {last.title}</> : null}
                </>
              )}
              . {opened} opened, {memory.discoveries.length} hidden notes
              found, {memory.switches} {memory.switches === 1 ? 'change' : 'changes'} of intent.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => send({ type: 'RESUME' })}
                className="rounded-full bg-ink px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-ultra"
              >
                {memory.lastAction?.projectId ? `Continue with ${byId[memory.lastAction.projectId].title}` : `Continue ${MODES[memory.lastMode].verb}`}
              </button>
              <button
                onClick={() => setAsking(true)}
                className="rounded-full border border-hair bg-white/60 px-6 py-3.5 text-[15px] font-medium backdrop-blur hover:bg-white"
              >
                Choose again
              </button>
              <button onClick={() => send({ type: 'RESET' })} className="px-3 py-3.5 text-[15px] text-quiet hover:text-ink">
                Forget me
              </button>
            </div>
            <p className="mt-6 text-[13px] text-quiet">This memory is stored only in your browser.</p>
          </>
        )}
      </div>
    </motion.section>
  )
}
