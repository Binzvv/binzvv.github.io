// Original, generic device illustrations used as local placeholders.
// Each takes a `variant` so the same object can be rendered as a lit
// product shot (apple) or a flat, outlined illustration (monzo).

const PALETTE = {
  apple: {
    body: 'url(#ap-body)',
    face: '#0b0b0c',
    rim: 'rgba(255,255,255,0.14)',
    lensRing: '#26262a',
    lensGlass: 'url(#ap-lens)',
    button: '#141416',
    buttonRim: '#2a2a2e',
    led: '#7cc4ff',
    stroke: 'none',
    sw: 0,
  },
  monzo: {
    body: '#FFF5EC',
    face: '#FFF5EC',
    rim: 'transparent',
    lensRing: '#0E1B2E',
    lensGlass: '#0E1B2E',
    button: '#FF4F3B',
    buttonRim: '#0E1B2E',
    led: '#FFC83D',
    stroke: '#0E1B2E',
    sw: 5,
  },
};

function AppleDefs() {
  return (
    <defs>
      <linearGradient id="ap-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a1a1c" />
        <stop offset="0.18" stopColor="#4a4a4f" />
        <stop offset="0.5" stopColor="#2a2a2d" />
        <stop offset="0.86" stopColor="#3c3c40" />
        <stop offset="1" stopColor="#141416" />
      </linearGradient>
      <radialGradient id="ap-lens" cx="0.38" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#3b4a7a" />
        <stop offset="0.35" stopColor="#151a2e" />
        <stop offset="1" stopColor="#020203" />
      </radialGradient>
      <radialGradient id="ap-shade" cx="0.5" cy="0" r="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export function Doorbell({ variant = 'apple', className = '', title = 'Smart Doorbell' }) {
  const p = PALETTE[variant];
  return (
    <svg className={`art-doorbell ${className}`} viewBox="0 0 160 400" role="img" aria-label={title}>
      {variant === 'apple' && <AppleDefs />}
      <rect x="8" y="8" width="144" height="384" rx="72" fill={p.body} stroke={p.stroke} strokeWidth={p.sw} />
      <rect x="20" y="20" width="120" height="360" rx="60" fill={p.face} stroke={p.rim} strokeWidth="1.5" />
      {variant === 'apple' && <rect x="20" y="20" width="120" height="200" rx="60" fill="url(#ap-shade)" />}
      <g className="art-doorbell__lens">
        <circle cx="80" cy="96" r="36" fill={p.lensRing} stroke={p.stroke} strokeWidth={p.sw * 0.6} />
        <circle cx="80" cy="96" r="24" fill={p.lensGlass} />
        <circle cx="80" cy="96" r="10" fill={variant === 'apple' ? '#05060a' : '#FF4F3B'} />
        <ellipse cx="72" cy="87" rx="6" ry="4" fill="#fff" opacity={variant === 'apple' ? 0.55 : 0.9} />
      </g>
      <circle cx="80" cy="156" r="4" fill={variant === 'apple' ? '#1d1d20' : '#0E1B2E'} />
      <g fill={variant === 'apple' ? '#1f1f22' : '#0E1B2E'} opacity={variant === 'apple' ? 1 : 0.85}>
        {[-18, -6, 6, 18].map((dx) => (
          <circle key={dx} cx={80 + dx} cy="200" r="2.2" />
        ))}
      </g>
      <circle
        className="art-doorbell__led"
        cx="80"
        cy="300"
        r="46"
        fill="none"
        stroke={p.led}
        strokeWidth={variant === 'apple' ? 2.5 : 6}
        opacity={variant === 'apple' ? 0.35 : 1}
      />
      <circle
        className="art-doorbell__button"
        cx="80"
        cy="300"
        r="38"
        fill={p.button}
        stroke={p.buttonRim}
        strokeWidth={variant === 'apple' ? 1.5 : 5}
      />
      {variant === 'monzo' && (
        <path d="M66 306c0-10 6-17 14-17s14 7 14 17h-28zm10 4a4 4 0 0 0 8 0" fill="#FFF5EC" />
      )}
    </svg>
  );
}

export function IndoorCamera({ variant = 'apple', className = '', title = 'Indoor Camera' }) {
  const p = PALETTE[variant];
  const apple = variant === 'apple';
  return (
    <svg className={`art-camera ${className}`} viewBox="0 0 240 320" role="img" aria-label={title}>
      {apple && (
        <defs>
          <linearGradient id="cam-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d9de" />
          </linearGradient>
          <linearGradient id="cam-stand" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c9c9ce" />
            <stop offset="0.5" stopColor="#f2f2f5" />
            <stop offset="1" stopColor="#bdbdc2" />
          </linearGradient>
          <radialGradient id="cam-lens" cx="0.38" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#3b4a7a" />
            <stop offset="0.4" stopColor="#12162a" />
            <stop offset="1" stopColor="#020203" />
          </radialGradient>
        </defs>
      )}
      <ellipse cx="120" cy="300" rx="70" ry="12" fill={apple ? 'rgba(0,0,0,0.12)' : '#0E1B2E'} opacity={apple ? 1 : 0.15} />
      <rect x="54" y="268" width="132" height="26" rx="13" fill={apple ? 'url(#cam-stand)' : '#FFF5EC'} stroke={p.stroke} strokeWidth={p.sw} />
      <rect x="106" y="182" width="28" height="92" rx="12" fill={apple ? 'url(#cam-stand)' : '#FFF5EC'} stroke={p.stroke} strokeWidth={p.sw} />
      <rect x="24" y="20" width="192" height="172" rx="56" fill={apple ? 'url(#cam-body)' : '#FFF5EC'} stroke={apple ? 'rgba(0,0,0,0.08)' : p.stroke} strokeWidth={apple ? 1 : p.sw} />
      <rect x="48" y="40" width="144" height="132" rx="42" fill={apple ? '#0c0c0e' : '#0E1B2E'} />
      <g className="art-camera__lens">
        <circle cx="120" cy="104" r="40" fill={apple ? '#1a1a1d' : '#FFF5EC'} />
        <g className="art-camera__pupil">
          <circle cx="120" cy="104" r="26" fill={apple ? 'url(#cam-lens)' : '#0E1B2E'} />
          <circle cx="120" cy="104" r="11" fill={apple ? '#04050a' : '#FF4F3B'} />
          <ellipse cx="112" cy="96" rx="6" ry="4" fill="#fff" opacity={apple ? 0.5 : 0.95} />
        </g>
      </g>
      <circle className="art-camera__led" cx="174" cy="58" r="4" fill={apple ? '#34c759' : '#FFC83D'} />
    </svg>
  );
}

export function SensorBridge({ variant = 'apple', className = '' }) {
  const apple = variant === 'apple';
  return (
    <svg className={`art-bridge ${className}`} viewBox="0 0 160 110" role="img" aria-label="Sensor Bridge">
      <rect x="4" y="18" width="116" height="74" rx="20" fill={apple ? '#f2f2f5' : '#FFC83D'} stroke={apple ? 'rgba(0,0,0,0.1)' : '#0E1B2E'} strokeWidth={apple ? 1 : 5} />
      <rect x="120" y="44" width="30" height="22" rx="4" fill={apple ? '#b8b8bd' : '#0E1B2E'} />
      <rect x="146" y="49" width="10" height="12" rx="2" fill={apple ? '#8e8e93' : '#0E1B2E'} />
      <circle cx="34" cy="55" r="6" fill={apple ? '#34c759' : '#0E1B2E'} />
      <g fill="none" stroke={apple ? '#8e8e93' : '#0E1B2E'} strokeWidth={apple ? 2 : 4} strokeLinecap="round">
        <path d="M54 44a16 16 0 0 1 0 22" />
        <path d="M66 36a28 28 0 0 1 0 38" />
      </g>
    </svg>
  );
}

export function LeakSensor({ className = '' }) {
  return (
    <svg className={`art-leak ${className}`} viewBox="0 0 120 80" role="img" aria-label="Leak sensor">
      <ellipse cx="60" cy="58" rx="54" ry="16" fill="#0E1B2E" opacity="0.15" />
      <path d="M8 44c0-16 23-28 52-28s52 12 52 28v4c0 10-23 18-52 18S8 58 8 48z" fill="#FFF5EC" stroke="#0E1B2E" strokeWidth="5" />
      <circle cx="60" cy="36" r="7" fill="#2b8cff" stroke="#0E1B2E" strokeWidth="4" />
    </svg>
  );
}

export function MotionSensor({ className = '' }) {
  return (
    <svg className={`art-motion ${className}`} viewBox="0 0 120 120" role="img" aria-label="Motion sensor">
      <rect x="20" y="20" width="80" height="80" rx="26" fill="#FFF5EC" stroke="#0E1B2E" strokeWidth="5" />
      <circle cx="60" cy="60" r="20" fill="#0E1B2E" />
      <ellipse cx="54" cy="54" rx="6" ry="4" fill="#FFF5EC" opacity="0.8" />
    </svg>
  );
}
