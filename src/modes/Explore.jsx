import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { DISCOVERIES, PROJECTS } from '../content.js'
import Sticker from '../components/Sticker.jsx'

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
      tilt: (r() - 0.5) * 26,
      dur: 7 + r() * 6,
      delay: -r() * 8,
    }
  })
  const notes = DISCOVERIES.map((d) => ({ ...d, x: 80 + r() * (W - 260), y: 80 + r() * (H - 160) }))
  // Confetti: small cut shapes that give the floor texture and scale, nothing to read.
  const PAL = ['#2B4BFF', '#FF5A36', '#FFA3D7', '#FFD23F', '#151515']
  const bits = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: r() * W,
    y: r() * H,
    kind: i % 4,
    color: PAL[Math.floor(r() * PAL.length)],
    rot: r() * 360,
    s: 0.6 + r() * 0.9,
  }))
  return { projects, notes, bits }
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
      setWhisper(`${p.title} wandered off`)
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
    setWhisper('I rearranged the room')
  }

  const found = state.memory.discoveries
  const opened = state.memory.opened
  const active = world.projects.find((p) => p.id === openId)

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 1, ease: [0.2, 0.7, 0.1, 1] } }}
      exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.6, ease: 'easeIn' } }}
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
        {world.bits.map((b) => (
          <Bit key={b.id} b={b} />
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

      {/* The only readout: how much you've discovered. */}
      <div className="pointer-events-none fixed right-4 top-4 z-30 flex flex-col items-end gap-2 sm:right-6 sm:top-5">
        <p className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-bold ring-2 ring-ink">
          <span className="flex h-6 items-center gap-0.5 rounded-full bg-ink px-1.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          {found.length} of {DISCOVERIES.length} secrets
        </p>
        <AnimatePresence>
          {whisper && (
            <motion.p
              key={whisper}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="rounded-full bg-sun px-3 py-1 text-sm font-bold ring-2 ring-ink"
            >
              {whisper}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 1.4 } }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-bold text-white sm:bottom-7"
          >
            {mobile ? 'Drag to wander. Tap a sticker.' : 'Drag, scroll or use arrows to wander. Double-click the floor.'}
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

function Bit({ b }) {
  const st = { left: b.x, top: b.y, transform: `rotate(${b.rot}deg) scale(${b.s})`, color: b.color }
  return (
    <svg className="pointer-events-none absolute" style={st} width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      {b.kind === 0 && <path d="M4 22 q8 -14 16 0 t16 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />}
      {b.kind === 1 && <circle cx="20" cy="20" r="8" fill="currentColor" />}
      {b.kind === 2 && <polygon points="20,6 34,32 6,32" fill="currentColor" />}
      {b.kind === 3 && <rect x="8" y="16" width="24" height="9" rx="4.5" fill="currentColor" />}
    </svg>
  )
}

function Drifter({ p, i, x, y, start, offset, seen, hidden, onOpen }) {
  const [hot, setHot] = useState(false)
  // Depth parallax: far things move less than near things as you pan.
  const k = (1 - p.depth) * 0.45
  const px = useTransform(x, (v) => -(v - start.x) * k)
  const py = useTransform(y, (v) => -(v - start.y) * k)
  const size = Math.round(170 * p.depth)

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ zIndex: hot ? 200 : Math.round(p.depth * 100) }}
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
            className="group relative block text-left"
            style={{ opacity: hidden ? 0 : 1 }}
            aria-label={`Open ${p.title}`}
          >
            <motion.div layoutId={`art-${p.id}`}>
              <Sticker id={p.id} size={size} tilt={p.tilt} active={hot} />
            </motion.div>
            {seen > 0 && (
              <span className="absolute -right-2 top-2 rotate-12 rounded-full bg-cobalt px-2.5 py-1 text-xs font-bold text-white ring-2 ring-ink">
                seen {seen}×
              </span>
            )}
            <motion.h3
              layoutId={`title-${p.id}`}
              className="w-wide mt-1 max-w-[17rem] font-display text-[1.7rem] font-black uppercase leading-[0.9]"
            >
              {p.title}
            </motion.h3>
            <p className="mt-1.5 text-[15px] font-semibold text-mute">{p.kind}</p>
            <motion.p
              initial={false}
              animate={{ opacity: hot ? 1 : 0, y: hot ? 0 : -6, scale: hot ? 1 : 0.95 }}
              className="mt-2 max-w-[15rem] rounded-2xl rounded-tl-sm bg-ink px-3 py-2 text-[15px] font-semibold leading-snug text-white"
            >
              {p.line}
            </motion.p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// A pair of eyes peeking from the floor. Only noticed by people who wander.
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
      <span
        className={`flex items-center gap-[3px] rounded-full p-2 transition-all ${found ? 'bg-ink' : 'bg-ink/0'}`}
        aria-label="Something is hiding here"
      >
        <span className={`h-3 w-3 rounded-full ring-2 ${found ? 'bg-white ring-white' : 'bg-white/80 ring-ink/40'}`} />
        <span className={`h-3 w-3 rounded-full ring-2 ${found ? 'bg-white ring-white' : 'bg-white/80 ring-ink/40'}`} />
      </span>
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, scale: 0.6, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0 }}
            style={{ originX: 0 }}
            className="pointer-events-none absolute left-12 top-0 z-[300] w-60 rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[15px] font-semibold leading-snug ring-2 ring-ink"
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
      <motion.div className="absolute inset-0 bg-ground/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <div
        className="relative mx-auto flex min-h-full max-w-6xl flex-col justify-center gap-6 px-5 pb-28 pt-20 sm:flex-row sm:items-center sm:gap-12 sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div layoutId={`art-${p.id}`} className="shrink-0 self-center">
          <Sticker id={p.id} size={window.innerWidth < 640 ? 190 : 300} tilt={-4} />
        </motion.div>
        <div className="min-w-0">
          <motion.h2
            layoutId={`title-${p.id}`}
            className="w-wide font-display text-[clamp(2.4rem,6vw,5.2rem)] font-black uppercase leading-[0.86]"
          >
            {p.title}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} exit={{ opacity: 0 }}>
            <p className="mt-4 text-[15px] font-bold text-mute">
              {p.kind}, {p.year}
            </p>
            <p className="mt-3 max-w-xl text-2xl font-bold leading-snug">{p.line}</p>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ink/80">{p.body}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={onFocus} className="rounded-full bg-ink px-5 py-3 font-bold text-white hover:bg-cobalt">
                Focus on this →
              </button>
              <button onClick={onClose} className="rounded-full px-4 py-3 font-bold text-mute hover:text-ink">
                Back to wandering <span className="hidden sm:inline">· Esc</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
