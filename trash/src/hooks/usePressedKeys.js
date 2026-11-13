import { useEffect, useState } from 'react';
import { keyIdFromEvent } from '../components/keyboardLayout';

/**
 * Tracks which on-screen keys should look pressed while the physical
 * keyboard is used. Also reports whether Shift / Caps Lock is held.
 */
export function usePressedKeys(enabled, layer) {
  const [pressed, setPressed] = useState(() => new Set());
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPressed(new Set());
      return undefined;
    }
    const down = (e) => {
      setShiftHeld(e.shiftKey || e.getModifierState?.('CapsLock'));
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const id = keyIdFromEvent(e, layer);
      if (!id) return;
      setPressed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    };
    const up = (e) => {
      setShiftHeld(e.shiftKey || e.getModifierState?.('CapsLock'));
      const id = keyIdFromEvent(e, layer);
      setPressed((prev) => {
        if (!id || !prev.has(id)) return e.key === 'Meta' ? new Set() : prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
    const reset = () => {
      setPressed(new Set());
      setShiftHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset);
    };
  }, [enabled, layer]);

  return { pressed, shiftHeld };
}
