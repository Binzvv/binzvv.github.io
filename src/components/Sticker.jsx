import { motion } from 'framer-motion'

// Each project is a die-cut sticker: a small flat-shape illustration of the
// idea itself. Drawn in SVG (no image files), so the whole site stays light.
const C = '#2B4BFF'
const T = '#FF5A36'
const L = '#C6F24A'
const P = '#FFA3D7'
const S = '#FFD23F'
const K = '#151515'
const W = '#FFFFFF'

function Eye({ x, y, r = 9, look = 0, closed = false }) {
  if (closed)
    return <path d={`M${x - r} ${y} q${r} ${r * 0.9} ${r * 2} 0`} fill="none" stroke={K} strokeWidth="3.5" strokeLinecap="round" />
  return (
    <g className="blink">
      <circle cx={x} cy={y} r={r} fill={W} stroke={K} strokeWidth="3" />
      <circle cx={x + look * r * 0.4} cy={y + r * 0.15} r={r * 0.48} fill={K} />
    </g>
  )
}

const ART = {
  tidal: () => (
    <>
      <path d="M150 22 a30 30 0 1 0 26 48 a24 24 0 1 1 -26 -48z" fill={S} />
      <rect x="40" y="132" width="118" height="26" rx="4" fill={C} transform="rotate(-4 99 145)" />
      <rect x="52" y="104" width="100" height="26" rx="4" fill={T} transform="rotate(6 102 117)" />
      <rect x="36" y="78" width="96" height="26" rx="4" fill={P} transform="rotate(-9 84 91)" />
      <rect x="58" y="160" width="104" height="22" rx="4" fill={L} transform="rotate(3 110 171)" />
      <path d="M30 186 q20 -12 40 0 t40 0 t40 0 t40 0" fill="none" stroke={C} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  slowmail: () => (
    <>
      <path d="M22 160 q0 -26 40 -26 h70 q30 0 40 24 q4 12 -10 12 h-128 q-12 0 -12 -10z" fill={L} />
      <circle cx="112" cy="98" r="52" fill={P} />
      <path d="M112 98 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a26 26 0 1 1 -26 -26 a36 36 0 1 1 36 36" fill="none" stroke={K} strokeWidth="4" strokeLinecap="round" />
      <path d="M30 150 l-6 -40 M44 146 l2 -40" stroke={K} strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="108" r="6" fill={K} />
      <circle cx="46" cy="104" r="6" fill={K} />
      <g transform="rotate(-12 120 40)">
        <rect x="92" y="18" width="62" height="42" rx="4" fill={W} stroke={K} strokeWidth="3" />
        <path d="M92 20 l31 24 l31 -24" fill="none" stroke={K} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </>
  ),
  orchard: () => (
    <>
      <rect x="90" y="112" width="20" height="68" rx="6" fill={K} />
      <circle cx="68" cy="88" r="42" fill={L} />
      <circle cx="132" cy="84" r="44" fill={L} />
      <circle cx="100" cy="54" r="40" fill={L} />
      <circle cx="62" cy="104" r="12" fill={C} />
      <circle cx="146" cy="110" r="12" fill={C} />
      <circle cx="128" cy="44" r="11" fill={C} />
      <circle cx="58" cy="100" r="3.5" fill={W} />
      <Eye x={86} y={78} closed />
      <Eye x={118} y={78} closed />
    </>
  ),
  weather: () => (
    <>
      <circle cx="140" cy="62" r="40" fill={S} />
      <circle cx="70" cy="104" r="34" fill={W} stroke={K} strokeWidth="3" />
      <circle cx="112" cy="94" r="40" fill={W} stroke={K} strokeWidth="3" />
      <rect x="40" y="104" width="120" height="36" rx="18" fill={W} />
      <path d="M40 122 v0 a18 18 0 0 0 18 18 h84 a18 18 0 0 0 18 -18" fill="none" stroke={K} strokeWidth="3" />
      <Eye x={88} y={110} r={8} look={0.6} />
      <Eye x={118} y={110} r={8} look={0.6} />
      <path d="M62 158 l-6 16 M96 160 l-6 16 M130 158 l-6 16" stroke={C} strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  fieldnotes: () => (
    <>
      <g transform="rotate(5 100 104)">
        <rect x="44" y="28" width="112" height="150" rx="6" fill={T} />
        <rect x="56" y="40" width="88" height="16" rx="3" fill={K} />
        <circle cx="100" cy="112" r="34" fill={W} stroke={K} strokeWidth="4" />
        <circle cx="100" cy="116" r="16" fill={K} />
        <circle cx="106" cy="110" r="5" fill={W} />
        <path d="M60 164 h80" stroke={K} strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M150 30 l20 -16" stroke={K} strokeWidth="4" strokeLinecap="round" />
      <circle cx="172" cy="12" r="7" fill={L} />
    </>
  ),
  smallhours: () => (
    <>
      <rect x="28" y="70" width="144" height="100" rx="18" fill={P} />
      <circle cx="74" cy="120" r="28" fill={K} />
      <circle cx="74" cy="120" r="10" fill={P} />
      <rect x="116" y="96" width="40" height="8" rx="4" fill={K} />
      <rect x="116" y="114" width="40" height="8" rx="4" fill={K} />
      <rect x="116" y="132" width="26" height="8" rx="4" fill={K} />
      <path d="M60 70 l-22 -44" stroke={K} strokeWidth="4" strokeLinecap="round" />
      <circle cx="150" cy="40" r="26" fill={S} />
      <Eye x={142} y={40} r={6} closed />
      <Eye x={160} y={40} r={6} closed />
      <text x="168" y="16" fontFamily="Anybody" fontWeight="900" fontSize="18" fill={C}>z</text>
    </>
  ),
  paperbodies: () => (
    <>
      <polygon points="100,20 136,60 100,74 64,60" fill={W} stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="64,60 100,74 100,140 50,120" fill={P} stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="136,60 100,74 100,140 150,120" fill={T} stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="50,120 100,140 78,184 40,172" fill={W} stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <polygon points="150,120 100,140 122,184 160,172" fill={C} stroke={K} strokeWidth="3" strokeLinejoin="round" />
      <Eye x={92} y={48} r={6} />
      <Eye x={110} y={48} r={6} />
    </>
  ),
  commonground: () => (
    <>
      <rect x="20" y="40" width="160" height="130" rx="10" fill={C} transform="rotate(-6 100 105)" />
      <g fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-6 100 105)">
        <path d="M56 140 v-44 l36 -30 l36 30 v44 z" />
        <path d="M82 140 v-22 h20 v22" />
        <path d="M128 140 h28 M146 140 v-30 a10 10 0 1 1 0 0.1" />
      </g>
      <rect x="130" y="150" width="56" height="16" rx="8" fill={L} transform="rotate(-30 158 158)" />
    </>
  ),
  echo: () => (
    <>
      <path d="M70 40 q50 -20 70 30 q14 40 -24 62 q-14 8 -12 30 q2 22 -22 22 q-24 0 -26 -26 q-2 -30 -16 -56 q-14 -40 30 -62z" fill={P} />
      <path d="M86 70 q24 -12 34 10 q8 20 -12 30 q-10 6 -8 18" fill="none" stroke={K} strokeWidth="5" strokeLinecap="round" />
      <path d="M150 52 q14 20 0 44 M164 40 q24 32 0 68 M178 30 q32 44 0 90" fill="none" stroke={T} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
}

export default function Sticker({ id, size = 140, tilt = 0, active = false, className = '' }) {
  const Art = ART[id]
  return (
    <motion.svg
      viewBox="-12 -12 224 224"
      width={size}
      height={size}
      className={`sticker ${className}`}
      animate={{ rotate: active ? 0 : tilt, scale: active ? 1.08 : 1, y: active ? -6 : 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      aria-hidden="true"
    >
      <g className="sil">
        <Art />
      </g>
      <g>
        <Art />
      </g>
    </motion.svg>
  )
}
