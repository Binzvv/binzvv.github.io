const pad = (n) => String(n).padStart(2, '0');

export default function Progress({ index, total, dark, onSelect, hidden }) {
  const tone = dark ? 'text-white' : 'text-ink';
  return (
    <nav
      aria-label="Slide progress"
      className={`absolute bottom-[64px] left-[120px] z-20 flex items-center gap-8 transition-opacity duration-500 ${tone} ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span className="w-[64px] text-[17px] font-medium tabular-nums tracking-[0.02em] transition-colors duration-700">
        {pad(index + 1)}
        <span className="opacity-35"> / {pad(total)}</span>
      </span>
      <ol className="flex items-center gap-[10px]">
        {Array.from({ length: total }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className="group flex h-6 items-center"
            >
              <span
                className="block h-[2px] rounded-full bg-current transition-all duration-700 ease-[cubic-bezier(.7,0,.2,1)]"
                style={{ width: i === index ? 64 : 24, opacity: i === index ? 1 : 0.25 }}
              />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
