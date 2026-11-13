import { forwardRef } from 'react';

/** Floating predictive strip: three slots, hairline dividers. */
const SuggestionStrip = forwardRef(function SuggestionStrip({ items, onPick }, ref) {
  const slots = [0, 1, 2].map((i) => items[i] ?? null);
  const signature = items.map((i) => i.label).join('|');

  return (
    <div ref={ref} className="strip" role="listbox" aria-label="Suggestions">
      {/* key on the content so a fresh set gently fades in */}
      <div key={signature} className="strip__inner">
        {slots.map((item, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            role="option"
            aria-selected="false"
            className={`strip__item ${item?.kind === 'thought' ? 'strip__item--thought' : ''}`}
            disabled={!item}
            onPointerDown={(e) => {
              e.preventDefault();
              if (item) onPick(item);
            }}
          >
            <span>{item?.label ?? ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default SuggestionStrip;
