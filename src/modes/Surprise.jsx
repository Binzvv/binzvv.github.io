import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { DISCOVERIES, PROJECTS, byId } from '../content.js'
import { COLORS, FORM_COUNT, center, indexOf, mass, projectColor, useFormation } from '../formation.js'

// SURPRISE — the site directs. There is no navigation: scenes play on their own
// timer, you can only interrupt (tap) or pause (hold). Content priority is the
// unexpected, but curated: recombined work, invented hybrids, and an honest
// account of what the site has observed. Each scene is a new formation of the
// same forms, so the screen is always visibly the same system rearranging.

const SCENES = ['crop', 'stack', 'mirror', 'chase', 'hybrid', 'count', 'grid', 'quote']
const NAMES = {
  crop: 'Close-up',
  stack: 'Sequence',
  mirror: 'What I observed',
  chase: 'Catch it',
  hybrid: 'Recombination',
  count: 'One number',
  grid: 'Reorder',
  quote: 'Fragment',
}
const ENTRANCES = {
  rise: {
    initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.2, 0.7, 0.1, 1] } },
    exit: { opacity: 0, y: -20, filter: 'blur(10px)', transition: { duration: 0.4 } },
  },
  mask: {
    initial: { clipPath: 'inset(100% 0 0 0)' },
    animate: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 0.9, ease: [0.7, 0, 0.2, 1] } },
    exit: { opacity: 0, transition: { duration: 0.4 } },
  },
  focus: {
    initial: { opacity: 0, scale: 1.04, filter: 'blur(14px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.2, 0.7, 0.1, 1] } },
    exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)', transition: { duration: 0.4 } },
  },
  slide: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.1, 1] } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.35 } },
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
      setScene((s) => direct(s.n + 1, base, s.type))
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.4 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={() => clearTimeout(hold.current)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AnimatePresence initial={false}>
        <motion.div key={scene.n} className="absolute inset-0" initial={ent.initial} animate={ent.animate} exit={ent.exit}>
          <p className="absolute left-4 top-[4.5rem] text-[13px] text-quiet sm:left-8 sm:top-16">
            <span className="tnum mr-2 text-ink">{String(state.memory.scenes).padStart(2, '0')}</span>
            {NAMES[scene.type]}
          </p>
          <Scene scene={scene} state={state} send={send} />
        </motion.div>
      </AnimatePresence>

      {/* the director's clock */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-30 h-px bg-hair">
        <div
          key={scene.n}
          className="grow h-full bg-ink"
          style={{ '--dur': `${scene.dur}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>
      <p className="pointer-events-none fixed inset-x-0 bottom-[4.8rem] z-30 text-center text-[13px] text-quiet sm:bottom-[5.8rem]">
        {paused ? 'Paused. Release to continue.' : 'Tap to skip · hold to pause'}
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

const hidden = (x, y, i) => ({ x, y, r: 0, c: i < 9 ? projectColor(i) : COLORS[i % 3] })
const display = 'font-light leading-[0.98] tracking-display balance'

// One project's form, very large, bleeding off the edge. Everything else merges into it.
function Crop({ a }) {
  const lead = indexOf[a.id]
  useFormation(
    (t, w, h) => {
      const R = Math.max(w, h) * 0.3
      return mass(w * (w < 640 ? 0.85 : 0.82), h * 0.52, R, t, lead, 0.6)
    },
    [],
    { stiffness: 0.05, soft: 0.06 },
  )
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-4 pb-24 sm:px-8 lg:max-w-[55vw]">
      <h2 className={`text-[clamp(2.8rem,6.5vw,6rem)] ${display}`}>{a.title}</h2>
      <p className="mt-5 max-w-md text-[19px] leading-snug text-ink/75">{a.line}</p>
    </div>
  )
}

// All nine forms in a line. The order is new each time; one leads.
function Stack({ a, r }) {
  const order = useMemo(() => [...PROJECTS].sort((x, y) => ((x.seed * r * 97) % 1) - ((y.seed * r * 97) % 1)), [r])
  const cells = useRef({})
  useFormation(
    (t, w, h) => {
      const out = PROJECTS.map((p, i) => {
        const c = center(cells.current[p.id]) ?? { x: w / 2, y: h / 2, w: 40 }
        const k = p.id === a.id ? 0.55 : 0.32
        return { x: c.x, y: c.y + Math.sin(t * 1.4 + i * 0.7) * 6, r: c.w * k, c: projectColor(i) }
      })
      const c = center(cells.current[a.id]) ?? { x: w / 2, y: h / 2 }
      for (let i = 9; i < FORM_COUNT; i++) out.push(hidden(c.x, c.y, i))
      return out
    },
    [],
    { stiffness: 0.07, soft: 0.06 },
  )
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-4 pb-24 sm:px-8">
      <h2 className={`max-w-3xl text-[clamp(2rem,4.4vw,3.8rem)] ${display}`}>
        Nine projects in a new order. This time {a.title} leads.
      </h2>
      <div className="mt-12 grid grid-cols-9 gap-1 sm:gap-3">
        {order.map((p) => (
          <div key={p.id} className="min-w-0">
            <div ref={(el) => (cells.current[p.id] = el)} className="aspect-square w-full" />
            <p className={`mt-3 hidden truncate text-[12px] lg:block ${p.id === a.id ? 'text-ink' : 'text-quiet'}`}>{p.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// The site's record of you, shown as data: each form is sized by how often you opened it.
function Mirror({ memory }) {
  const cells = useRef({})
  const counts = memory.opened
  const max = Math.max(1, ...Object.values(counts))
  useFormation(
    (t, w, h) => {
      const out = PROJECTS.map((p, i) => {
        const c = center(cells.current[p.id]) ?? { x: w / 2, y: h / 2, w: 40 }
        const n = counts[p.id] ?? 0
        return { x: c.x, y: c.y, r: c.w * (0.14 + 0.36 * (n / max)), c: n ? projectColor(i) : [0.75, 0.75, 0.77] }
      })
      for (let i = 9; i < FORM_COUNT; i++) out.push(hidden(w / 2, h / 2, i))
      return out
    },
    [],
    { stiffness: 0.06, soft: 0.06 },
  )
  const lines = useMemo(() => {
    const opened = Object.entries(counts).sort((x, y) => y[1] - x[1])
    const untouched = PROJECTS.filter((p) => !counts[p.id])
    const out = [`Visit ${memory.visits}.`]
    out.push(opened[0] ? `Most opened: ${byId[opened[0][0]].title}, ${opened[0][1]}×.` : 'Nothing opened yet.')
    if (untouched.length)
      out.push(`Not opened: ${untouched.length} of ${PROJECTS.length}, including ${untouched[(memory.scenes * 7) % untouched.length].title}.`)
    out.push(`Hidden notes found: ${memory.discoveries.length} of ${DISCOVERIES.length}.`)
    out.push(`Changes of intent: ${memory.switches}.`)
    return out
  }, [counts, memory])

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-10 px-4 pb-24 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-md">
        <h2 className={`text-[clamp(2rem,4vw,3.4rem)] ${display}`}>Only what I could observe.</h2>
        <ul className="mt-6 space-y-2 text-[16px]">
          {lines.map((l, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.5 }}>
              {l}
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-9 gap-1 sm:gap-2 lg:w-[48vw]">
        {PROJECTS.map((p) => (
          <div key={p.id} className="min-w-0 text-center">
            <div ref={(el) => (cells.current[p.id] = el)} className="aspect-square w-full" />
            <p className="tnum mt-2 text-[12px] text-quiet">{counts[p.id] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// A project that won't sit still. Its form follows the label; catching it yields a hidden note.
function Chase({ a, state, send }) {
  const box = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 140, damping: 16 })
  const sy = useSpring(y, { stiffness: 140, damping: 16 })
  const [caught, setCaught] = useState(null)
  const lead = indexOf[a.id]

  useFormation(
    (t, w, h) => {
      const c = center(box.current) ?? { x: w / 2, y: h / 2 }
      const vx = sx.getVelocity()
      const vy = sy.getVelocity()
      return Array.from({ length: FORM_COUNT }, (_, i) => {
        if (i === lead) return { x: c.x, y: c.y, r: 64, c: projectColor(i) }
        // the others trail behind it, like a wake
        const k = (i % 6) + 1
        return { x: c.x - vx * 0.012 * k, y: c.y - vy * 0.012 * k, r: Math.max(8, 32 - k * 3), c: projectColor(i % 9) }
      })
    },
    [],
    { stiffness: 0.12, soft: 0.06 },
  )

  const flee = (e) => {
    if (caught || !box.current) return
    const b = box.current.getBoundingClientRect()
    const dx = b.left + b.width / 2 - e.clientX
    const dy = b.top + b.height / 2 - e.clientY
    const d = Math.hypot(dx, dy) || 1
    if (d < 200) {
      const W = window.innerWidth * 0.34
      const H = window.innerHeight * 0.28
      x.set(Math.max(-W, Math.min(W, x.get() + (dx / d) * 150)))
      y.set(Math.max(-H, Math.min(H, y.get() + (dy / d) * 110)))
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
      <h2 className={`absolute left-4 top-24 max-w-sm text-[clamp(1.8rem,3.4vw,2.8rem)] sm:left-8 sm:top-28 ${display}`}>
        {caught ? 'Caught. Here is a hidden note.' : `Catch ${a.title}.`}
      </h2>
      <motion.button
        ref={box}
        data-own-click
        style={{ x: sx, y: sy }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={catchIt}
        className="relative z-10 rounded-full border border-hair bg-white/80 px-4 py-2 text-[15px] font-medium backdrop-blur"
      >
        {caught ? 'Caught' : a.title}
      </motion.button>
      <AnimatePresence>
        {caught && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 max-w-md px-6 text-center text-[19px] leading-snug"
          >
            {caught}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// Two projects' forms approach and merge into a third that doesn't exist yet.
function Hybrid({ a, b }) {
  const ia = indexOf[a.id]
  const ib = indexOf[b.id]
  const start = useRef(null)
  useFormation(
    (t, w, h) => {
      if (start.current === null) start.current = t
      const k = Math.min(1, (t - start.current) / 3.2)
      const e = 1 - (1 - k) ** 3
      const cx = w < 1024 ? w / 2 : w * 0.7
      const cy = w < 1024 ? h * 0.3 : h * 0.48
      const R = Math.min(w, h) * 0.13
      const gap = R * 2.6 * (1 - e)
      return Array.from({ length: FORM_COUNT }, (_, i) => {
        if (i === ia) return { x: cx - gap, y: cy, r: R, c: projectColor(i) }
        if (i === ib) return { x: cx + gap, y: cy, r: R, c: projectColor(i) }
        if (i === 9) return { x: cx, y: cy, r: R * 1.2 * e, c: COLORS[1] }
        return hidden(cx, cy, i)
      })
    },
    [],
    { stiffness: 0.07, soft: 0.07 },
  )
  const name = `${a.title.split(' ')[0]} ${b.title.split(' ').slice(-1)[0]}`
  return (
    <div className="absolute inset-0 flex flex-col justify-end px-4 pb-32 sm:px-8 lg:max-w-[50vw] lg:justify-center lg:pb-24">
      <p className="text-[15px] text-quiet">
        {a.title} + {b.title}
      </p>
      <h2 className={`mt-3 text-[clamp(2.8rem,6.5vw,6rem)] ${display}`}>{name}</h2>
      <p className="mt-5 max-w-md text-[17px] leading-snug text-ink/75">
        {a.kind} meets {b.kind.toLowerCase()}. A project that doesn’t exist yet, assembled from two that do.
      </p>
    </div>
  )
}

function Count({ a }) {
  const lead = indexOf[a.id]
  useFormation(
    (t, w, h) => mass(w < 1024 ? w * 0.7 : w * 0.72, h * (w < 1024 ? 0.3 : 0.5), Math.min(w, h) * 0.18, t, lead, 0.5),
    [],
    { stiffness: 0.05, soft: 0.06 },
  )
  return (
    <div className="absolute inset-0 flex flex-col justify-end px-4 pb-32 sm:px-8 lg:justify-center lg:pb-24">
      <motion.p
        className="tnum text-[clamp(5rem,16vw,14rem)] font-light leading-[0.85] tracking-display"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.2, 0.7, 0.1, 1] }}
      >
        {a.stat[0]}
      </motion.p>
      <p className="mt-4 max-w-md text-[21px] leading-snug">{a.stat[1]}</p>
      <p className="mt-2 text-[14px] text-quiet">{a.title}</p>
    </div>
  )
}

// Nine seats; the forms keep swapping places around the one being highlighted.
function Grid({ a }) {
  const [order, setOrder] = useState(() => PROJECTS.map((_, i) => i))
  const cells = useRef({})
  useEffect(() => {
    const t = setInterval(() => setOrder((o) => [...o].sort(() => Math.random() - 0.5)), 1400)
    return () => clearInterval(t)
  }, [])
  useFormation(
    (t, w, h) => {
      const out = PROJECTS.map((p, i) => {
        const c = center(cells.current[p.id]) ?? { x: w / 2, y: h / 2, w: 60 }
        return { x: c.x, y: c.y, r: c.w * (p.id === a.id ? 0.42 : 0.26), c: projectColor(i) }
      })
      for (let i = 9; i < FORM_COUNT; i++) out.push(hidden(w / 2, h / 2, i))
      return out
    },
    [],
    { stiffness: 0.08, soft: 0.06 },
  )
  const gap = Math.min(window.innerWidth * 0.26, window.innerHeight * 0.18, 170)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-24">
      <div className="relative" style={{ width: gap * 3, height: gap * 3 }}>
        {PROJECTS.map((p, i) => {
          const slot = order[i]
          return (
            <motion.div
              key={p.id}
              className="absolute left-0 top-0"
              style={{ width: gap, height: gap }}
              initial={false}
              animate={{ x: (slot % 3) * gap, y: Math.floor(slot / 3) * gap }}
              transition={{ type: 'spring', stiffness: 90, damping: 16 }}
            >
              <div ref={(el) => (cells.current[p.id] = el)} className="h-full w-full" />
            </motion.div>
          )
        })}
      </div>
      <p className="mt-6 text-[19px]">{a.title}</p>
      <p className="mt-1 text-[14px] text-quiet">{a.kind}</p>
    </div>
  )
}

// A single line from the work, with the forms orbiting it.
function Quote({ a }) {
  useFormation(
    (t, w, h) => {
      const R = Math.min(w, h) * 0.42
      return Array.from({ length: FORM_COUNT }, (_, i) => {
        const ang = (i / FORM_COUNT) * Math.PI * 2 + t * 0.12
        return {
          x: w / 2 + Math.cos(ang) * R * (w > h ? 1.5 : 1),
          y: h / 2 + Math.sin(ang) * R,
          r: Math.min(w, h) * 0.035,
          c: i < 9 ? projectColor(i) : COLORS[0],
        }
      })
    },
    [],
    { stiffness: 0.04, soft: 0.06 },
  )
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-24 text-center">
      <blockquote className={`max-w-4xl text-[clamp(2.2rem,5vw,4.6rem)] italic ${display}`}>“{a.quote}”</blockquote>
      <p className="mt-6 text-[14px] text-quiet">{a.title}</p>
    </div>
  )
}
