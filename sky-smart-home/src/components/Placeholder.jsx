const TONES = {
  sand: ['#E9E2D6', '#DCD2C2'],
  clay: ['#D9C6B2', '#C8AF96'],
  stone: ['#E1DFD9', '#CFCCC4'],
  sage: ['#D8DCD2', '#C3C9BA'],
  dusk: ['#2A2724', '#3A3632'],
  mist: ['#EEF0F2', '#DEE2E6'],
  steel: ['#E3E6EA', '#CBD0D6'],
};

const SHAPES = {
  arch: <path d="M32 100 V58 a18 18 0 0 1 36 0 V100Z" />,
  sun: <circle cx="64" cy="42" r="20" />,
  horizon: <rect x="0" y="66" width="100" height="34" />,
  device: <rect x="40" y="22" width="20" height="50" rx="8" />,
  disc: <circle cx="50" cy="50" r="22" />,
  slab: <rect x="22" y="40" width="56" height="26" rx="4" />,
};

/** A quiet tonal block standing in for photography until real assets arrive. */
export default function Placeholder({ tone = 'sand', shape = 'arch', label = 'Image', className = '', style }) {
  const [bg, fg] = TONES[tone];
  const dark = tone === 'dusk';
  const slice = shape === 'horizon';
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: bg, ...style }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio={slice ? 'none' : 'xMidYMid meet'}
        className="absolute inset-0 h-full w-full"
        fill={fg}
        aria-hidden="true"
      >
        {SHAPES[shape]}
      </svg>
      {label && (
        <span
          className="absolute bottom-4 left-4 font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: dark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.38)' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
