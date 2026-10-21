// Doorbell's-eye view of a front garden, drawn as a placeholder for live
// video. Rendered twice by callers when they need a day → night crossfade
// (night is the same scene with an infrared treatment in CSS).

export function DoorstepScene({ className = '', flat = false }) {
  const id = flat ? 'f' : 'c';
  return (
    <svg
      className={`art-scene ${className}`}
      viewBox="0 0 360 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={flat ? '#8CC8FF' : '#9fb8cf'} />
          <stop offset="1" stopColor={flat ? '#cfe7ff' : '#e6ecef'} />
        </linearGradient>
        <linearGradient id={`path-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9aea2" />
          <stop offset="1" stopColor="#8d8278" />
        </linearGradient>
        <radialGradient id={`vig-${id}`} cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={flat ? 0.12 : 0.55} />
        </radialGradient>
      </defs>

      <rect width="360" height="720" fill={`url(#sky-${id})`} />
      {/* houses across the road */}
      <g fill={flat ? '#FFF5EC' : '#d6d0c8'} opacity={flat ? 1 : 0.9}>
        <path d="M-10 250 L40 200 L90 250 V330 H-10Z" />
        <path d="M110 260 L170 205 L230 260 V330 H110Z" />
        <path d="M250 248 L300 205 L370 248 V330 H250Z" />
      </g>
      <g fill={flat ? '#0E1B2E' : '#8b8580'} opacity={flat ? 0.85 : 0.6}>
        <rect x="20" y="270" width="18" height="22" rx="2" />
        <rect x="150" y="275" width="18" height="22" rx="2" />
        <rect x="290" y="268" width="18" height="22" rx="2" />
        <rect x="186" y="290" width="16" height="40" rx="2" />
      </g>
      {/* hedge + gate */}
      <path d="M-10 330 Q 40 300 90 328 T 190 326 T 290 324 T 380 330 V420 H-10Z" fill={flat ? '#2ED3A3' : '#5f7a5a'} />
      <rect x="140" y="350" width="80" height="70" rx="4" fill="none" stroke={flat ? '#0E1B2E' : '#3f3a36'} strokeWidth="5" />
      <path d="M160 350v70M180 350v70M200 350v70" stroke={flat ? '#0E1B2E' : '#3f3a36'} strokeWidth="3" />
      {/* path, in fisheye perspective */}
      <path d="M150 420 H210 L330 720 H30Z" fill={`url(#path-${id})`} />
      <path d="M-10 420 H150 L30 720 H-10Z M210 420 H370 V720 H330Z" fill={flat ? '#7BE0BE' : '#6f8a68'} />
      {/* plant pot */}
      <g transform="translate(250 520)">
        <path d="M10 70 L80 70 L70 140 L20 140Z" fill={flat ? '#FF4F3B' : '#b4674a'} />
        <ellipse cx="30" cy="40" rx="18" ry="34" fill={flat ? '#0E1B2E' : '#3f5a3b'} transform="rotate(-20 30 40)" />
        <ellipse cx="60" cy="34" rx="18" ry="38" fill={flat ? '#2ED3A3' : '#4c6b47'} transform="rotate(16 60 34)" />
      </g>
      {/* visitor */}
      <g className="art-scene__visitor">
        <path d="M60 720 C 64 560, 110 500, 180 500 C 250 500, 296 560, 300 720Z" fill={flat ? '#0E1B2E' : '#2f3b4c'} />
        <rect x="160" y="456" width="40" height="56" rx="16" fill={flat ? '#e9b48f' : '#c69a7c'} />
        <circle cx="180" cy="420" r="56" fill={flat ? '#f2c4a0' : '#d5a888'} />
        <path d="M124 418 C 120 360, 160 350, 182 352 C 214 352, 242 372, 236 414 C 222 392, 196 384, 150 392Z" fill={flat ? '#0E1B2E' : '#2b2523'} />
        {flat && (
          <g fill="#0E1B2E">
            <circle cx="160" cy="428" r="5" />
            <circle cx="200" cy="428" r="5" />
            <path d="M166 450 Q180 462 194 450" stroke="#0E1B2E" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}
        {/* parcel */}
        <g transform="rotate(-4 180 610)">
          <rect x="100" y="560" width="160" height="110" rx="6" fill={flat ? '#FFC83D' : '#c9a172'} />
          <rect x="168" y="560" width="24" height="110" fill={flat ? '#FFF5EC' : '#e2c79d'} opacity="0.85" />
          <path d="M100 560 L130 540 H290 L260 560Z" fill={flat ? '#ffd970' : '#d8b588'} />
        </g>
        <ellipse cx="96" cy="620" rx="26" ry="20" fill={flat ? '#f2c4a0' : '#d5a888'} />
        <ellipse cx="264" cy="620" rx="26" ry="20" fill={flat ? '#f2c4a0' : '#d5a888'} />
      </g>
      <rect width="360" height="720" fill={`url(#vig-${id})`} />
    </svg>
  );
}

// Plan of a small home, used by the cinematic sensor story. Wall paths are
// drawn on scroll; sensor nodes sit in a separate group so they can be
// revealed one at a time.
export const FLOOR_NODES = {
  contact: { x: 64, y: 330, label: 'Front door' },
  motion: { x: 200, y: 250, label: 'Hallway' },
  camera: { x: 452, y: 124, label: 'Living room' },
  leak: { x: 470, y: 352, label: 'Kitchen' },
};

export function FloorPlan({ className = '' }) {
  return (
    <svg className={`art-plan ${className}`} viewBox="0 0 600 440" role="img" aria-label="Floor plan of a home with sensors in the hallway, living room, kitchen and at the front door">
      <g className="art-plan__walls" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 30 H570 V410 H30 Z" strokeWidth="6" />
        <path d="M300 30 V170 M300 230 V410" strokeWidth="3" />
        <path d="M30 200 H120 M180 200 H300" strokeWidth="3" />
        <path d="M300 250 H400 M460 250 H570" strokeWidth="3" />
        <path d="M130 200 V300 M130 360 V410" strokeWidth="3" />
        <path d="M30 300 V370" strokeWidth="9" className="art-plan__door" />
      </g>
      <g className="art-plan__fixtures" fill="none" strokeWidth="1.5">
        <rect x="340" y="70" width="140" height="56" rx="14" />
        <rect x="500" y="290" width="50" height="100" rx="6" />
        <circle cx="525" cy="340" r="14" />
        <rect x="60" y="60" width="120" height="90" rx="10" />
        <rect x="340" y="320" width="100" height="70" rx="6" />
      </g>
      <g className="art-plan__labels">
        <text x="70" y="186">Bedroom</text>
        <text x="320" y="214">Living room</text>
        <text x="150" y="292">Hallway</text>
        <text x="320" y="300">Kitchen</text>
      </g>
      <g className="art-plan__nodes">
        {Object.entries(FLOOR_NODES).map(([key, n]) => (
          <g key={key} className={`art-plan__node art-plan__node--${key}`} data-node={key} transform={`translate(${n.x} ${n.y})`}>
            <circle className="art-plan__ring" r="26" />
            <circle className="art-plan__ring art-plan__ring--2" r="26" />
            <circle className="art-plan__dot" r="9" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Phone({ children, className = '', label }) {
  return (
    <div className={`phone ${className}`} role={label ? 'img' : undefined} aria-label={label}>
      <div className="phone__screen">{children}</div>
      <span className="phone__island" aria-hidden="true" />
    </div>
  );
}
