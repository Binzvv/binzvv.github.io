import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { DISCOVERIES, PROJECTS, byId } from '../content.js'
import Sticker from '../components/Sticker.jsx'

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
// Each scene takes over the whole screen in a colour of its own.
const GROUNDS = [
  { bg: '#C6F24A', fg: '#151515' },
  { bg: '#2B4BFF', fg: '#FFFFFF' },
  { bg: '#FFA3D7', fg: '#151515' },
  { bg: '#FFD23F', fg: '#151515' },
  { bg: '#FF5A36', fg: '#151515' },
  { bg: '#FFFFFF', fg: '#151515' },
  { bg: '#151515', fg: '#FFFFFF' },
]

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
    ground: GROUNDS[(n * 3 + Math.floor(r() * 4)) % GROUNDS.length],
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
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 60, damping: 14 } }}
      exit={{ opacity: 0, clipPath: 'inset(50% 0 50% 0)', transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] } }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={() => clearTimeout(hold.current)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={scene.n}
          className="absolute inset-0 overflow-hidden"
          style={{ background: scene.ground.bg, color: scene.ground.fg }}
          initial={ent.initial}
          animate={ent.animate}
          exit={ent.exit}
        >
          <Scene scene={scene} state={state} send={send} />
        </motion.div>
      </AnimatePresence>

      {/* the director's clock */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 h-1.5 bg-ink/15">
        <div
          key={scene.n}
          className="grow h-full bg-ink"
          style={{ '--dur': `${scene.dur}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>
      <p className="pointer-events-none fixed bottom-5 right-4 z-30 flex items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1 text-sm font-bold text-ink ring-2 ring-ink sm:right-6">
        <span className="tnum">Scene {state.memory.scenes}</span>
        <span className={`rounded-full px-2.5 py-0.5 ${paused ? 'bg-tomato' : 'bg-ground'}`}>
          {paused ? 'Paused' : <>Tap to skip<span className="hidden sm:inline"> · hold to pause</span></>}
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

const big = 'font-display font-black uppercase'

function Crop({ a, r }) {
  const word = a.title.split(' ')[0]
  const rot = (r - 0.5) * 18
  return (
    <div className="absolute inset-0">
      <motion.h2
        className={`w-wide absolute whitespace-nowrap leading-none ${big}`}
        style={{ fontSize: '30vw', left: '-6vw', top: `${8 + r * 22}vh`, rotate: rot }}
        initial={{ x: '6vw' }}
        animate={{ x: '-10vw' }}
        transition={{ duration: 7, ease: 'linear' }}
      >
        {word}
      </motion.h2>
      <motion.div
        className="absolute right-[6vw] top-[18vh]"
        initial={{ scale: 0.3, rotate: -40 }}
        animate={{ scale: 1, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 90, damping: 9, delay: 0.3 }}
      >
        <Sticker id={a.id} size={Math.min(window.innerWidth * 0.42, 340)} />
      </motion.div>
      <p className="absolute bottom-20 left-5 max-w-md text-2xl font-bold leading-snug sm:left-10 sm:text-3xl">{a.line}</p>
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
          className={`whitespace-nowrap text-[12vw] leading-[0.84] sm:text-[9vw] ${big} ${i % 2 ? 'w-cond' : 'w-wide'} ${
            i === hot ? 'bg-ink text-white' : ''
          }`}
          style={{ opacity: i === hot ? 1 : i % 2 ? 0.35 : 0.85 }}
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

// The site texts you about what it noticed. Built from the real memory.
function Mirror({ memory }) {
  const lines = useMemo(() => {
    const opened = Object.entries(memory.opened).sort((x, y) => y[1] - x[1])
    const untouched = PROJECTS.filter((p) => !memory.opened[p.id])
    const out = [`This is visit ${memory.visits}.`]
    if (opened[0]) out.push(`You opened ${byId[opened[0][0]].title} ${opened[0][1] === 1 ? 'once' : opened[0][1] + ' times'}.`)
    else out.push('You haven’t opened anything yet. Interesting.')
    if (untouched.length) out.push(`You’ve never touched ${untouched[(memory.scenes * 7) % untouched.length].title}.`)
    out.push(
      memory.discoveries.length
        ? `You found ${memory.discoveries.length} of my ${DISCOVERIES.length} secrets.`
        : 'You haven’t found any of my secrets.',
    )
    out.push(memory.switches ? `You changed your mind ${memory.switches} times. So did I.` : 'You haven’t changed your mind yet. I have.')
    return out
  }, [memory])

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 px-5 pb-16 sm:px-16">
      <p className={`w-wide mb-3 text-[clamp(1.6rem,4vw,3rem)] leading-none ${big}`}>Things I noticed</p>
      {lines.map((l, i) => (
        <motion.p
          key={i}
          className="w-fit max-w-[min(36rem,85vw)] rounded-[22px] rounded-bl-md bg-white px-4 py-2.5 text-[clamp(1.05rem,2.2vw,1.5rem)] font-bold leading-snug text-ink ring-2 ring-ink"
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ originX: 0, originY: 1 }}
          transition={{ delay: 0.3 + i * 1.1, type: 'spring', stiffness: 300, damping: 20 }}
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
      const H = window.innerHeight * 0.3
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
      <p className={`w-wide absolute left-5 top-20 text-[clamp(2rem,6vw,4.5rem)] leading-none sm:left-10 ${big}`}>
        {caught ? 'Got me.' : 'Catch it.'}
      </p>
      <motion.button
        ref={box}
        data-own-click
        style={{ x: sx, y: sy }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={catchIt}
        aria-label={`Catch ${a.title}`}
      >
        <motion.div animate={caught ? { rotate: 0 } : { rotate: [-8, 8, -8] }} transition={{ duration: 0.6, repeat: caught ? 0 : Infinity }}>
          <Sticker id={a.id} size={window.innerWidth < 640 ? 140 : 190} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {caught && (
          <motion.p
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-24 max-w-md rounded-[22px] bg-white px-5 py-3 text-center text-xl font-bold text-ink ring-2 ring-ink"
          >
            Secret: {caught}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Hybrid({ a, b }) {
  const name = `${a.title.split(' ')[0]} ${b.title.split(' ').slice(-1)[0]}`
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-16 text-center">
      <div className="relative mb-4 h-[34vh] w-[min(80vw,30rem)]">
        <motion.div
          className="absolute left-0 top-0"
          initial={{ x: -200, rotate: -30 }}
          animate={{ x: 0, rotate: -10 }}
          transition={{ type: 'spring', stiffness: 70, damping: 10 }}
        >
          <Sticker id={a.id} size={Math.min(window.innerHeight * 0.3, 240)} />
        </motion.div>
        <motion.div
          className="absolute bottom-0 right-0"
          initial={{ x: 200, rotate: 30 }}
          animate={{ x: 0, rotate: 12 }}
          transition={{ type: 'spring', stiffness: 70, damping: 10 }}
        >
          <Sticker id={b.id} size={Math.min(window.innerHeight * 0.3, 240)} />
        </motion.div>
      </div>
      <p className={`w-wide text-[clamp(2.4rem,8vw,7rem)] leading-[0.85] ${big}`}>{name}</p>
      <p className="mt-3 max-w-md text-lg font-bold">
        {a.kind} meets {b.kind.toLowerCase()}. A project that doesn’t exist yet.
      </p>
    </div>
  )
}

function Count({ a }) {
  return (
    <div className="absolute inset-0 flex flex-col items-start justify-center px-5 pb-16 sm:px-16">
      <motion.p
        className={`tnum text-[clamp(5rem,24vw,22rem)] leading-[0.8] ${big}`}
        initial={{ fontStretch: '50%', opacity: 0 }}
        animate={{ fontStretch: '150%', opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.2, 0.7, 0.1, 1] }}
      >
        {a.stat[0]}
      </motion.p>
      <p className="mt-4 max-w-lg text-2xl font-bold sm:text-3xl">{a.stat[1]}</p>
      <p className="mt-2 text-lg font-semibold opacity-70">from {a.title}</p>
    </div>
  )
}

function Grid({ a }) {
  // Nine seats; the stickers keep swapping. Positions are explicit so the
  // shuffle stays legible even while the scene itself is mid-transition.
  const [order, setOrder] = useState(() => PROJECTS.map((_, i) => i))
  useEffect(() => {
    const t = setInterval(() => setOrder((o) => [...o].sort(() => Math.random() - 0.5)), 1300)
    return () => clearInterval(t)
  }, [])
  const small = window.innerWidth < 640
  const size = small ? 90 : 150
  const gap = small ? 110 : 180
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-10">
      <div className="relative" style={{ width: gap * 3, height: gap * 3 }}>
        {PROJECTS.map((p, i) => {
          const slot = order[i]
          return (
            <motion.div
              key={p.id}
              className="absolute left-0 top-0 flex flex-col items-center"
              style={{ width: gap, zIndex: p.id === a.id ? 2 : 1 }}
              initial={false}
              animate={{ x: (slot % 3) * gap, y: Math.floor(slot / 3) * gap, scale: p.id === a.id ? 1.15 : 0.85 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            >
              <Sticker id={p.id} size={size} tilt={(i % 3) * 8 - 8} />
            </motion.div>
          )
        })}
      </div>
      <p className={`w-wide mt-2 text-[clamp(1.4rem,4vw,2.6rem)] ${big}`}>{a.title}</p>
    </div>
  )
}

function Quote({ a }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 pb-16">
      <motion.blockquote
        className="max-w-4xl rounded-[40px] rounded-bl-lg bg-white px-7 py-8 text-ink ring-[3px] ring-ink sm:px-12 sm:py-10"
        initial={{ scale: 0.4, rotate: -6 }}
        animate={{ scale: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 120, damping: 11 }}
      >
        <p className={`w-cond text-[clamp(2.6rem,8vw,7rem)] leading-[0.88] ${big}`}>“{a.quote}”</p>
        <footer className="mt-4 text-lg font-bold text-mute">from {a.title}</footer>
      </motion.blockquote>
    </div>
  )
}
