import { memo, useMemo, useState } from 'react'

// Deterministic pseudo-random for ridge silhouettes
function rng(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function ridgePath(seed, amp, base, layers = 5) {
  const r = rng(seed)
  const phases = Array.from({ length: layers }, () => r() * Math.PI * 2)
  const freqs = Array.from({ length: layers }, (_, i) => (i + 1) * (0.9 + r() * 0.8))
  const pts = []
  for (let x = 0; x <= 100; x += 2) {
    let y = 0
    for (let i = 0; i < layers; i++) y += Math.sin((x / 100) * Math.PI * freqs[i] + phases[i]) / (i + 1)
    pts.push(`${x},${(base - y * amp * 9).toFixed(2)}`)
  }
  return `M0,100 L${pts.join(' L')} L100,100 Z`
}

export const GRADES = {
  escape: 'saturate(0.75) contrast(0.94) brightness(1.03)',
  push: 'grayscale(0.55) contrast(1.32) brightness(0.92)',
  wander: 'sepia(0.12) saturate(0.95) contrast(1.02)',
}

/**
 * A plate is the image unit of the identity. It renders real photography when
 * `story.src` exists, otherwise a clearly labelled procedural placeholder built
 * from the story's tonal recipe (sky, haze, ground, horizon, light).
 */
function PlateBase({ story, grade, drift = true, label = false, className = '', style }) {
  const p = story.plate
  const [failed, setFailed] = useState(false)
  const paths = useMemo(
    () => ({
      far: ridgePath(p.seed, p.ridge * 0.7, p.horizon - 1),
      near: ridgePath(p.seed + 7, p.ridge, p.horizon + 5),
    }),
    [p.seed, p.ridge, p.horizon],
  )
  const useImage = story.src && !failed

  return (
    <div className={`absolute inset-0 overflow-hidden grain ${className}`} style={{ filter: grade ? GRADES[grade] : undefined, ...style }}>
      <div className={`absolute inset-0 ${drift ? 'plate-drift' : ''}`}>
        {useImage ? (
          <img src={story.src} alt={`${story.title} — ${story.place}`} onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <div
            role="img"
            aria-label={`Placeholder plate: ${story.title}, ${story.place}`}
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 38% 30% at ${p.sun[0]}% ${p.sun[1]}%, ${p.haze}ee 0%, ${p.haze}00 70%),
                linear-gradient(180deg, ${p.sky[0]} 0%, ${p.sky[1]} ${p.horizon - 4}%, ${p.haze} ${p.horizon}%, ${p.ground[0]} ${p.horizon + 6}%, ${p.ground[1]} 100%)`,
            }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id={`fade-${story.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={p.ground[0]} stopOpacity="0.55" />
                  <stop offset="1" stopColor={p.ground[1]} stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d={paths.far} fill={p.ground[0]} opacity="0.35" style={{ filter: 'blur(0.6px)' }} />
              <path d={paths.near} fill={`url(#fade-${story.id})`} opacity="0.9" style={{ filter: 'blur(0.25px)' }} />
            </svg>
            {/* atmospheric haze across the horizon */}
            <div
              className="absolute inset-x-0"
              style={{
                top: `${p.horizon - 10}%`,
                height: '18%',
                background: `linear-gradient(180deg, ${p.haze}00, ${p.haze}88 50%, ${p.haze}00)`,
                filter: 'blur(8px)',
              }}
            />
            {p.streak && (
              <div
                className="absolute inset-0 mix-blend-soft-light"
                style={{ background: 'repeating-linear-gradient(180deg, #fff0 0 3px, #ffffff14 3px 4px)', filter: 'blur(0.6px)' }}
              />
            )}
            {/* lens falloff */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, #0000 55%, #0000002e 100%)' }} />
          </div>
        )}
      </div>
      {label && !useImage && (
        <span className="label absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-white/70">Placeholder plate · {story.title}</span>
      )}
    </div>
  )
}

export const Plate = memo(PlateBase)
