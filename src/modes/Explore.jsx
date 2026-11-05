import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { DISCOVERIES, PROJECTS, related } from '../content.js'
import { FORM_COUNT, center, projectColor, useFormation } from '../formation.js'

// EXPLORE — navigation is spatial and free. No order, no index, no "next".
// Content priority: breadth and discovery. Each project is one form in a field
// larger than the screen. Hovering a project reveals what it shares with
// others: lines appear and connective forms travel along them.

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
      x: (c % cols) * cw + cw * (0.2 + r() * 0.45),
      y: Math.floor(c / cols) * ch + ch * (0.2 + r() * 0.45),
      depth: 0.7 + r() * (mobile ? 0.3 : 0.45),
    }
  })
  const notes = DISCOVERIES.map((d) => ({ ...d, x: 80 + r() * (W - 260), y: 80 + r() * (H - 160) }))
  return { projects, notes }
}

export default function Explore({ state, send }) {
  const { w, h } = useViewport()
  const mobile = w < 640
  const W = Math.max(w * (mobile ? 2.2 : 1.45), mobile ? 860 : 1400)
  const H = Math.max(h * (mobile ? 1.8 : 1.5), mobile ? 1300 : 1000)
  const [seed, setSeed] = useState(() => 1 + (state.memory.visits % 5))
  const world = useMemo(() => layout(W, H, seed, mobile), [W, H, seed, mobile])
  const [wander, setWander] = useState({}) // id -> {dx,dy}: projects that move on their own
  const [openId, setOpenId] = useState(null)
  const [hover, setHover] = useState(null)
  const [hint, setHint] = useState(true)
  const [whisper, setWhisper] = useState(null)
  const moved = useRef(false)
  const anchors = useRef({})
  const openAnchor = useRef(null)
  const lines = useRef([])
  const labels = useRef([])
  const live = useRef({ hover: null, openId: null })
  live.current = { hover, openId }

  const clampX = (v) => Math.min(0, Math.max(w - W, v))
  const clampY = (v) => Math.min(0, Math.max(h - H, v))

  // Start centred, or on the project you were last looking at.
  const start = useMemo(() => {
    const p = world.projects.find((x) => x.id === state.focusId)
    const cx = p ? p.x + 60 : W / 2
    const cy = p ? p.y + 60 : H / 2
    return { x: clampX(w / 2 - cx), y: clampY(h / 2 - cy) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const x = useMotionValue(start.x)
  const y = useMotionValue(start.y)

  // The forms follow the projects; relationships are drawn as they're found.
  useFormation(
    (t, vw, vh) => {
      const { hover: hv, openId: op } = live.current
      const out = []
      const pos = {}
      PROJECTS.forEach((p, i) => {
        const el = anchors.current[p.id]
        const c = center(el)
        const depth = Number(el?.dataset.depth ?? 1)
        if (!c) return out.push({ x: vw / 2, y: vh / 2, r: 0, c: projectColor(i) })
        let r = (mobile ? 34 : 44) * depth
        let px = c.x
        let py = c.y
        if (op) {
          if (p.id === op) {
            const a = center(openAnchor.current)
            if (a) {
              px = a.x
              py = a.y
              r = Math.min(a.w, a.h) * 0.34
            }
          } else r *= 0.3
        } else if (hv === p.id) r *= 1.35
        else r *= 1 + 0.04 * Math.sin(t * 1.2 + i)
        pos[p.id] = { x: px, y: py, r }
        out.push({ x: px, y: py, r, c: projectColor(i) })
      })

      const rel = hv && !op ? related(hv) : []
      for (let j = 0; j < 3; j++) {
        const line = lines.current[j]
        const label = labels.current[j]
        const link = rel[j]
        if (link && pos[hv] && pos[link.p.id]) {
          const a = pos[hv]
          const b = pos[link.p.id]
          const f = (t * 0.35 + j / 3) % 1
          const e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2
          out.push({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, r: a.r * 0.42, c: projectColor(PROJECTS.indexOf(link.p)) })
          if (line) {
            line.setAttribute('x1', a.x)
            line.setAttribute('y1', a.y)
            line.setAttribute('x2', b.x)
            line.setAttribute('y2', b.y)
            line.style.opacity = 1
          }
          if (label) {
            label.style.transform = `translate(${(a.x + b.x) / 2}px, ${(a.y + b.y) / 2}px) translate(-50%, -50%)`
            label.style.opacity = 1
            label.textContent = link.shared.join(' + ')
          }
        } else {
          const a = pos[hv] ?? pos[op] ?? { x: vw / 2, y: vh / 2 }
          out.push({ x: a.x, y: a.y, r: 0, c: projectColor(j) })
          if (line) line.style.opacity = 0
          if (label) label.style.opacity = 0
        }
      }
      return out.slice(0, FORM_COUNT)
    },
    [mobile],
    { stiffness: 0.09, soft: 0.06 },
  )

  // Unexpected: every so often, a project moves somewhere else.
  useEffect(() => {
    const id = setInterval(() => {
      if (live.current.openId || live.current.hover) return
      const p = PROJECTS[Math.floor(Math.random() * PROJECTS.length)]
      setWander((wd) => ({ ...wd, [p.id]: { dx: (Math.random() - 0.5) * 360, dy: (Math.random() - 0.5) * 260 } }))
      setWhisper(`${p.title} moved`)
    }, 9000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!whisper) return
    const t = setTimeout(() => setWhisper(null), 2600)
    return () => clearTimeout(t)
  }, [whisper])

  // Keyboard + wheel movement.
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
    setHover(null)
    setOpenId(id)
    send({ type: 'OPEN', id })
  }

  const scatter = () => {
    setSeed((s) => s + 1)
    setWander({})
    setWhisper('Layout regenerated')
  }

  const found = state.memory.discoveries
  const opened = state.memory.opened
  const active = world.projects.find((p) => p.id === openId)
  const relatedIds = hover ? related(hover).map((r) => r.p.id) : []

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      onWheel={onWheel}
    >
      {/* relationship lines, screen space, updated by the formation each frame */}
      <svg className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true">
        {[0, 1, 2].map((j) => (
          <line
            key={j}
            ref={(el) => (lines.current[j] = el)}
            stroke="#0D0D10"
            strokeOpacity="0.22"
            strokeWidth="1"
            strokeDasharray="2 5"
            style={{ opacity: 0, transition: 'opacity .3s' }}
          />
        ))}
      </svg>
      {[0, 1, 2].map((j) => (
        <span
          key={j}
          ref={(el) => (labels.current[j] = el)}
          className="pointer-events-none fixed left-0 top-0 z-20 whitespace-nowrap rounded-full border border-hair bg-white/80 px-2.5 py-1 text-[12px] font-medium text-ink backdrop-blur"
          style={{ opacity: 0, transition: 'opacity .3s' }}
        />
      ))}

      <motion.div
        className="absolute left-0 top-0 cursor-grab touch-none active:cursor-grabbing"
        style={{ x, y, width: W, height: H }}
        drag={!openId}
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
            dim={Boolean(openId) || (hover && hover !== p.id && !relatedIds.includes(p.id))}
            hidden={openId === p.id}
            anchorRef={(el) => (anchors.current[p.id] = el)}
            onHover={(v) => setHover(v ? p.id : null)}
            onOpen={() => open(p.id)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {whisper && (
          <motion.p
            key={whisper}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed right-4 top-11 z-30 text-[13px] text-quiet sm:right-8 sm:top-12"
          >
            {whisper}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hint && !openId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.6 } }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-[4.8rem] z-30 text-center text-[13px] text-quiet sm:bottom-[5.8rem]"
          >
            {mobile ? 'Drag to move. Tap a project.' : 'Drag or scroll to move. Hover a project to see what it shares.'}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <Opened
            key={active.id}
            p={active}
            anchorRef={openAnchor}
            links={related(active.id)}
            onClose={() => setOpenId(null)}
            onFocus={() => send({ type: 'CHOOSE', mode: 'focus', projectId: active.id })}
          />
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function Drifter({ p, i, x, y, start, offset, seen, dim, hidden, anchorRef, onHover, onOpen }) {
  // Depth parallax: far things move less than near things as you pan.
  const k = (1 - p.depth) * 0.45
  const px = useTransform(x, (v) => -(v - start.x) * k)
  const py = useTransform(y, (v) => -(v - start.y) * k)
  const size = Math.round(110 * p.depth)

  return (
    <motion.div
      className="absolute left-0 top-0"
      initial={{ x: p.x, y: p.y, opacity: 0 }}
      animate={{ x: p.x + (offset?.dx ?? 0), y: p.y + (offset?.dy ?? 0), opacity: 1 }}
      transition={{ type: 'spring', stiffness: 30, damping: 12, delay: offset ? 0 : 0.2 + i * 0.05 }}
    >
      <motion.div style={{ x: px, y: py }}>
        <button
          onClick={onOpen}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onFocus={() => onHover(true)}
          onBlur={() => onHover(false)}
          className="group flex items-center gap-4 text-left"
          aria-label={`Open ${p.title}`}
        >
          <span ref={anchorRef} data-depth={p.depth} className="block shrink-0 rounded-full" style={{ width: size, height: size }} />
          <motion.span
            className="block w-[12.5rem]"
            animate={{ opacity: hidden ? 0 : dim ? 0.25 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span layoutId={`title-${p.id}`} className="block text-[19px] font-medium leading-tight tracking-snug">
              {p.title}
            </motion.span>
            <span className="mt-1 block text-[13px] text-quiet">
              {p.kind}
              {seen > 0 && <span className="ml-1.5 text-ultra">· opened {seen}×</span>}
            </span>
          </motion.span>
        </button>
      </motion.div>
    </motion.div>
  )
}

// Hidden notes: a small point that only answers when you come close.
function Secret({ note, found, onFind }) {
  const [show, setShow] = useState(false)
  const reveal = () => {
    setShow(true)
    if (!found) onFind()
  }
  return (
    <div
      className="absolute p-3"
      style={{ left: note.x, top: note.y }}
      onMouseEnter={reveal}
      onMouseLeave={() => setShow(false)}
      onClick={reveal}
    >
      <motion.span
        className={`block h-2 w-2 rounded-full ${found ? 'bg-ultra' : 'bg-ink/20'}`}
        animate={{ scale: show ? 1.8 : 1 }}
        aria-label="Hidden note"
      />
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ opacity: 0, x: -4, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-8 top-1 z-[300] w-60 rounded-xl border border-hair bg-white/85 px-3 py-2 text-[14px] leading-snug backdrop-blur"
          >
            {note.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// Opening a project is a reorganisation of the same field: its form travels
// here and grows, every other form recedes.
function Opened({ p, anchorRef, links, onClose, onFocus }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 overflow-y-auto no-scrollbar"
      onClick={onClose}
      initial={{ backgroundColor: 'rgba(242,242,240,0)' }}
      animate={{ backgroundColor: 'rgba(242,242,240,0.55)' }}
      exit={{ backgroundColor: 'rgba(242,242,240,0)', pointerEvents: 'none' }}
    >
      <div className="mx-auto grid min-h-full max-w-6xl items-center gap-4 px-5 pb-28 pt-20 sm:grid-cols-2 sm:gap-12 sm:px-10">
        <div ref={anchorRef} className="h-[30vh] sm:h-[55vh]" aria-hidden="true" />
        <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <motion.h2 layoutId={`title-${p.id}`} className="balance text-[clamp(2.4rem,5vw,4.6rem)] font-light leading-[1] tracking-display">
            {p.title}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }} exit={{ opacity: 0 }}>
            <p className="mt-4 text-[14px] text-quiet">
              {p.kind} · {p.year}
            </p>
            <p className="mt-4 max-w-xl text-[21px] leading-snug">{p.line}</p>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink/70">{p.body}</p>
            {links.length > 0 && (
              <p className="mt-5 text-[13px] text-quiet">
                Connected to {links.map((l) => l.p.title).join(', ')}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button onClick={onFocus} className="rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-white hover:bg-ultra">
                Focus on this
              </button>
              <button onClick={onClose} className="rounded-full px-4 py-3 text-[15px] text-quiet hover:text-ink">
                Back to the field
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
