// Lightweight, permission-based memory. Nothing leaves the device.
const MEM_KEY = 'elsewhere.memory.v1'
const CONSENT_KEY = 'elsewhere.consent.v1'

export const EMPTY_MEMORY = {
  lastMode: null,
  lastStory: null,
  saved: [],
  seen: [],
  wentRunning: false,
  wentRunningAt: null,
  visits: 0,
  lastVisit: null,
}

function safe(fn, fallback) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function loadConsent() {
  return safe(() => {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'yes' ? true : v === 'no' ? false : null
  }, null)
}

export function saveConsent(value) {
  safe(() => localStorage.setItem(CONSENT_KEY, value ? 'yes' : 'no'))
}

export function loadMemory() {
  return safe(() => {
    const raw = localStorage.getItem(MEM_KEY)
    return raw ? { ...EMPTY_MEMORY, ...JSON.parse(raw) } : null
  }, null)
}

export function saveMemory(mem) {
  safe(() => localStorage.setItem(MEM_KEY, JSON.stringify(mem)))
}

export function clearAll() {
  safe(() => {
    localStorage.removeItem(MEM_KEY)
    localStorage.removeItem(CONSENT_KEY)
  })
}
