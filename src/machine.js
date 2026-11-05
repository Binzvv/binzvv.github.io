// A tiny explicit state machine.
// States: intro → explore | focus | surprise (any mode can move to any other).
// Each state declares which events it accepts; anything else is ignored.
// `memory` is the part that survives a reload (localStorage).
// `session` is per-mode behaviour that drives the site "changing its mind".

import { PROJECTS } from './content.js'

const KEY = 'tstcim:v1'

export const freshMemory = () => ({
  visits: 0,
  lastMode: null,
  lastProject: null,
  opened: {}, // projectId -> times opened (Explore) or read (Focus)
  read: [], // projects read to the end in Focus
  discoveries: [], // hidden notes found
  scenes: 0, // Surprise scenes seen
  switches: 0, // intent changes
  updatedAt: null,
})

const freshSession = () => ({
  opens: 0, // explore: projects opened this session
  counts: {}, // explore: projectId -> opens this session
  skips: 0, // focus: moved on without reading
  interrupts: 0, // surprise: scenes cut short
  dismissed: [], // nudges dismissed this session
  enteredAt: Date.now(),
})

export function loadMemory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const m = JSON.parse(raw)
    return { ...freshMemory(), ...m }
  } catch {
    return null
  }
}

export function saveMemory(memory) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...memory, updatedAt: Date.now() }))
  } catch {
    /* private mode — the experience still works, it just forgets */
  }
}

export function clearMemory() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function initialState() {
  const stored = loadMemory()
  const memory = stored ?? freshMemory()
  memory.visits += 1
  return {
    status: 'intro',
    returning: Boolean(stored && stored.lastMode),
    memory,
    session: freshSession(),
    focusId: memory.lastProject ?? null,
  }
}

const enterMode = (state, mode, projectId) => ({
  ...state,
  status: mode,
  returning: false,
  session: freshSession(),
  focusId: projectId ?? state.focusId ?? state.memory.lastProject,
  memory: {
    ...state.memory,
    lastMode: mode,
    lastProject: projectId ?? state.memory.lastProject,
    switches: state.status === 'intro' ? state.memory.switches : state.memory.switches + 1,
  },
})

const bump = (obj, id) => ({ ...obj, [id]: (obj[id] ?? 0) + 1 })
const uniq = (arr, v) => (arr.includes(v) ? arr : [...arr, v])

// Shared events available from every mode.
const common = {
  CHOOSE: (s, e) => (e.mode === s.status && !e.projectId ? s : enterMode(s, e.mode, e.projectId)),
  RESET: () => {
    clearMemory()
    const memory = freshMemory()
    memory.visits = 1
    return { status: 'intro', returning: false, memory, session: freshSession(), focusId: null }
  },
  DISMISS_NUDGE: (s, e) => ({ ...s, session: { ...s.session, dismissed: uniq(s.session.dismissed, e.key) } }),
  DISCOVER: (s, e) => ({ ...s, memory: { ...s.memory, discoveries: uniq(s.memory.discoveries, e.id) } }),
}

const machine = {
  intro: {
    CHOOSE: (s, e) => enterMode(s, e.mode, e.projectId),
    RESUME: (s) => enterMode(s, s.memory.lastMode, s.memory.lastProject),
    RESET: common.RESET,
  },
  explore: {
    ...common,
    OPEN: (s, e) => ({
      ...s,
      focusId: e.id,
      session: { ...s.session, opens: s.session.opens + 1, counts: bump(s.session.counts, e.id) },
      memory: { ...s.memory, opened: bump(s.memory.opened, e.id), lastProject: e.id },
    }),
  },
  focus: {
    ...common,
    SHOW: (s, e) => ({ ...s, focusId: e.id, memory: { ...s.memory, lastProject: e.id } }),
    SKIP: (s) => ({ ...s, session: { ...s.session, skips: s.session.skips + 1 } }),
    READ: (s, e) => ({
      ...s,
      session: { ...s.session, skips: 0 },
      memory: { ...s.memory, read: uniq(s.memory.read, e.id), opened: bump(s.memory.opened, e.id) },
    }),
  },
  surprise: {
    ...common,
    SCENE: (s, e) => ({
      ...s,
      focusId: e.projectId ?? s.focusId,
      memory: { ...s.memory, scenes: s.memory.scenes + 1 },
    }),
    INTERRUPT: (s) => ({ ...s, session: { ...s.session, interrupts: s.session.interrupts + 1 } }),
  },
}

export function reducer(state, event) {
  const handler = machine[state.status]?.[event.type]
  return handler ? handler(state, event) : state
}

// ── Behavioural intelligence ────────────────────────────────────────────────
// Simple rules that let the site propose a different behaviour based on what
// the visitor actually does. Returns at most one suggestion.
export function suggestion(state) {
  const { status, session, memory } = state
  const off = (key) => session.dismissed.includes(key)

  if (status === 'explore') {
    const circling = Object.entries(session.counts).find(([, n]) => n >= 2)
    if (circling && !off('circling')) {
      const p = PROJECTS.find((x) => x.id === circling[0])
      return {
        key: 'circling',
        text: `You’ve opened ${p.title} ${circling[1]} times.`,
        cta: 'Focus on it',
        event: { type: 'CHOOSE', mode: 'focus', projectId: p.id },
      }
    }
    if (session.opens >= 5 && !off('many')) {
      return {
        key: 'many',
        text: `You’ve opened ${session.opens} projects.`,
        cta: 'See them one at a time',
        event: { type: 'CHOOSE', mode: 'focus', projectId: state.focusId },
      }
    }
  }

  if (status === 'focus' && session.skips >= 4 && !off('skipping')) {
    return {
      key: 'skipping',
      text: `You’ve skipped ${session.skips} in a row without reading.`,
      cta: 'Browse them in space',
      event: { type: 'CHOOSE', mode: 'explore' },
    }
  }

  if (status === 'surprise' && session.interrupts >= 6 && !off('restless')) {
    return {
      key: 'restless',
      text: `You’ve skipped ${session.interrupts} scenes.`,
      cta: 'Show one project properly',
      event: { type: 'CHOOSE', mode: 'focus', projectId: state.focusId },
    }
  }

  return null
}
