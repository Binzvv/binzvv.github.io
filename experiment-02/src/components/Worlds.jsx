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
   Sharp, sequential, direct. Fast transitions, clear actions. No metrics.
   Art direction: underground, documentary. Condensed type that is too big
   for its column, hard crops, film texture, one signal colour. */
const cut = [0.7, 0, 0.2, 1]

function ContactStrip({ items, index }) {
  // Display only: the sequence as a strip of film. The current frame is marked
  // in grease pencil. Navigation stays Next / arrow keys so skips mean the same thing.
  return (
    <div className="flex items-end gap-1.5" aria-hidden>
      {items.map((it, i) => {
        const p = it.plate
        const on = i === index
        return (
          <div key={it.id} className="flex flex-col gap-1">
            <div
              className={`relative h-9 w-12 overflow-hidden transition-[filter,outline-color] duration-300 sm:h-11 sm:w-16 ${on ? 'outline outline-2 outline-offset-2 outline-signal' : 'opacity-60 grayscale'}`}
              style={{ background: `linear-gradient(180deg, ${p.sky[0]}, ${p.sky[1]} ${p.horizon}%, ${p.ground[0]} ${p.horizon + 4}%, ${p.ground[1]})` }}
            />
            <span className={`font-mono text-[9px] tracking-[0.08em] ${on ? 'text-signal' : 'opacity-50'}`}>{String(i + 1).padStart(2, '0')}A</span>
          </div>
        )
      })}
    </div>
  )
}

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

  const wipe = { duration: 0.45, ease: cut }
  const words = s.title.toUpperCase().split(' ')
  const num = String(index + 1).padStart(2, '0')
  const total = String(items.length).padStart(2, '0')

  return (
    <motion.section
      className="fixed inset-0 z-20 text-bone"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4 }}
    >
      {/* phone: the type sits on the photograph, so the lower frame is crushed to black */}
      <div className="pointer-events-none absolute inset-0 sm:hidden" style={{ background: 'linear-gradient(180deg, #0E0E0C00 30%, #0E0E0Ccc 52%, #0E0E0C 68%)' }} />
      {/* desktop: hard edge where the photograph is cut, with a strip of signal */}
      <div className="pointer-events-none absolute inset-y-0 left-[30%] hidden w-[3px] bg-signal sm:block" />

      {/* shot direction, written on the frame like a contact-sheet note */}
      <motion.p
        key={s.id + 'shot'}
        className="label absolute left-[calc(30%+28px)] top-28 hidden max-w-[17rem] bg-[#0E0E0C] px-2 py-1.5 text-bone/85 sm:block"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: fading ? 0 : 1, x: 0 }}
        transition={{ ...wipe, delay: 0.15 }}
      >
        <span className="mr-2 bg-signal px-1 py-px text-ink">FR {num}A</span>
        {s.shot}
      </motion.p>

      {/* specs: a log on the photograph, top right */}
      <motion.dl
        key={s.id + 'dl'}
        className="absolute right-10 top-40 hidden w-[min(22rem,28vw)] bg-[#0E0E0C] px-3 lg:block"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        animate={{ clipPath: 'inset(0 0 0% 0)', opacity: fading ? 0 : 1 }}
        transition={{ ...wipe, delay: 0.12 }}
      >
        {s.specs.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-bone/15 py-2 text-[12.5px] last:border-0">
            <dt className="label pt-0.5 opacity-60">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </motion.dl>

      <motion.div className="absolute inset-x-0 bottom-0 flex flex-col px-5 pb-6 sm:inset-y-0 sm:pb-10 sm:pl-10 sm:pr-10 sm:pt-28" animate={{ opacity: fading ? 0 : 1, x: fading ? -30 : 0 }} transition={{ duration: 1, ease: slow }}>
        {/* index + place */}
        <div className="label flex items-center gap-3 sm:w-[calc(30%-48px)] sm:flex-col sm:items-start sm:gap-1">
          <span className="text-signal">
            Effort {num} / {total}
          </span>
          <span className="opacity-60">{s.place}</span>
        </div>

        <motion.p key={s.id + 'l'} className="vt mt-3 max-w-[22rem] text-[17px] leading-[1.15] sm:mt-6 sm:text-[22px]" style={{ '--wdth': 78, '--wght': 560 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.95, y: 0 }} transition={{ ...wipe, delay: 0.1 }}>
          {s.line}
        </motion.p>

        {/* specs on phones and narrow screens: compact, two columns */}
        <dl className="order-last mt-4 grid grid-cols-2 gap-x-4 border-t border-bone/25 lg:hidden">
          {s.specs.map(([k, v]) => (
            <div key={s.id + k} className="border-b border-bone/20 py-1.5 text-[11.5px] leading-tight">
              <dt className="label opacity-50">{k}</dt>
              <dd className="mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>

        <motion.div className="order-last mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 sm:order-none sm:mt-8" animate={{ y: fading ? 30 : 0 }} transition={{ duration: 0.9, ease: slow, delay: fading ? 0.3 : 0 }}>
          <GoRunButton mode="push" size="lg" onClick={onGoRun} />
          <button className="label underline-grow" onClick={() => onOpen(s)}>
            Read the effort
          </button>
          <button className="label underline-grow" onClick={onNext} aria-label="Next effort">
            Next →
          </button>
        </motion.div>

        <div className="hidden flex-1 sm:block" />

        {/* the title: too big for its column, it runs onto the photograph */}
        <div className="pointer-events-none relative mt-4 overflow-hidden sm:mt-0 sm:-mb-[0.06em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2
              key={s.id}
              className="vt uppercase leading-[0.8] tracking-[-0.015em]"
              style={{ fontSize: 'clamp(76px, min(15vw, 25vh), 300px)', '--wdth': 62, '--wght': 900 }}
              initial={{ clipPath: 'inset(0 100% 0 0)', x: 60, skewX: -8 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', x: 0, skewX: 0 }}
              exit={{ clipPath: 'inset(0 0 0 100%)', x: -60, skewX: 8 }}
              transition={wipe}
            >
              {words.map((w, i) => (
                <span key={i} className="block">
                  {w}
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div className="absolute bottom-10 right-10 hidden lg:block" animate={{ opacity: fading ? 0 : 1 }} transition={{ duration: 0.6 }}>
        <ContactStrip items={items} index={index} />
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
