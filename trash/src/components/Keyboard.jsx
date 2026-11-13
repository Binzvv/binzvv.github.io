import { forwardRef } from 'react';
import { LAYOUTS } from './keyboardLayout';

/**
 * A floating, iOS-dark-inspired keyboard. Purely presentational:
 * it lights up for physical presses and reports virtual presses.
 * Pointer-down is prevented so the real text field never loses focus.
 */
const Keyboard = forwardRef(function Keyboard({ layer, upper, shiftLocked, pressed, onKey }, ref) {
  const rows = LAYOUTS[layer];

  return (
    <div ref={ref} className="kb" role="group" aria-label="On-screen keyboard">
      {rows.map((row, r) => (
        <div key={r} className={`kb__row kb__row--${r}`}>
          {row.map((key) => {
            const isChar = typeof key === 'string';
            const id = isChar ? key : key.id;
            const label = isChar ? (upper ? key.toUpperCase() : key) : key.label;
            const classes = [
              'kb__key',
              isChar ? 'kb__key--char' : '',
              key.fn ? 'kb__key--fn' : '',
              key.accent ? 'kb__key--accent' : '',
              `kb__key--${id === '#' ? 'hash' : id.length === 1 ? 'c' : id}`,
              pressed.has(id) ? 'is-pressed' : '',
              id === 'shift' && (upper || shiftLocked) ? 'is-on' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={id}
                type="button"
                tabIndex={-1}
                className={classes}
                style={{ '--w': isChar ? 1 : key.w }}
                aria-label={id === 'space' ? 'space' : label}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onKey(isChar ? { type: 'char', value: label } : { type: id, value: key.char });
                }}
              >
                {id === 'shift' ? <ShiftGlyph filled={upper} /> : id === 'delete' ? <DeleteGlyph /> : <span>{id === 'space' ? 'space' : label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

/* The two functional glyphs a keyboard genuinely needs — not decoration. */
const ShiftGlyph = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M12 4.2 3.6 12.6h4.6V19.6h7.6v-7h4.6L12 4.2Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const DeleteGlyph = () => (
  <svg viewBox="0 0 28 24" width="26" height="22" aria-hidden="true">
    <path
      d="M9.4 5h14.1A1.9 1.9 0 0 1 25.4 6.9v10.2a1.9 1.9 0 0 1-1.9 1.9H9.4L2.8 12 9.4 5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="m13.2 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default Keyboard;
