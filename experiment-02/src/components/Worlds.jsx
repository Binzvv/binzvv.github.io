import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MODES, SURPRISE } from '../data/content'
import { RULES, useEngine } from '../engine/engine'
import { GoRunButton } from './Ui'
import { Plate } from './Plate'

const slow = [0.22, 1, 0.36, 1]

/* ───────────────────────────── ESCAPE
   Fewer elements the longer you stay. The brand recedes on its own. */
export function EscapeWorld({ items, index, onNext, onOpen, onGoRun, fading }) {
  const { isActive, rule, idle } = useEngine()
  const [quiet, setQuiet] = useState(0)
  const [override, setOverride] = useState(false)
  const active = useRef(0)
  const views = useRef(1)
  const s = items[index]

  useEffect(() => {
    views.current += 1
  }, [index])

  useEffect(() => {
    const t = setInterval(() => {
      if (isActive() || idle) active.current += 1
      const level = Math.min(3, Math.floor(active.current / 20) + Math.floor((views.current - 1) / 2))
      setQuiet((q) => {
        if (level > q) {
          rule(RULES.QUIET, `level ${level}`)
          return level
        }
        return q
      })
    }, 1000)
    return () => clearInterval(t)
  }, [isActive, rule, idle])

  const q = override ? 0 : quiet
  const show = (lvl) => !fading && q < lvl

  return (
    <motion.section className="fixed inset-0 z-20 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.4 } }} transition={{ duration: 2.4, delay: 0.8 }}>
      <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55vh]" style={{ background: 'linear-gradient(180deg, #0000, #0000004d)' }} animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: 1.6 }} />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-10 sm:pb-10">
        <AnimatePresence mode="wait">
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: fading ? 0 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.8, ease: slow }}>
            <motion.p className="label" animate={{ opacity: show(1) ? 0.75 : 0 }} transition={{ duration: 2.4 }}>
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')} — {s.place}
            </motion.p>
            <h2 className="vt mt-3 leading-[0.9]" style={{ fontSize: 'clamp(40px, 7vw, 120px)', '--wdth': 125, '--wght': 230 }}>
              {s.title}
            </h2>
            <motion.p className="mt-3 max-w-md text-[15px] leading-snug opacity-90" animate={{ opacity: show(2) ? 0.9 : 0 }} transition={{ duration: 2.4 }}>
              {s.line}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <motion.div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" animate={{ opacity: fading ? 0 : 1, y: fading ? 20 : 0 }} transition={{ duration: 1.4, ease: slow }}>
          <GoRunButton mode="escape" onClick={onGoRun} />
          <motion.div className="flex gap-8" animate={{ opacity: show(3) ? 1 : 0.35 }} transition={{ duration: 2.4 }}>
            <button className="label underline-grow" onClick={() => onOpen(s)}>
              Stay a while
            </button>
            <button className="label underline-grow" onClick={onNext}>
              Further
            </button>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {q >= 2 && !fading && (
            <motion.div className="label mt-6 flex flex-wrap gap-x-6 gap-y-2 opacity-70" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }} transition={{ duration: 2.4 }}>
              <span>That might be enough screen for now. The quiet is better outside.</span>
              <button className="underline-grow opacity-70" onClick={() => setOverride(true)}>
                Bring everything back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

/* ───────────────────────────── PUSH
   Sharp, sequential, direct. Fast transitions, clear actions. No metrics. */
export function PushWorld({ items, index, onNext, onPrev, onOpen, onGoRun, fading }) {
  const s = items[index]
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Enter' && e.target === document.body) onOpen(s)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onNext, onPrev, onOpen, s])

  const wipe = { duration: 0.45, ease: [0.7, 0, 0.2, 1] }

  return (
    <motion.section
      className="fixed inset-0 z-20 flex flex-col justify-end px-5 pb-6 pt-[41vh] text-bone sm:w-1/2 sm:justify-center sm:px-10 sm:pb-10 sm:pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4 }}
    >
      <motion.div animate={{ opacity: fading ? 0 : 1, x: fading ? -30 : 0 }} transition={{ duration: 1, ease: slow }}>
        <div className="label flex justify-between opacity-60">
          <span>Effort {String(index + 1).padStart(2, '0')}</span>
          <span>{s.place}</span>
        </div>
        <div className="relative mt-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2
              key={s.id}
              className="vt uppercase leading-[0.82]"
              style={{ fontSize: 'clamp(54px, 9.6vw, 170px)', '--wdth': 62, '--wght': 880 }}
              initial={{ clipPath: 'inset(0 100% 0 0)', x: 40 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', x: 0 }}
              exit={{ clipPath: 'inset(0 0 0 100%)', x: -40 }}
              transition={wipe}
            >
              {s.title}
            </motion.h2>
          </AnimatePresence>
        </div>
        <motion.p key={s.id + 'l'} className="mt-4 max-w-md text-[16px] leading-snug" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.9, y: 0 }} transition={{ ...wipe, delay: 0.1 }}>
          {s.line}
        </motion.p>
        <dl className="mt-5 max-w-lg border-t border-bone/20 sm:mt-6">
          {s.specs.map(([k, v], i) => (
            <motion.div key={s.id + k} className="flex justify-between gap-4 border-b border-bone/20 py-1.5 text-[12px] sm:py-2 sm:text-[13px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}>
              <dt className="label pt-0.5 opacity-50">{k}</dt>
              <dd className="text-right">{v}</dd>
            </motion.div>
          ))}
        </dl>
      </motion.div>

      <motion.div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4" animate={{ opacity: fading ? 0 : 1, y: fading ? 30 : 0 }} transition={{ duration: 0.9, ease: slow, delay: fading ? 0.3 : 0 }}>
        <GoRunButton mode="push" size="lg" onClick={onGoRun} />
        <button className="label underline-grow" onClick={() => onOpen(s)}>
          Read the effort
        </button>
        <button className="label underline-grow" onClick={onNext} aria-label="Next effort">
          Next →
        </button>
      </motion.div>
    </motion.section>
  )
}

/* ───────────────────────────── WANDER
   Spatial, non-linear. A field you drag through. Threads connect curated stories. */
const SIZES = { l: [24, 30], m: [17, 22], s: [12, 15] } // vw: [width, height]

export function WanderWorld({ items, onOpen, onGoRun, fading, seenWander, mobile }) {
  const { rule, memory } = useEngine()
  const [focus, setFocus] = useState(null)
  const showSurprise = seenWander >= 3
  const all = showSurprise ? [...items, SURPRISE] : items
  const related = focus ? new Set([focus.id, ...(focus.threads || [])]) : null
  const ruled = useRef(false)
  const dragging = useRef(false)

  useEffect(() => {
    if (showSurprise && !ruled.current) {
      ruled.current = true
      rule(RULES.SURPRISE, 'revealed: ' + SURPRISE.title)
    }
  }, [showSurprise, rule])

  const fieldW = mobile ? 250 : 180 // vw
  const fieldH = mobile ? 190 : 170 // vh
  const scale = mobile ? 1.8 : 1

  return (
    <motion.section className="fixed inset-0 z-20 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} transition={{ duration: 1 }}>
      <motion.div
        className="absolute left-0 top-0 cursor-grab active:cursor-grabbing"
        style={{ width: `${fieldW}vw`, height: `${fieldH}vh`, touchAction: 'none' }}
        drag={!fading}
        dragConstraints={{ left: -(fieldW - 100) * (window.innerWidth / 100), right: 0, top: -(fieldH - 100) * (window.innerHeight / 100), bottom: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.25, timeConstant: 380 }}
        onDragStart={() => (dragging.current = true)}
        onDragEnd={() => setTimeout(() => (dragging.current = false), 60)}
        initial={{ x: -(fieldW - 100) * (window.innerWidth / 200), y: -(fieldH - 100) * (window.innerHeight / 200) }}
        animate={{ opacity: fading ? 0 : 1, scale: fading ? 0.96 : 1 }}
        transition={{ duration: 1.4, ease: slow }}
      >
        {all.map((s, i) => {
          const [w, h] = SIZES[s.size]
          const dim = related && !related.has(s.id)
          const kept = memory.saved.includes(s.id)
          return (
            <motion.button
              key={s.id}
              className="absolute text-left"
              style={{ left: `${s.pos[0]}%`, top: `${s.pos[1]}%`, width: `${w * scale}vw` }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: dim ? 0.25 : 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 18, delay: s.surprise ? 0.3 : 0.4 + i * 0.09, opacity: { duration: 0.6 } }}
              onMouseEnter={() => setFocus(s)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(s)}
              onBlur={() => setFocus(null)}
              onClick={() => !dragging.current && onOpen(s)}
              whileHover={{ y: -6 }}
            >
              <div className={`relative overflow-hidden ${i % 3 === 1 ? 'morph' : ''}`} style={{ height: `${h * scale}vw`, borderRadius: i % 3 === 2 ? '999px 999px 0 0' : i % 3 === 0 ? 0 : undefined }}>
                <Plate story={s} grade="wander" />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span className="vt text-[18px] leading-tight sm:text-[20px]" style={{ '--wdth': 100, '--wght': 560 }}>
                  {s.title}
                </span>
                {kept && <span className="label opacity-60">Kept</span>}
              </div>
              <span className="label mt-1 block opacity-50">{s.surprise ? 'Found because you wandered this far' : s.place}</span>
            </motion.button>
          )
        })}
      </motion.div>

      <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-5 pb-6 sm:px-10 sm:pb-10" animate={{ opacity: fading ? 0 : 1, y: fading ? 24 : 0 }} transition={{ duration: 1.2, ease: slow }}>
        <div className="pointer-events-auto">
          <GoRunButton mode="wander" onClick={onGoRun} />
        </div>
        <p className="label max-w-[220px] text-right opacity-60">
          {focus?.threads?.length ? `Threads to ${focus.threads.length} other places` : 'Drag to wander. Stories are connected by threads, not categories.'}
        </p>
      </motion.div>
    </motion.section>
  )
}

export { MODES }
