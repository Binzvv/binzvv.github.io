import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { DISCOVERIES, PROJECTS } from '../content.js'
import Glyph from '../components/Glyph.jsx'

// EXPLORE — navigation is spatial and free. No order, no index, no "next".
// Content priority: breadth and discovery. The world drifts, rearranges itself
// and hides things that only reward wandering.

function rng(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

function layout(W, H, seed, mobile) {
  const r = rng(seed * 7919 + 17)
  const cols = 3
  const rows = 3
  const cw = W / cols
  const ch = H / rows
  const cells = PROJECTS.map((_, i) => i).sort(() => r() - 0.5)
  const projects = PROJECTS.map((p, i) => {
    const c = cells[i]
    return {
      ...p,
      x: (c % cols) * cw + cw * (0.18 + r() * 0.5),
      y: Math.floor(c / cols) * ch + ch * (0.15 + r() * 0.5),
      depth: 0.62 + r() * (mobile ? 0.38 : 0.5),
      dur: 7 + r() * 6,
      delay: -r() * 8,
    }
  })
  const notes = DISCOVERIES.map((d) => ({ ...d, x: 80 + r() * (W - 260), y: 80 + r() * (H - 160) }))
  const marks = Array.from({ length: 14 }, (_, i) => ({ id: i, x: r() * W, y: r() * H }))
  return { projects, notes, marks }
}

export default function Explore({ state, send, panRef }) {
  const { w, h } = useViewport()
  const mobile = w < 640
  const W = Math.max(w * (mobile ? 2.6 : 1.85), mobile ? 980 : 1500)
  const H = Math.max(h * (mobile ? 2.1 : 1.9), mobile ? 1500 : 1150)
  const [seed, setSeed] = useState(() => 1 + (state.memory.visits % 5))
  const world = useMemo(() => layout(W, H, seed, mobile), [W, H, seed, mobile])
  const [wander, setWander] = useState({}) // id -> {dx,dy}: projects that wander off on their own
  const [openId, setOpenId] = useState(null)
  const [hint, setHint] = useState(true)
  const [whisper, setWhisper] = useState(null)
  const moved = useRef(false)
  const coord = useRef(null)

  const clampX = (v) => Math.min(0, Math.max(w - W, v))
  const clampY = (v) => Math.min(0, Math.max(h - H, v))

  // Start centred — or on the project you were last looking at.
  const start = useMemo(() => {
    const p = world.projects.find((x) => x.id === state.focusId)
    const cx = p ? p.x + 60 : W / 2
    const cy = p ? p.y + 60 : H / 2
    return { x: clampX(w / 2 - cx), y: clampY(h / 2 - cy) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const x = useMotionValue(start.x)
  const y = useMotionValue(start.y)

  const syncPan = () => {
    panRef.current = { x: x.get(), y: y.get() }
    if (coord.current)
      coord.current.textContent = `x ${String(Math.round(-x.get())).padStart(4, '0')} · y ${String(Math.round(-y.get())).padStart(4, '0')}`
  }
  useMotionValueEvent(x, 'change', syncPan)
  useMotionValueEvent(y, 'change', syncPan)
  useEffect(syncPan, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Unpredictability: every so often, something gets up and moves.
  useEffect(() => {
    const id = setInterval(() => {
      if (openId) return
      const p = PROJECTS[Math.floor(Math.random() * PROJECTS.length)]
      setWander((wd) => ({ ...wd, [p.id]: { dx: (Math.random() - 0.5) * 360, dy: (Math.random() - 0.5) * 260 } }))
      setWhisper(`${p.title} moved`)
    }, 9000)
    return () => clearInterval(id)
  }, [openId])
  useEffect(() => {
    if (!whisper) return
    const t = setTimeout(() => setWhisper(null), 2600)
    return () => clearTimeout(t)
  }, [whisper])

  // Keyboard + wheel wander.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenId(null)
      if (openId) return
      const step = 160
      const k = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key]
      if (k) {
        animate(x, clampX(x.get() + k[0]), { type: 'spring', stiffness: 120, damping: 22 })
        animate(y, clampY(y.get() + k[1]), { type: 'spring', stiffness: 120, damping: 22 })
        setHint(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onWheel = (e) => {
    if (openId) return
    x.set(clampX(x.get() - e.deltaX))
    y.set(clampY(y.get() - e.deltaY))
    setHint(false)
  }

  const open = (id) => {
    if (moved.current) return
    setOpenId(id)
    send({ type: 'OPEN', id })
  }

  const scatter = () => {
    setSeed((s) => s + 1)
    setWander({})
    setWhisper('The room rearranged itself')
  }

  const found = state.memory.discoveries
  const opened = state.memory.opened
  const active = world.projects.find((p) => p.id === openId)

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 1.1, ease: [0.2, 0.7, 0.1, 1] } }}
      exit={{ opacity: 0, scale: 1.25, filter: 'blur(8px)', transition: { duration: 0.7, ease: 'easeIn' } }}
      onWheel={onWheel}
    >
      <motion.div
        className="absolute left-0 top-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ x, y, width: W, height: H }}
        drag
        dragConstraints={{ left: w - W, right: 0, top: h - H, bottom: 0 }}
        dragElastic={0.12}
        dragTransition={{ power: 0.35, timeConstant: 320 }}
        onPointerDownCapture={() => (moved.current = false)}
        onDragStart={() => {
          moved.current = true
          setHint(false)
        }}
        onDoubleClick={(e) => e.target === e.currentTarget && scatter()}
      >
        {/* Survey marks: a sense of place without a map. */}
        {world.marks.map((m) => (
          <span
            key={m.id}
            className="label pointer-events-none absolute text-ash/30"
            style={{ left: m.x, top: m.y }}
          >
            + {Math.round(m.x)}.{Math.round(m.y)}
          </span>
        ))}

        {world.notes.map((n) => (
          <Secret key={n.id} note={n} found={found.includes(n.id)} onFind={() => send({ type: 'DISCOVER', id: n.id })} />
        ))}

        {world.projects.map((p, i) => (
          <Drifter
            key={p.id}
            p={p}
            i={i}
            x={x}
            y={y}
            start={start}
            offset={wander[p.id]}
            seen={opened[p.id] ?? 0}
            hidden={openId === p.id}
            onOpen={() => open(p.id)}
          />
        ))}
      </motion.div>

      {/* HUD */}
      <div className="pointer-events-none fixed right-4 top-4 z-30 text-right sm:right-6 sm:top-5">
        <p ref={coord} className="label tabular-nums text-ash" />
        <p className="label mt-1 text-ash/70">
          <span className="text-signal">✶</span> {found.length}/{DISCOVERIES.length} found
        </p>
      </div>

      <AnimatePresence>
        {whisper && (
          <motion.p
            key={whisper}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="label pointer-events-none fixed right-4 top-16 z-30 text-signal sm:right-6"
          >
            → {whisper}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.4 } }}
            exit={{ opacity: 0 }}
            className="label pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap text-ash"
          >
            {mobile ? 'drag to wander' : 'drag · scroll · arrows to wander'}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <Opened
            key={active.id}
            p={active}
            onClose={() => setOpenId(null)}
            onFocus={() => send({ type: 'CHOOSE', mode: 'focus', projectId: active.id })}
          />
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function Drifter({ p, i, x, y, start, offset, seen, hidden, onOpen }) {
  const [hot, setHot] = useState(false)
  // Depth parallax: far things move less than near things as you pan.
  const k = (1 - p.depth) * 0.45
  const px = useTransform(x, (v) => -(v - start.x) * k)
  const py = useTransform(y, (v) => -(v - start.y) * k)
  const size = Math.round(96 * p.depth)

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ zIndex: Math.round(p.depth * 100) }}
      initial={{ x: p.x, y: p.y + 80, opacity: 0 }}
      animate={{ x: p.x + (offset?.dx ?? 0), y: p.y + (offset?.dy ?? 0), opacity: 1 }}
      transition={{ type: 'spring', stiffness: 30, damping: 12, delay: offset ? 0 : 0.2 + i * 0.06 }}
    >
      <motion.div style={{ x: px, y: py, scale: p.depth }}>
        <div className="float" style={{ '--dur': `${p.dur}s`, '--delay': `${p.delay}s` }}>
          <button
            onClick={onOpen}
            onMouseEnter={() => setHot(true)}
            onMouseLeave={() => setHot(false)}
            className="group block text-left"
            style={{ opacity: hidden ? 0 : 0.45 + p.depth * 0.5 }}
            aria-label={`Open ${p.title}`}
          >
            <motion.div layoutId={`glyph-${p.id}`}>
              <Glyph seed={p.seed} size={size} active={hot} />
            </motion.div>
            <motion.h3
              layoutId={`title-${p.id}`}
              className="mt-3 max-w-[16rem] font-serif text-[2.1rem] leading-[0.95] tracking-tight transition-colors group-hover:text-signal"
            >
              {p.title}
            </motion.h3>
            <p className="label mt-2 text-ash">
              {p.kind}
              {seen > 0 && <span className="ml-2 text-signal">seen ×{seen}</span>}
            </p>
            <motion.p
              initial={false}
              animate={{ opacity: hot ? 1 : 0, y: hot ? 0 : -4 }}
              className="mt-2 max-w-[15rem] font-serif text-lg italic leading-snug text-bone/80"
            >
              {p.line}
            </motion.p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Secret({ note, found, onFind }) {
  const [show, setShow] = useState(false)
  const reveal = () => {
    setShow(true)
    if (!found) onFind()
  }
  return (
    <div
      className="absolute"
      style={{ left: note.x, top: note.y }}
      onMouseEnter={reveal}
      onMouseLeave={() => setShow(false)}
      onClick={reveal}
    >
      <span className={`block p-3 text-sm transition-colors ${found ? 'text-signal' : 'text-bone/25'}`}>✶</span>
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-9 top-2 w-56 font-serif text-lg italic leading-snug text-bone"
          >
            {note.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Opened({ p, onClose, onFocus }) {
  return (
    <motion.div className="fixed inset-0 z-40 overflow-y-auto no-scrollbar" onClick={onClose} exit={{ pointerEvents: 'none' }}>
      <motion.div
        className="absolute inset-0 bg-ink/85"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div
        className="relative mx-auto flex min-h-full max-w-6xl flex-col justify-center gap-8 px-5 py-24 sm:flex-row sm:items-center sm:gap-16 sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div layoutId={`glyph-${p.id}`} className="shrink-0">
          <Glyph seed={p.seed} size={220} active />
        </motion.div>
        <div>
          <motion.h2 layoutId={`title-${p.id}`} className="font-serif text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tight">
            {p.title}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0 }}>
            <p className="label mt-5 text-ash">
              {p.kind} · {p.year}
            </p>
            <p className="mt-5 max-w-xl font-serif text-2xl italic leading-snug text-bone/90">{p.line}</p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash">{p.body}</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <button onClick={onFocus} className="label text-bone underline decoration-signal underline-offset-4">
                Focus on this →
              </button>
              <button onClick={onClose} className="label text-ash hover:text-bone">
                Back to the field [esc]
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
