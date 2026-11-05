import { motion } from 'framer-motion'

// Generative line-drawing per project — no images, so it stays light.
function rand(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export default function Glyph({ seed = 1, size = 120, active = false, className = '' }) {
  const r = rand(seed)
  const type = seed % 4
  const stroke = '#e8e4da'
  const els = []

  if (type === 0) {
    const n = 4 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++)
      els.push(<circle key={i} cx={50 + (r() - 0.5) * 16} cy={50 + (r() - 0.5) * 16} r={8 + i * (34 / n)} />)
  } else if (type === 1) {
    for (let i = 0; i < 11; i++) {
      const hgt = 12 + r() * 70
      els.push(<line key={i} x1={10 + i * 8} x2={10 + i * 8} y1={50 - hgt / 2} y2={50 + hgt / 2} />)
    }
  } else if (type === 2) {
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++)
        if (r() > 0.35) els.push(<rect key={`${i}${j}`} x={14 + i * 16} y={14 + j * 16} width={6} height={6} />)
  } else {
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2
      const rr = 14 + i * 6
      els.push(
        <path
          key={i}
          d={`M ${50 + Math.cos(a) * rr} ${50 + Math.sin(a) * rr} A ${rr} ${rr} 0 0 1 ${50 + Math.cos(a + 2.4) * rr} ${50 + Math.sin(a + 2.4) * rr}`}
        />,
      )
    }
  }

  const dotA = r() * Math.PI * 2
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={type === 2 ? 0 : 0.9}
      animate={{ rotate: active ? 24 : 0, scale: active ? 1.06 : 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      <g fill={type === 2 ? stroke : 'none'} opacity={0.9}>
        {els}
      </g>
      <circle cx={50 + Math.cos(dotA) * 38} cy={50 + Math.sin(dotA) * 38} r={3.2} fill="#ff4a1c" stroke="none" />
    </motion.svg>
  )
}
