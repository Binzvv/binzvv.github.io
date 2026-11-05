// A tiny explicit state machine.
// States: intro → explore | focus | surprise (any mode can move to any other).
// Each state declares which events it accepts; anything else is ignored.
// `memory` is the part that survives a reload (localStorage).
// `session` is per-mode behaviour.
// `engine` is the behavioural engine: observed signals, the rule that fired,
// the suggestion on screen, and a log of why. The engine only ever proposes;
// every change of mode or content still needs the visitor to act.

import { PROJECTS, byId, related } from './content.js'
import { THRESHOLDS } from './engine.js'

const KEY = 'tstcim:v1'

export const freshMemory = () => ({
  visits: 0,
  lastMode: null,
  lastProject: null,
  lastAction: null, // { kind, projectId, mode, at } — the last meaningful interaction
  opened: {}, // projectId -> times opened (Explore) or read (Focus)
  read: [], // projects read to the end in Focus
  kept: [], // projects the visitor chose to keep within reach
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

const freshEngine = () => ({
  skipStreak: 0,
  idle: false,
  active: null, // the suggestion currently offered
  fired: [], // rule keys already offered this visit (never nag twice)
  outcome: null, // { key, result: accepted | dismissed | expired | cleared, choice }
  log: [],
  deep: null, // project whose deeper layer is open
  jump: null, // { id, n } bring a project forward in the current mode
  unseen: 0, // counter: Explore highlights projects not yet opened
  spotlight: null, // { id, n } Explore shows a project's connections
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

// ── log helpers ─────────────────────────────────────────────────────────────
const log = (s, kind, text) => ({
  ...s,
  engine: { ...s.engine, log: [{ at: Date.now(), kind, text }, ...s.engine.log].slice(0, 14) },
})
const eng = (s, patch) => ({ ...s, engine: { ...s.engine, ...patch } })

export function describeAction(a) {
  if (!a) return null
  const p = byId[a.projectId]
  const verb = { opened: 'opened', read: 'read', deep: 'went deeper into', kept: 'kept' }[a.kind] ?? a.kind
  return p ? `${verb} ${p.title}` : verb
}

export function initialState() {
  const stored = loadMemory()
  const memory = stored ?? freshMemory()
  memory.visits += 1
  let s = {
    status: 'intro',
    returning: Boolean(stored && stored.lastMode),
    memory,
    session: freshSession(),
    engine: freshEngine(),
    focusId: memory.lastProject ?? null,
  }
  if (s.returning) {
    const mins = Math.max(1, Math.round((Date.now() - (memory.updatedAt ?? Date.now())) / 60000))
    s = log(s, 'observe', `RETURNING: stored memory found, last visit ${mins} min ago${memory.lastAction ? `, last ${describeAction(memory.lastAction)}` : ''}`)
    s = log(s, 'rule', 'returning (reload): offer to continue or start fresh on the first screen')
  }
  return s
}

const enterMode = (state, mode, projectId) => {
  let s = {
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
  }
  const pending = s.engine.active
  s = eng(s, { skipStreak: 0, active: null, deep: null, spotlight: null, jump: null, outcome: pending ? { key: pending.key, result: 'cleared' } : s.engine.outcome })
  if (pending) s = log(s, 'outcome', `${pending.key}: cleared by a change of mode`)
  return log(s, 'state', `Mode → ${mode} (chosen by visitor)`)
}

const bump = (obj, id) => ({ ...obj, [id]: (obj[id] ?? 0) + 1 })
const uniq = (arr, v) => (arr.includes(v) ? arr : [...arr, v])
const title = (id) => byId[id]?.title ?? id

// ── rules → suggestions ────────────────────────────────────────────────────
// Each suggestion names what was observed and offers choices. Actions are
// plain events; nothing is applied until the visitor picks one.
function build(key, s, data = {}) {
  const mode = s.status
  if (key === 'skipping') {
    const actions =
      mode === 'explore'
        ? [
            { label: 'Show what you haven’t opened', event: { type: 'SHOW_UNSEEN' } },
            { label: 'One at a time', event: { type: 'CHOOSE', mode: 'focus' } },
          ]
        : mode === 'focus'
          ? [
              { label: 'Browse in space', event: { type: 'CHOOSE', mode: 'explore' } },
              { label: 'Surprise me', event: { type: 'CHOOSE', mode: 'surprise' } },
            ]
          : [
              { label: 'Show one properly', event: { type: 'CHOOSE', mode: 'focus', projectId: s.focusId } },
              { label: 'Explore instead', event: { type: 'CHOOSE', mode: 'explore' } },
            ]
    return {
      key,
      rule: `${THRESHOLDS.skips} consecutive skips`,
      observed: data.observed,
      text: mode === 'surprise' ? 'You’ve skipped a few scenes. Want a different direction?' : 'You’ve skipped a few. Want a different direction?',
      actions,
    }
  }
  if (key.startsWith('dwell:')) {
    return {
      key,
      rule: `${THRESHOLDS.dwell / 1000}s of active time on one project`,
      observed: data.observed,
      text: 'Interested in this one? There’s more to explore.',
      actions: [{ label: 'Show more', event: { type: 'SHOW_DEEP', id: data.id } }],
    }
  }
  if (key.startsWith('revisit:')) {
    const rel = related(data.id)[0]?.p
    const alt =
      mode === 'explore'
        ? { label: 'See related work', event: { type: 'SPOTLIGHT', id: data.id } }
        : rel
          ? { label: `See related: ${rel.title}`, event: { type: 'JUMP', id: rel.id } }
          : null
    return {
      key,
      rule: `Same project opened ${THRESHOLDS.revisits} times`,
      observed: data.observed,
      text: `You keep coming back to ${title(data.id)}.`,
      actions: [{ label: 'Keep it close', event: { type: 'KEEP', id: data.id } }, alt].filter(Boolean),
    }
  }
  if (key.startsWith('returning')) {
    const a = s.memory.lastAction
    const cont =
      a?.projectId && a.mode && a.mode !== mode
        ? { type: 'CHOOSE', mode: a.mode, projectId: a.projectId }
        : { type: 'JUMP', id: a?.projectId }
    return {
      key,
      rule: `Away ≥ ${THRESHOLDS.away / 1000}s with a remembered interaction`,
      observed: data.observed,
      text: 'Welcome back. Continue where you left off?',
      actions: [
        { label: a?.projectId ? `Continue with ${title(a.projectId)}` : 'Continue', event: cont },
        { label: 'Start fresh', event: { type: 'FRESH' } },
      ],
    }
  }
  if (key === 'breadth') {
    return {
      key,
      rule: `${THRESHOLDS.breadth} projects opened in one session`,
      observed: data.observed,
      text: `You’ve opened ${s.session.opens} projects. See them one at a time?`,
      actions: [{ label: 'One at a time', event: { type: 'CHOOSE', mode: 'focus', projectId: s.focusId } }],
    }
  }
  return null
}

function fire(s, key, data, { repeatable = false } = {}) {
  if (!repeatable && s.engine.fired.includes(key)) return log(s, 'rule', `${key}: matched again, not re-offered`)
  const sug = build(key, s, data)
  if (!sug) return s
  let n = s
  if (n.engine.active) n = log(n, 'outcome', `${n.engine.active.key}: replaced by ${key}`)
  n = eng(n, { active: { ...sug, at: Date.now() }, fired: uniq(n.engine.fired, key), outcome: { key, result: 'pending' } })
  n = log(n, 'rule', `${key} → ${sug.rule}`)
  return log(n, 'suggest', `“${sug.text}” [${sug.actions.map((a) => a.label).join(' / ')} / Not now]`)
}

function skip(s, source, observed) {
  const streak = s.engine.skipStreak + 1
  let n = log(eng(s, { skipStreak: streak }), 'observe', `SKIP (${source}): ${observed} · streak ${streak}/${THRESHOLDS.skips}`)
  if (streak >= THRESHOLDS.skips) n = fire(n, 'skipping', { observed: `${streak} skips in a row (${source})` })
  return n
}

function engage(s, observed) {
  let n = s
  if (s.engine.skipStreak > 0) n = log(n, 'observe', `Skip streak reset: ${observed}`)
  return eng(n, { skipStreak: 0 })
}

function remember(s, kind, projectId) {
  return { ...s, memory: { ...s.memory, lastAction: { kind, projectId, mode: s.status, at: Date.now() } } }
}

function revisitCheck(s, id) {
  const n = s.memory.opened[id] ?? 0
  if (n >= THRESHOLDS.revisits) {
    const s2 = log(s, 'observe', `REVISITING: ${title(id)} opened ${n} times across visits`)
    return fire(s2, `revisit:${id}`, { id, observed: `${title(id)} opened ${n}×` })
  }
  return s
}

// Shared events available from every mode.
const common = {
  CHOOSE: (s, e) => (e.mode === s.status && !e.projectId ? s : enterMode(s, e.mode, e.projectId)),
  RESET: () => {
    clearMemory()
    const memory = freshMemory()
    memory.visits = 1
    const s = { status: 'intro', returning: false, memory, session: freshSession(), engine: freshEngine(), focusId: null }
    return log(s, 'state', 'Memory cleared by visitor')
  },
  FRESH: (s) => log({ ...s, status: 'intro', returning: false, engine: { ...s.engine, active: null, skipStreak: 0 } }, 'state', 'Started fresh (chosen by visitor)'),
  DISMISS_NUDGE: (s, e) =>
    log(
      eng({ ...s, session: { ...s.session, dismissed: uniq(s.session.dismissed, e.key) } }, { active: null, outcome: { key: e.key, result: 'dismissed' } }),
      'outcome',
      `${e.key}: dismissed`,
    ),
  ACCEPT: (s, e) => log(eng(s, { active: null, outcome: { key: e.key, result: 'accepted', choice: e.choice } }), 'outcome', `${e.key}: accepted “${e.choice}”`),
  EXPIRE: (s, e) =>
    s.engine.active?.key === e.key
      ? log(eng(s, { active: null, outcome: { key: e.key, result: 'expired' } }), 'outcome', `${e.key}: expired unanswered`)
      : s,
  DISCOVER: (s, e) => ({ ...s, memory: { ...s.memory, discoveries: uniq(s.memory.discoveries, e.id) } }),

  // engine signals
  IDLE: (s, e) =>
    e.on === s.engine.idle
      ? s
      : log(
          eng(s, { idle: e.on }),
          e.on ? 'rule' : 'observe',
          e.on ? `INACTIVITY: no input for ${THRESHOLDS.idle / 1000}s → motion reduced, content unchanged` : 'Input resumed → motion restored',
        ),
  RETURN: (s, e) => {
    const secs = Math.round(e.away / 1000)
    const n = log(s, 'observe', `RETURNING: tab hidden for ${secs}s`)
    if (!s.memory.lastAction) return log(n, 'rule', 'returning: no meaningful interaction to continue, nothing offered')
    return fire(n, 'returning', { observed: `away ${secs}s · last ${describeAction(s.memory.lastAction)}` }, { repeatable: true })
  },
  DWELL: (s, e) => fire(log(s, 'observe', `DWELLING: ${Math.round(e.ms / 1000)}s active on ${title(e.id)}`), `dwell:${e.id}`, { id: e.id, observed: `${Math.round(e.ms / 1000)}s active on ${title(e.id)}` }),
  ENGAGE: (s, e) => engage(s, e.observed),
  SKIP_OPENED: (s, e) => skip(s, 'explore', e.observed),
  SHOW_DEEP: (s, e) => log(engage(remember(eng(s, { deep: e.id }), 'deep', e.id), 'opened deeper layer'), 'state', `Deeper layer shown for ${title(e.id)}`),
  KEEP: (s, e) => log(remember({ ...s, memory: { ...s.memory, kept: uniq(s.memory.kept, e.id) } }, 'kept', e.id), 'state', `${title(e.id)} kept in the switch`),
  UNKEEP: (s, e) => log({ ...s, memory: { ...s.memory, kept: s.memory.kept.filter((k) => k !== e.id) } }, 'state', `${title(e.id)} removed from kept`),
  JUMP: (s, e) => (e.id ? log(eng(s, { jump: { id: e.id, n: (s.engine.jump?.n ?? 0) + 1 } }), 'state', `Brought ${title(e.id)} forward`) : s),
  SHOW_UNSEEN: (s) => log(eng(s, { unseen: s.engine.unseen + 1 }), 'state', 'Highlighting projects not yet opened'),
  SPOTLIGHT: (s, e) => log(eng(s, { spotlight: { id: e.id, n: (s.engine.spotlight?.n ?? 0) + 1 } }), 'state', `Showing connections of ${title(e.id)}`),
}

const machine = {
  intro: {
    CHOOSE: (s, e) => enterMode(s, e.mode, e.projectId),
    RESUME: (s) => {
      const a = s.memory.lastAction
      const mode = a?.mode ?? s.memory.lastMode
      let n = enterMode(s, mode, a?.projectId ?? s.memory.lastProject)
      n = log(n, 'outcome', 'returning (reload): accepted “Continue”')
      // Explore continues by reopening the project; Focus starts on it.
      if (a?.projectId && mode === 'explore') n = eng(n, { jump: { id: a.projectId, n: 1 } })
      return n
    },
    RESET: common.RESET,
    IDLE: common.IDLE,
    ACCEPT: common.ACCEPT,
    DISMISS_NUDGE: common.DISMISS_NUDGE,
  },
  explore: {
    ...common,
    OPEN: (s, e) =>
      revisitOrBreadth(
        remember(
          {
            ...s,
            focusId: e.id,
            session: { ...s.session, opens: s.session.opens + 1, counts: bump(s.session.counts, e.id) },
            memory: { ...s.memory, opened: bump(s.memory.opened, e.id), lastProject: e.id },
          },
          'opened',
          e.id,
        ),
        e.id,
      ),
  },
  focus: {
    ...common,
    SHOW: (s, e) => ({ ...s, focusId: e.id, memory: { ...s.memory, lastProject: e.id } }),
    SKIP: (s, e) => skip({ ...s, session: { ...s.session, skips: s.session.skips + 1 } }, 'focus', `${title(e.id)} passed after ${(e.ms / 1000).toFixed(1)}s without reading`),
    READ: (s, e) =>
      revisitCheck(
        engage(
          remember(
            {
              ...s,
              session: { ...s.session, skips: 0 },
              memory: { ...s.memory, read: uniq(s.memory.read, e.id), opened: bump(s.memory.opened, e.id) },
            },
            'read',
            e.id,
          ),
          `read ${title(e.id)}`,
        ),
        e.id,
      ),
  },
  surprise: {
    ...common,
    SCENE: (s, e) => ({
      ...s,
      focusId: e.projectId ?? s.focusId,
      memory: { ...s.memory, scenes: s.memory.scenes + 1 },
    }),
    INTERRUPT: (s, e) => skip({ ...s, session: { ...s.session, interrupts: s.session.interrupts + 1 } }, 'surprise', `scene “${e.scene ?? '?'}” cut short`),
  },
}

function revisitOrBreadth(s, id) {
  const n = revisitCheck(s, id)
  if (n !== s && n.engine.active?.key?.startsWith('revisit')) return n
  if (s.session.opens >= THRESHOLDS.breadth) return fire(n, 'breadth', { observed: `${s.session.opens} projects opened this session` })
  return n
}

export function reducer(state, event) {
  const handler = machine[state.status]?.[event.type]
  return handler ? handler(state, event) : state
}

// The suggestion on screen, if any.
export function suggestion(state) {
  return state.engine.active
}

export { PROJECTS }
