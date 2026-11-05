import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { DISCOVERIES, PROJECTS, byId } from '../content.js'
import Glyph from '../components/Glyph.jsx'

// SURPRISE — the site directs. There is no navigation: scenes play on their own
// timer, you can only interrupt (tap) or pause (hold). Content priority is the
// unexpected: remixed fragments, invented hybrids, and the site reflecting on you.

const SCENES = ['crop', 'stack', 'mirror', 'chase', 'hybrid', 'count', 'grid', 'quote']
const ENTRANCES = {
  wipe: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.9, ease: [0.7, 0, 0.2, 1] } },
    exit: { clipPath: 'inset(0 0 0 100%)', transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } },
  },
  iris: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(150% at 50% 50%)', transition: { duration: 1.1, ease: [0.6, 0, 0.2, 1] } },
    exit: { opacity: 0, scale: 1.4, transition: { duration: 0.5 } },
  },
  tilt: {
    initial: { opacity: 0, rotate: -9, scale: 1.3 },
    animate: { opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 70, damping: 14 } },
    exit: { opacity: 0, rotate: 7, scale: 0.8, transition: { duration: 0.45 } },
  },
  drop: {
    initial: { y: '-100%' },
    animate: { y: '0%', transition: { type: 'spring', stiffness: 60, damping: 15 } },
    exit: { y: '100%', transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] } },
  },
  blink: {
    initial: { opacity: 0 },
    animate: { opacity: [0, 1, 0.2, 1, 0.6, 1], transition: { duration: 0.7, times: [0, 0.2, 0.35, 0.5, 0.7, 1] } },
    exit: { opacity: 0, filter: 'blur(12px)', transition: { duration: 0.4 } },
  },
}
const ENT_KEYS = Object.keys(ENTRANCES)

function rng(seed) {
  let s = (seed * 2654435761) % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function direct(n, base, prevType) {
  const r = rng(base + n * 31 + 7)
  let type = SCENES[Math.floor(r() * SCENES.length)]
  if (type === prevType) type = SCENES[(SCENES.indexOf(type) + 1 + Math.floor(r() * 3)) % SCENES.length]
  const a = PROJECTS[Math.floor(r() * PROJECTS.length)]
  let b = PROJECTS[Math.floor(r() * PROJECTS.length)]
  if (b.id === a.id) b = PROJECTS[(PROJECTS.indexOf(a) + 3) % PROJECTS.length]
  return {
    n,
    type,
    a,
    b,
    r: r(),
    enter: ENT_KEYS[Math.floor(r() * ENT_KEYS.length)],
    dur: type === 'chase' ? 11000 : type === 'mirror' ? 9000 : 6500,
  }
}

export default function Surprise({ state, send }) {
  const base = useRef(state.memory.scenes + state.memory.visits * 97).current
  const [scene, setScene] = useState(() => direct(0, base, null))
  const [paused, setPaused] = useState(false)
  const hold = useRef(null)
  const held = useRef(false)

  const advance = useCallback(
    (manual) => {
      if (manual) send({ type: 'INTERRUPT' })
      setScene((s) => {
        const next = direct(s.n + 1, base, s.type)
        return next
      })
    },
    [base, send],
  )

  useEffect(() => {
    send({ type: 'SCENE', projectId: scene.a.id })
  }, [scene.n]) // eslint-disable-line react-hooks/exhaustive-deps

  // The director's clock. Pausing stops time; resuming restarts the scene's clock.
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => advance(false), scene.dur)
    return () => clearTimeout(t)
  }, [scene, paused, advance])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance(true)
      }
      if (e.key === 'p') setPaused((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  const down = (e) => {
    if (e.target.closest('[data-own-click]')) return
    held.current = false
    hold.current = setTimeout(() => {
      held.current = true
      setPaused(true)
    }, 380)
  }
  const up = (e) => {
    clearTimeout(hold.current)
    if (e.target.closest('[data-own-click]')) return
    if (held.current) setPaused(false)
    else advance(true)
  }

  const ent = ENTRANCES[scene.enter]

  return (
    <motion.section
      className="absolute inset-0 select-none overflow-hidden"
      initial={{ opacity: 0, rotate: 4, scale: 1.1 }}
      animate={{ opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 60, damping: 14 } }}
      exit={{ opacity: 0, clipPath: 'inset(50% 0 50% 0)', transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] } }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={() => clearTimeout(hold.current)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={scene.n}
          className="absolute inset-0 bg-ink/0"
          initial={ent.initial}
          animate={ent.animate}
          exit={ent.exit}
        >
          <Scene scene={scene} state={state} send={send} />
        </motion.div>
      </AnimatePresence>

      {/* the director's clock */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 h-[2px] bg-smoke/60">
        <div
          key={scene.n}
          className="grow h-full bg-signal"
          style={{ '--dur': `${scene.dur}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>
      <p className="label pointer-events-none fixed bottom-4 right-4 z-30 text-right text-ash sm:bottom-6 sm:right-6">
        scene {String(state.memory.scenes).padStart(3, '0')} · {scene.type}
        <br />
        <span className={paused ? 'text-signal' : 'text-ash/60'}>
          {paused ? 'held — paused' : 'tap: interrupt · hold: pause'}
        </span>
      </p>
    </motion.section>
  )
}

function Scene({ scene, state, send }) {
  const { type } = scene
  if (type === 'crop') return <Crop {...scene} />
  if (type === 'stack') return <Stack {...scene} />
  if (type === 'mirror') return <Mirror memory={state.memory} />
  if (type === 'chase') return <Chase {...scene} state={state} send={send} />
  if (type === 'hybrid') return <Hybrid {...scene} />
  if (type === 'count') return <Count {...scene} />
  if (type === 'grid') return <Grid {...scene} />
  return <Quote {...scene} />
}

function Crop({ a, r }) {
  const word = a.title.split(' ')[0]
  const rot = (r - 0.5) * 24
  return (
    <div className="absolute inset-0">
      <motion.h2
        className="absolute whitespace-nowrap font-serif leading-none tracking-tightest"
        style={{ fontSize: '42vw', left: `${-10 + r * 20}vw`, top: `${10 + r * 25}vh`, rotate: rot }}
        initial={{ x: '8vw' }}
        animate={{ x: '-8vw' }}
        transition={{ duration: 7, ease: 'linear' }}
      >
        {word}
      </motion.h2>
      <div className="absolute bottom-10 left-5 max-w-sm sm:left-10">
        <p className="label text-signal">{a.kind}</p>
        <p className="mt-2 font-serif text-2xl italic leading-snug">{a.line}</p>
      </div>
    </div>
  )
}

function Stack({ a, r }) {
  const hot = Math.floor(r * 7)
  return (
    <div className="absolute inset-0 flex flex-col justify-center overflow-hidden">
      {Array.from({ length: 7 }, (_, i) => (
        <motion.p
          key={i}
          className={`whitespace-nowrap font-serif text-[13vw] leading-[0.8] tracking-tight sm:text-[10vw] ${
            i === hot ? 'italic text-signal' : i % 2 ? 'text-bone/20' : 'text-bone/60'
          }`}
          initial={{ x: i % 2 ? '-30%' : '10%' }}
          animate={{ x: i % 2 ? '0%' : '-20%' }}
          transition={{ duration: 6.5, ease: 'linear' }}
        >
          {a.title} {a.title} {a.title}
        </motion.p>
      ))}
    </div>
  )
}

function Mirror({ memory }) {
  const lines = useMemo(() => {
    const opened = Object.entries(memory.opened).sort((x, y) => y[1] - x[1])
    const untouched = PROJECTS.filter((p) => !memory.opened[p.id])
    const out = [`This is visit ${memory.visits}.`]
    if (opened[0]) out.push(`You opened “${byId[opened[0][0]].title}” ${opened[0][1] === 1 ? 'once' : opened[0][1] + ' times'}.`)
    else out.push('You haven’t opened anything yet. Interesting.')
    if (untouched.length) out.push(`You’ve never touched “${untouched[(memory.scenes * 7) % untouched.length].title}”.`)
    out.push(
      memory.discoveries.length
        ? `You found ${memory.discoveries.length} of ${DISCOVERIES.length} hidden things.`
        : 'You haven’t found any of my secrets.',
    )
    out.push(memory.switches ? `You changed your mind ${memory.switches} times. So did I.` : 'You haven’t changed your mind yet. I have.')
    return out
  }, [memory])

  return (
    <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-16">
      <p className="label text-signal">I’ve been paying attention</p>
      {lines.map((l, i) => (
        <motion.p
          key={i}
          className="mt-3 max-w-4xl font-serif text-[clamp(1.6rem,4.4vw,3.8rem)] leading-[1.02] tracking-tight"
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: i === lines.length - 1 ? 1 : 0.55, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.4 + i * 1.1, duration: 0.8 }}
        >
          {l}
        </motion.p>
      ))}
    </div>
  )
}

function Chase({ a, state, send }) {
  const box = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 140, damping: 14 })
  const sy = useSpring(y, { stiffness: 140, damping: 14 })
  const [caught, setCaught] = useState(null)

  const flee = (e) => {
    if (caught || !box.current) return
    const b = box.current.getBoundingClientRect()
    const cx = b.left + b.width / 2
    const cy = b.top + b.height / 2
    const dx = cx - e.clientX
    const dy = cy - e.clientY
    const d = Math.hypot(dx, dy)
    if (d < 220) {
      const W = window.innerWidth * 0.36
      const H = window.innerHeight * 0.32
      x.set(Math.max(-W, Math.min(W, x.get() + (dx / d) * 160)))
      y.set(Math.max(-H, Math.min(H, y.get() + (dy / d) * 120)))
    }
  }

  const catchIt = (e) => {
    e.stopPropagation()
    const left = DISCOVERIES.filter((d) => !state.memory.discoveries.includes(d.id))
    const prize = left[0] ?? DISCOVERIES[state.memory.scenes % DISCOVERIES.length]
    send({ type: 'DISCOVER', id: prize.id })
    setCaught(prize.text)
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center" onPointerMove={flee}>
      <p className="label absolute left-5 top-24 text-signal sm:left-10">Catch it.</p>
      <motion.button
        ref={box}
        data-own-click
        style={{ x: sx, y: sy }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={catchIt}
        className="font-serif text-[clamp(2.4rem,7vw,6rem)] italic leading-none"
      >
        {caught ? '✶' : a.title}
      </motion.button>
      <AnimatePresence>
        {caught && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-16 max-w-md px-6 text-center font-serif text-2xl italic"
          >
            {caught}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Hybrid({ a, b }) {
  const left = a.title.split(' ')[0]
  const right = b.title.split(' ').slice(-1)[0]
  return (
    <div className="absolute inset-0 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1">
      <motion.div
        className="flex items-end justify-end overflow-hidden border-b border-smoke p-5 sm:border-b-0 sm:border-r sm:p-10"
        initial={{ y: '-30%' }}
        animate={{ y: '0%' }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
      >
        <p className="font-serif text-[clamp(3rem,11vw,11rem)] leading-[0.85] tracking-tight">{left}</p>
      </motion.div>
      <motion.div
        className="flex flex-col justify-start overflow-hidden p-5 sm:p-10"
        initial={{ y: '30%' }}
        animate={{ y: '0%' }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
      >
        <p className="font-serif text-[clamp(3rem,11vw,11rem)] italic leading-[0.85] tracking-tight text-signal">{right}</p>
        <p className="label mt-6 max-w-xs text-ash">
          {a.kind} × {b.kind}
          <br />A project that doesn’t exist yet.
        </p>
      </motion.div>
    </div>
  )
}

function Count({ a }) {
  return (
    <div className="absolute inset-0 flex flex-col items-start justify-center px-5 sm:px-16">
      <motion.p
        className="font-serif text-[clamp(5rem,26vw,24rem)] leading-[0.8] tracking-tightest tabular-nums"
        initial={{ letterSpacing: '0.2em', opacity: 0 }}
        animate={{ letterSpacing: '-0.04em', opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.2, 0.7, 0.1, 1] }}
      >
        {a.stat[0]}
      </motion.p>
      <p className="mt-4 max-w-lg font-serif text-2xl italic text-ash sm:text-3xl">{a.stat[1]}</p>
      <p className="label mt-3 text-signal">{a.title}</p>
    </div>
  )
}

function Grid({ a }) {
  // Nine slots; the projects keep swapping seats. Positions are explicit so the
  // shuffle stays legible even while the scene itself is mid-transition.
  const [order, setOrder] = useState(() => PROJECTS.map((_, i) => i))
  useEffect(() => {
    const t = setInterval(() => setOrder((o) => [...o].sort(() => Math.random() - 0.5)), 1300)
    return () => clearInterval(t)
  }, [])
  const small = window.innerWidth < 640
  const size = small ? 64 : 104
  const gap = small ? 108 : 190
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative" style={{ width: gap * 3, height: gap * 3 }}>
        {PROJECTS.map((p, i) => {
          const slot = order[i]
          return (
            <motion.div
              key={p.id}
              className="absolute left-0 top-0 flex w-[var(--g)] flex-col items-center"
              style={{ '--g': `${gap}px` }}
              initial={false}
              animate={{ x: (slot % 3) * gap, y: Math.floor(slot / 3) * gap }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
            >
              <div className={p.id === a.id ? '' : 'opacity-30'}>
                <Glyph seed={p.seed} size={size} active={p.id === a.id} />
              </div>
              {p.id === a.id && <p className="label mt-2 whitespace-nowrap text-signal">{p.title}</p>}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Quote({ a }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <motion.blockquote
        className="max-w-5xl text-center font-serif text-[clamp(2.4rem,7.5vw,7.5rem)] italic leading-[0.95] tracking-tight"
        initial={{ scale: 0.92 }}
        animate={{ scale: 1.04 }}
        transition={{ duration: 6.5, ease: 'linear' }}
      >
        “{a.quote}”
        <footer className="label mt-8 not-italic text-ash">— from {a.title}</footer>
      </motion.blockquote>
    </div>
  )
}
