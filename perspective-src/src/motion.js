import { useEffect, useState } from 'react';
import { readMotionPref, writeMotionPref } from './storage.js';

const query = '(prefers-reduced-motion: reduce)';

function systemReduced() {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
}

/**
 * Motion respects the OS setting by default; the in-page toggle overrides it and is remembered.
 */
export function useMotionPreference() {
  const [system, setSystem] = useState(systemReduced);
  const [override, setOverride] = useState(() => readMotionPref());

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setSystem(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const reduced = override ? override === 'reduce' : system;

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'full';
  }, [reduced]);

  const toggle = () => {
    const next = reduced ? 'full' : 'reduce';
    // Going back to whatever the system says clears the override.
    const value = (next === 'reduce') === system ? null : next;
    writeMotionPref(value);
    setOverride(value);
  };

  return { reduced, toggle };
}
