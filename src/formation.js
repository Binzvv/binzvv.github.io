import { useEffect } from 'react'
import { PROJECTS } from './content.js'

// The forms are the system's body. There are always the same 12 of them:
// one per project (0–8) and three "connective" forms (9–11) that become
// bridges, merges or intent markers. Whatever is on screen decides where they
// go by publishing a formation: a function returning 12 targets
// { x, y, r, c } in CSS pixels. The Field springs every form toward its target,
// so moving between states is the same forms visibly reorganising.

export const FORM_COUNT = 12
export const COLORS = [
  [0.21, 0.25, 1.0], // ultramarine
  [0.8, 0.96, 0.29], // lime
  [1.0, 0.52, 0.4], // coral
]
export const projectColor = (i) => COLORS[[0, 2, 0, 1, 0, 2, 1, 0, 2][i % 9]]
export const indexOf = Object.fromEntries(PROJECTS.map((p, i) => [p.id, i]))

export const formation = {
  fn: null, // (t, w, h) => targets
  stiffness: 0.06, // how decisively forms travel
  soft: 0.08, // edge softness
}

export function useFormation(fn, deps, { stiffness = 0.06, soft = 0.08 } = {}) {
  useEffect(() => {
    formation.fn = fn
    formation.stiffness = stiffness
    formation.soft = soft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export const center = (el) => {
  if (!el) return null
  const b = el.getBoundingClientRect()
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }
}

// Twelve forms gathered into one organic mass around (x, y).
export function mass(x, y, R, t, lead = 0, calm = 1) {
  return Array.from({ length: FORM_COUNT }, (_, i) => {
    if (i === lead) return { x, y, r: R, c: i < 9 ? projectColor(i) : COLORS[0] }
    const a = i * 2.39996 + t * 0.15 * calm
    const d = R * (0.42 + 0.12 * Math.sin(t * 0.4 * calm + i))
    return {
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d * 0.85,
      r: R * (0.42 + ((i * 37) % 10) / 40),
      c: i < 9 ? projectColor(i) : COLORS[i % 3],
    }
  })
}
