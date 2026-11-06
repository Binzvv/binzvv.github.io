import { AnimatePresence, motion } from 'motion/react'
import { Plate } from './Plate'

const R = (a, b = a) => `${a}% ${a}% ${a}% ${a}% / ${b}% ${b}% ${b}% ${b}%`
const ELLIPSE = R(50)
const SHARP = R(0)
const BLOB = '58% 42% 36% 64% / 44% 38% 62% 56%'

/**
 * The aperture is the brand mark: a window onto the outside.
 * It never moves the landscape — it only changes the opening through which
 * you see it. Its shape and tempo ARE the identity in each behavioural state.
 */
export function apertureGeometry({ phase, mode, hover, mobile, goStage, W, H }) {
  const full = { x: 0, y: 0, w: W, h: H, r: SHARP, o: 1 }
  const shapes = {
    idle: mobile ? { x: W * 0.2, y: H * 0.13, w: W * 0.6, h: H * 0.4, r: ELLIPSE } : { x: W * 0.62, y: H * 0.15, w: W * 0.24, h: H * 0.66, r: ELLIPSE },
    escape: mobile ? { x: -W * 0.2, y: H * 0.1, w: W * 1.4, h: H * 0.2, r: ELLIPSE } : { x: -W * 0.04, y: H * 0.1, w: W * 1.08, h: H * 0.3, r: ELLIPSE },
    push: mobile ? { x: W * 0.72, y: H * 0.05, w: W * 0.16, h: H * 0.58, r: SHARP } : { x: W * 0.8, y: H * 0.04, w: W * 0.085, h: H * 0.92, r: SHARP },
    wander: mobile ? { x: W * 0.22, y: H * 0.12, w: W * 0.62, h: H * 0.38, r: BLOB } : { x: W * 0.55, y: H * 0.2, w: W * 0.33, h: H * 0.52, r: BLOB },
  }
  if (phase === 'opening') return { ...shapes[hover || 'idle'], o: 1 }
  const world = {
    escape: full,
    // PUSH: hard crop that bleeds off the edge; full-bleed on phones, type sits on the image
    push: mobile ? full : { x: W * 0.3, y: 0, w: W * 0.7, h: H, r: SHARP, o: 1 },
    wander: { ...shapes.wander, o: 0 },
  }
  if (phase === 'gone') {
    if (goStage >= 3) return full
    if (mode === 'wander' || !mode)
      return mobile ? { x: W * 0.12, y: H * 0.2, w: W * 0.76, h: H * 0.5, r: BLOB, o: goStage >= 1 ? 1 : 0 } : { x: W * 0.32, y: H * 0.18, w: W * 0.36, h: H * 0.62, r: BLOB, o: goStage >= 1 ? 1 : 0 }
    return world[mode]
  }
  return world[mode]
}

export default function Aperture({ geom, story, grade, transition, flatten, settle, size }) {
  const { x, y, w, h, r, o } = geom
  const t = transition
  return (
    <motion.div
      aria-hidden={o === 0}
      className="fixed left-0 top-0 z-10 overflow-hidden"
      initial={false}
      animate={{ x, y, width: w, height: h, borderRadius: r, opacity: o }}
      transition={{ ...t, opacity: { duration: 1.2 } }}
      style={{ willChange: 'transform, width, height' }}
    >
      {/* the landscape stays still relative to the screen; the window moves */}
      <motion.div className="absolute" initial={false} animate={{ x: -x, y: -y }} transition={t} style={{ width: size.W, height: size.H }}>
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            flatten
              ? { filter: 'grayscale(1) blur(14px) brightness(1.08) contrast(0.72)', scale: 1.08 }
              : settle
                ? { filter: 'grayscale(0) blur(0px) brightness(1) contrast(1)', scale: 1.06 }
                : { filter: 'grayscale(0) blur(0px) brightness(1) contrast(1)', scale: 1 }
          }
          transition={{ duration: flatten ? 3.2 : settle ? 9 : 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={story.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: t.duration ? Math.max(0.35, t.duration * 0.9) : 1 }}
            >
              <Plate story={story} grade={grade} style={{ '--grain': flatten ? 0 : undefined }} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
