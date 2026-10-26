import { useEffect, useState } from 'react';

// Labels the page as a concept and toggles outlines on every asset slot
// (where licensed Sky photography, key art and logos would go).
export default function ConceptBar({ className = '' }) {
  const [slots, setSlots] = useState(() => document.documentElement.classList.contains('show-slots'));
  useEffect(() => {
    document.documentElement.classList.toggle('show-slots', slots);
  }, [slots]);
  return (
    <div className={`${className} z-40 w-max items-center gap-3 rounded-full bg-night/85 py-1.5 pl-4 pr-1.5 text-[13px] text-white shadow-lg backdrop-blur-md on-dark`}>
      <span>Concept</span>
      <button
        type="button"
        role="switch"
        aria-checked={slots}
        onClick={() => setSlots((s) => !s)}
        className="inline-flex h-8 items-center gap-2 rounded-full bg-white/10 px-3 transition-colors hover:bg-white/20"
      >
        <span className={`relative h-4 w-7 rounded-full transition-colors duration-300 ${slots ? 'bg-[#ffb000]' : 'bg-white/30'}`}>
          <span className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-300 ease-sky ${slots ? 'translate-x-3' : ''}`} />
        </span>
        Asset slots
      </button>
    </div>
  );
}
