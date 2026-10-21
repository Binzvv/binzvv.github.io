import { useId } from 'react';

// "Relic Pocket": a fictional handheld used as the example product in the
// Cinematic design system. Original artwork; not modelled on any real
// device's exact proportions or branding.

// Pixel scene on a 80×72 grid (10:9), drawn with crisp rects. Classes
// hook the loops (clouds, hero, coin) and the boot sequence (off → logo →
// scene), which callers animate.
export function PixelScene() {
  const sky = ['#1d1640', '#2c1e5a', '#46297a', '#6b3a8f', '#a2508f', '#e0708a', '#f6a073'];
  return (
    <g className="px" shapeRendering="crispEdges">
      <g className="px-scene">
        {sky.map((c, i) => (
          <rect key={c} x="0" y={i * 6} width="80" height={i === sky.length - 1 ? 30 : 6} fill={c} />
        ))}
        {/* sun */}
        <g fill="#ffd36b">
          <rect x="52" y="24" width="10" height="2" />
          <rect x="50" y="26" width="14" height="2" />
          <rect x="49" y="28" width="16" height="6" />
          <rect x="50" y="34" width="14" height="2" />
        </g>
        {/* stars */}
        <g className="px-stars" fill="#fff7d6">
          <rect x="8" y="4" width="1" height="1" />
          <rect x="21" y="9" width="1" height="1" />
          <rect x="34" y="3" width="1" height="1" />
          <rect x="70" y="7" width="1" height="1" />
          <rect x="62" y="13" width="1" height="1" />
        </g>
        {/* clouds */}
        <g className="px-cloud" fill="#f3c9d6" opacity="0.9">
          <rect x="6" y="16" width="12" height="2" />
          <rect x="9" y="14" width="6" height="2" />
          <rect x="40" y="20" width="10" height="2" />
          <rect x="42" y="18" width="5" height="2" />
          <rect x="86" y="15" width="12" height="2" />
          <rect x="89" y="13" width="6" height="2" />
        </g>
        {/* far mountains */}
        <path
          fill="#3b2763"
          d="M0 44h4v-4h4v-4h4v-4h4v4h4v4h4v-6h4v-4h4v4h4v6h4v4h4v-8h4v-4h4v4h4v4h4v4h4v4h4v-2h4V72H0z"
        />
        {/* near hills */}
        <path fill="#1f4d43" d="M0 52h6v-4h8v-2h10v2h8v4h10v-4h12v-2h10v2h8v4h8V72H0z" />
        {/* ground */}
        <rect x="0" y="58" width="80" height="14" fill="#2c7a4b" />
        <rect x="0" y="58" width="80" height="2" fill="#7bd389" />
        <g fill="#225f3b">
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={i * 8 + 2} y="63" width="3" height="2" />
          ))}
        </g>
        {/* coin */}
        <g className="px-coin" fill="#ffd36b">
          <rect x="47" y="45" width="4" height="6" />
          <rect x="48" y="44" width="2" height="8" />
          <rect x="48" y="46" width="1" height="3" fill="#fff4b8" />
        </g>
        {/* hero */}
        <g className="px-hero">
          <rect x="22" y="47" width="6" height="3" fill="#ff5d5d" />
          <rect x="23" y="50" width="5" height="3" fill="#ffd2a6" />
          <rect x="26" y="51" width="1" height="1" fill="#1d1640" />
          <rect x="22" y="53" width="6" height="3" fill="#3a6df0" />
          <rect x="22" y="56" width="2" height="2" fill="#1d1640" />
          <rect x="26" y="56" width="2" height="2" fill="#1d1640" />
        </g>
      </g>
      <g className="px-logo">
        <rect width="80" height="72" fill="#0b0b0d" />
        <text x="40" y="36" textAnchor="middle" className="px-logo__word">
          RELIC
        </text>
        <rect className="px-logo__bar" x="26" y="42" width="28" height="2" fill="#2997ff" />
      </g>
      <rect className="px-off" width="80" height="72" fill="#050506" />
    </g>
  );
}

export function Handheld({ className = '', title = 'Relic Pocket handheld' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const body = `hh-body-${id}`;
  const sheen = `hh-sheen-${id}`;
  const glass = `hh-glass-${id}`;
  const scan = `hh-scan-${id}`;
  return (
    <svg className={`art-handheld ${className}`} viewBox="0 0 320 520" role="img" aria-label={title}>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#18181a" />
          <stop offset="0.14" stopColor="#3c3c40" />
          <stop offset="0.5" stopColor="#26262a" />
          <stop offset="0.88" stopColor="#36363a" />
          <stop offset="1" stopColor="#141416" />
        </linearGradient>
        <radialGradient id={sheen} cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id={scan} width="1" height="2" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#000" opacity="0.14" />
        </pattern>
      </defs>

      {/* body */}
      <rect x="10" y="10" width="300" height="500" rx="36" fill={`url(#${body})`} />
      <rect x="10" y="10" width="300" height="500" rx="36" fill={`url(#${sheen})`} />
      <rect x="11" y="11" width="298" height="498" rx="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      {/* cartridge slot hint */}
      <rect x="110" y="10" width="100" height="4" rx="2" fill="#0d0d0f" />

      {/* bezel + screen */}
      <rect x="38" y="44" width="244" height="248" rx="16" fill="#050506" />
      <svg x="58" y="62" width="204" height="184" viewBox="0 0 80 72" preserveAspectRatio="none" className="art-handheld__screen">
        <PixelScene />
        <rect width="80" height="72" fill={`url(#${scan})`} pointerEvents="none" />
      </svg>
      <rect x="38" y="44" width="244" height="248" rx="16" fill={`url(#${glass})`} pointerEvents="none" />
      <circle className="art-handheld__led" cx="58" cy="270" r="3.5" fill="#2a2a2e" />
      <text x="262" y="274" textAnchor="end" className="art-handheld__mark">
        RELIC
      </text>

      {/* d-pad */}
      <g transform="translate(96 384)">
        <circle r="44" fill="#1b1b1e" />
        <rect x="-13" y="-38" width="26" height="76" rx="5" fill="#0e0e10" />
        <rect x="-38" y="-13" width="76" height="26" rx="5" fill="#0e0e10" />
        <rect x="-12" y="-37" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <circle r="5" fill="#141416" />
      </g>
      {/* A / B */}
      <g fill="#0e0e10" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5">
        <circle cx="244" cy="364" r="21" />
        <circle cx="200" cy="396" r="21" />
      </g>
      <g className="art-handheld__labels">
        <text x="244" y="398">A</text>
        <text x="200" y="430">B</text>
      </g>
      {/* start / select */}
      <rect x="122" y="462" width="30" height="9" rx="4.5" fill="#0e0e10" />
      <rect x="168" y="462" width="30" height="9" rx="4.5" fill="#0e0e10" />
      {/* speaker */}
      <g fill="#0b0b0d">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => <circle key={`${r}-${c}`} cx={236 + c * 9 + (r % 2) * 4.5} cy={452 + r * 9} r="2.2" />),
        )}
      </g>
    </svg>
  );
}
