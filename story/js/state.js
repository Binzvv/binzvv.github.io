// Shared memory of the visit. Every scene writes to it; scene 05 reads all of it.

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = window.matchMedia('(pointer: coarse)').matches;

export const state = {
  world: null, // 'noise' | 'silence' | null
  presence: { distance: 0, energy: 0, peak: 0, samples: [] },
  disrupt: { moves: 0, cell: null, vertical: false, path: [] },
  respond: { message: '', mood: null, reply: '', pokes: 0, history: [] },
};

const listeners = new Set();
export function onWorld(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setWorld(world) {
  state.world = world;
  document.documentElement.dataset.world = world || 'none';
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', world === 'silence' ? '#eeebe3' : '#0a0a0a');
  listeners.forEach((fn) => fn(world));
}

// How the identity *behaves* in each world — not just how it looks.
export function motion() {
  if (reduced) return { ease: 'power1.out', dur: 0.25, inout: 'power1.inOut', jitter: 0, pop: 'power1.out' };
  if (state.world === 'noise') return { ease: 'expo.out', dur: 0.42, inout: 'expo.inOut', jitter: 1, pop: 'back.out(3)' };
  if (state.world === 'silence') return { ease: 'elastic.out(1, 0.75)', dur: 1.5, inout: 'sine.inOut', jitter: 0, pop: 'power2.out' };
  return { ease: 'power4.out', dur: 0.8, inout: 'power3.inOut', jitter: 0.3, pop: 'back.out(1.7)' };
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function resetState() {
  state.presence = { distance: 0, energy: 0, peak: 0, samples: [] };
  state.disrupt = { moves: 0, cell: null, vertical: false, path: [] };
  state.respond = { message: '', mood: null, reply: '', pokes: 0, history: [] };
  setWorld(null);
}
