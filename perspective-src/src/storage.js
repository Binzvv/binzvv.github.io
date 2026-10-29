// Visitor memory. Everything lives in localStorage — no backend, no accounts.
const KEY = 'perspective:v1';
const MOTION_KEY = 'perspective:motion';
const DAY = 24 * 60 * 60 * 1000;

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode or storage blocked: the site still works, it just forgets */
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readRecord() {
  const raw = safeGet(KEY);
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw);
    return rec && typeof rec === 'object' ? rec : null;
  } catch {
    return null;
  }
}

export function writeRecord(rec) {
  safeSet(KEY, JSON.stringify(rec));
  return rec;
}

export function clearRecord() {
  safeRemove(KEY);
}

/**
 * Called once per page load (and again by test mode).
 * Returns what the brand knows about this visitor *before* this visit,
 * then records the new visit.
 */
export function bootSession(now = Date.now()) {
  const prev = readRecord();
  if (!prev || !prev.lens) {
    const fresh = {
      lens: null,
      visits: (prev?.visits || 0) + 1,
      firstVisit: prev?.firstVisit || now,
      lastVisit: now,
      history: [],
      seen: {},
    };
    writeRecord(fresh);
    return { returning: false, previous: null, record: fresh };
  }
  const next = {
    ...prev,
    visits: (prev.visits || 1) + 1,
    lastVisit: now,
    seen: prev.seen || {},
    history: prev.history || [],
  };
  writeRecord(next);
  return { returning: true, previous: prev, record: next };
}

export function saveLens(lens) {
  const rec = readRecord() || { visits: 1, firstVisit: Date.now(), seen: {}, history: [] };
  const history = [...(rec.history || []), { lens, at: Date.now() }].slice(-12);
  return writeRecord({ ...rec, lens, history, lastVisit: Date.now() });
}

export function markSeen(lens, discoveryId) {
  const rec = readRecord();
  if (!rec) return;
  const seen = { ...(rec.seen || {}) };
  const list = new Set(seen[lens] || []);
  list.add(discoveryId);
  seen[lens] = [...list];
  writeRecord({ ...rec, seen });
}

/** Test mode: pretend this visitor last came `daysAgo` days ago with a given lens. */
export function simulateReturn(lens, daysAgo = 4) {
  const rec = readRecord() || {};
  const then = Date.now() - daysAgo * DAY;
  writeRecord({
    seen: {},
    history: [],
    ...rec,
    lens,
    visits: Math.max(rec.visits || 1, 1),
    firstVisit: rec.firstVisit && rec.firstVisit < then ? rec.firstVisit : then - 9 * DAY,
    lastVisit: then,
  });
}

export function readMotionPref() {
  return safeGet(MOTION_KEY);
}

export function writeMotionPref(value) {
  if (value) safeSet(MOTION_KEY, value);
  else safeRemove(MOTION_KEY);
}

export function timeAgo(ts, now = Date.now()) {
  if (!ts) return 'a while ago';
  const diff = Math.max(0, now - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 2) return 'moments ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks ago`;
}
