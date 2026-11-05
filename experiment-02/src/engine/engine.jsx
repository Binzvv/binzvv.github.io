import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EMPTY_MEMORY, clearAll, loadConsent, loadMemory, saveConsent, saveMemory } from './memory'

/*
  Behavioural engine
  ──────────────────
  Observes only what the visitor does (never what they "feel"):
    skip · open · revisit · active time · inactivity · return · go-run
  Responds with at most one quiet suggestion at a time, with a cooldown,
  never repeating the same suggestion in a session. Every suggestion can be
  accepted, dismissed, or simply ignored (it withdraws on its own).
*/

export const RULES = {
  SKIPS: { id: 'three-skips', when: '3 consecutive skips' },
  DEEPER: { id: 'engaged', when: '≥ 20s active reading, or reached the end' },
  REVISIT: { id: 'revisit', when: 'opened a story seen before' },
  RETURN: { id: 'returning', when: 'stored memory found on arrival' },
  IDLE: { id: 'inactivity', when: '25s without input → reduce motion' },
  QUIET: { id: 'progressive-quiet', when: 'time spent in ESCAPE → fewer elements' },
  SURPRISE: { id: 'curated-surprise', when: '3 WANDER stories opened' },
}

const IDLE_AFTER = 25_000
const ACTIVE_WINDOW = 15_000
const COOLDOWN = 30_000
const AUTO_WITHDRAW = 16_000

const Ctx = createContext(null)
export const useEngine = () => useContext(Ctx)

const now = () => Date.now()

export function EngineProvider({ children }) {
  // ── memory & consent
  const [consent, setConsentState] = useState(() => loadConsent())
  const stored = useRef(consent ? loadMemory() : null)
  const [memory, setMemory] = useState(() => stored.current ?? { ...EMPTY_MEMORY })
  const [returning] = useState(() => {
    const m = stored.current
    return m && (m.lastMode || m.saved.length || m.wentRunning) ? { ...m } : null
  })

  // ── observation state
  const [events, setEvents] = useState([])
  const [rules, setRules] = useState([])
  const [suggestion, setSuggestion] = useState(null)
  const [suggestionLog, setSuggestionLog] = useState([])
  const [idle, setIdle] = useState(false)
  const idleRef = useRef(false)
  const skips = useRef(0)
  const [skipCount, setSkipCount] = useState(0)
  const fired = useRef(new Set())
  const lastSuggestionAt = useRef(0)
  const handlers = useRef({})
  const lastInput = useRef(now())
  const activeByMode = useRef({ escape: 0, push: 0, wander: 0 })
  const modeRef = useRef(null)
  const sessionSeen = useRef(new Set())

  const log = useCallback((type, detail = '') => {
    setEvents((e) => [{ at: now(), type, detail }, ...e].slice(0, 40))
  }, [])

  const rule = useCallback((r, note = '') => {
    setRules((list) => [{ at: now(), rule: r.id, when: r.when, note }, ...list].slice(0, 30))
  }, [])

  // count a visit once per load (only when memory is permitted)
  useEffect(() => {
    if (!consent) return
    setMemory((m) => ({ ...m, visits: (m.visits || 0) + 1, lastVisit: now() }))
    if (returning) rule(RULES.RETURN, `visit ${returning.visits + 1}`)
    log('arrive', returning ? 'returning visitor' : 'first visit')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (consent) saveMemory(memory)
  }, [memory, consent])

  const setConsent = useCallback(
    (value) => {
      saveConsent(value)
      setConsentState(value)
      log('memory_consent', value ? 'allowed' : 'declined')
      if (value) setMemory((m) => ({ ...m, visits: Math.max(1, m.visits), lastVisit: now() }))
    },
    [log],
  )

  const remember = useCallback((patch) => setMemory((m) => ({ ...m, ...(typeof patch === 'function' ? patch(m) : patch) })), [])

  const forget = useCallback(() => {
    clearAll()
    setConsentState(null)
    setMemory({ ...EMPTY_MEMORY })
    log('memory_cleared', 'visitor started fresh')
  }, [log])

  // ── suggestions
  const current = useRef(null)
  const offer = useCallback(
    (r, { key, text, basis, actions, bypassCooldown = false }) => {
      const k = key || r.id
      if (fired.current.has(k)) return false
      if (current.current) return false // one voice at a time
      if (!bypassCooldown && now() - lastSuggestionAt.current < COOLDOWN) {
        rule(r, 'held back — cooldown')
        fired.current.add(k)
        return false
      }
      const s = { id: `${k}-${now()}`, key: k, rule: r.id, text, basis, actions: actions.map(({ label, value }) => ({ label, value })), at: now() }
      fired.current.add(k)
      handlers.current[k] = Object.fromEntries(actions.map((a) => [a.value, a.run]))
      lastSuggestionAt.current = now()
      current.current = s
      setSuggestion(s)
      rule(r, text)
      setSuggestionLog((l) => [{ at: now(), rule: r.id, text, outcome: 'shown' }, ...l].slice(0, 30))
      return true
    },
    [rule],
  )

  const resolve = useCallback(
    (value, outcome) => {
      const cur = current.current
      if (!cur) return
      current.current = null
      setSuggestion(null)
      const run = value ? handlers.current[cur.key]?.[value] : null
      setSuggestionLog((l) => [{ at: now(), rule: cur.rule, text: cur.text, outcome: outcome + (value ? ` · ${value}` : '') }, ...l].slice(0, 30))
      log(`suggestion_${outcome}`, `${cur.rule}${value ? ' → ' + value : ''}`)
      if (run) run()
    },
    [log],
  )

  const accept = useCallback((value) => resolve(value, 'accepted'), [resolve])
  const dismiss = useCallback(() => resolve(null, 'dismissed'), [resolve])

  // suggestions withdraw quietly — the system never insists
  useEffect(() => {
    if (!suggestion) return
    const t = setTimeout(() => resolve(null, 'ignored'), suggestion.rule === RULES.RETURN.id ? 60_000 : AUTO_WITHDRAW)
    return () => clearTimeout(t)
  }, [suggestion, resolve])

  // ── skipping
  const skip = useCallback(
    (detail) => {
      skips.current += 1
      setSkipCount(skips.current)
      log('skip', detail)
      return skips.current
    },
    [log],
  )
  const resetSkips = useCallback(() => {
    skips.current = 0
    setSkipCount(0)
  }, [])

  // ── stories
  const openStory = useCallback(
    (story) => {
      resetSkips()
      const seenBefore = sessionSeen.current.has(story.id) || memory.seen.includes(story.id)
      sessionSeen.current.add(story.id)
      log(seenBefore ? 'revisit' : 'open', story.title)
      remember((m) => ({ lastStory: story.id, seen: m.seen.includes(story.id) ? m.seen : [...m.seen, story.id] }))
      return seenBefore
    },
    [log, remember, resetSkips, memory.seen],
  )

  const toggleSave = useCallback(
    (story) => {
      const has = memory.saved.includes(story.id)
      log(has ? 'unsave' : 'save', story.title)
      remember((m) => ({ saved: has ? m.saved.filter((s) => s !== story.id) : [...new Set([...m.saved, story.id])] }))
    },
    [log, remember, memory.saved],
  )

  // ── mode
  const setModeObserved = useCallback(
    (mode) => {
      modeRef.current = mode
      if (mode) remember({ lastMode: mode })
    },
    [remember],
  )

  // ── active time & inactivity (observable behaviour only)
  useEffect(() => {
    const onInput = () => {
      lastInput.current = now()
      if (idleRef.current) {
        idleRef.current = false
        setIdle(false)
        log('idle_end', 'input resumed — motion restored')
      }
    }
    const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']
    evs.forEach((e) => window.addEventListener(e, onInput, { passive: true, capture: true }))
    const tick = setInterval(() => {
      const since = now() - lastInput.current
      if (document.visibilityState === 'visible' && since < ACTIVE_WINDOW && modeRef.current) {
        activeByMode.current[modeRef.current] += 1
      }
      if (since > IDLE_AFTER) {
        if (!idleRef.current) {
          idleRef.current = true
          setIdle(true)
          log('idle_start', `${Math.round(since / 1000)}s without input`)
          rule(RULES.IDLE, 'ambient motion reduced')
        }
      }
    }, 1000)
    return () => {
      evs.forEach((e) => window.removeEventListener(e, onInput, { capture: true }))
      clearInterval(tick)
    }
  }, [log, rule])

  const isActive = useCallback(() => document.visibilityState === 'visible' && now() - lastInput.current < ACTIVE_WINDOW, [])

  const value = useMemo(
    () => ({
      consent,
      setConsent,
      memory,
      remember,
      forget,
      returning,
      events,
      rules,
      rule,
      log,
      suggestion,
      suggestionLog,
      offer,
      accept,
      dismiss,
      skip,
      resetSkips,
      skipCount,
      openStory,
      toggleSave,
      setModeObserved,
      idle,
      isActive,
      activeByMode,
    }),
    [consent, setConsent, memory, remember, forget, returning, events, rules, rule, log, suggestion, suggestionLog, offer, accept, dismiss, skip, resetSkips, skipCount, openStory, toggleSave, setModeObserved, idle, isActive],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
