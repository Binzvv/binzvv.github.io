/**
 * iOS-style layouts. A key is either a character string or a
 * function key object { id, label, w } where w is a width multiplier.
 */
const SHIFT = { id: 'shift', label: 'shift', w: 1.36, fn: true };
const DELETE = { id: 'delete', label: 'delete', w: 1.36, fn: true };
const SPACE = { id: 'space', label: 'space', w: 5.1 };
const RETURN = { id: 'return', label: 'return', w: 2.1, fn: true, accent: true };

export const LAYOUTS = {
  alpha: [
    [...'qwertyuiop'],
    [...'asdfghjkl'],
    [SHIFT, ...'zxcvbnm', DELETE],
    [{ id: 'layer', label: '123', w: 2.1, fn: true }, SPACE, RETURN],
  ],
  numeric: [
    [...'1234567890'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    [{ id: '#', label: '#', w: 1.36, fn: true, char: '#' }, '.', ',', '?', '!', "'", DELETE],
    [{ id: 'layer', label: 'ABC', w: 2.1, fn: true }, SPACE, RETURN],
  ],
};

const charsIn = (layer) =>
  new Set(LAYOUTS[layer].flat().flatMap((k) => (typeof k === 'string' ? [k] : k.char ? [k.char] : [])));
const CHARS = { alpha: charsIn('alpha'), numeric: charsIn('numeric') };

/** Map a physical KeyboardEvent to the on-screen key id it should light up. */
export function keyIdFromEvent(e, layer) {
  switch (e.key) {
    case 'Backspace':
    case 'Delete':
      return 'delete';
    case 'Enter':
      return 'return';
    case ' ':
      return 'space';
    case 'Shift':
    case 'CapsLock':
      return layer === 'alpha' ? 'shift' : null;
    default:
      break;
  }
  if (e.key.length !== 1) return null;
  const ch = e.key.toLowerCase();
  const normalised = ch === '’' ? "'" : ch;
  if (CHARS[layer].has(normalised)) return normalised;
  const other = layer === 'alpha' ? 'numeric' : 'alpha';
  if (CHARS[other].has(normalised)) return 'layer';
  return null;
}
