/**
 * PUSH — "raw" plate layers. Documentary language built procedurally:
 * a backlit runner mid-stride (original drawing), dust, sodium light, lane
 * lines, motion smear, halation and hard crops. Placeholder until real
 * photography is supplied via `story.src`.
 */

// Side-on stride, running right. viewBox 0 0 100 140. Limbs are tapered
// capsules (two circles + hull) so the silhouette reads as a body, not a sign.
function seg([x1, y1, r1], [x2, y2, r2]) {
  const dx = x2 - x1
  const dy = y2 - y1
  const l = Math.hypot(dx, dy) || 1
  const nx = -dy / l
  const ny = dx / l
  const pts = [
    [x1 + nx * r1, y1 + ny * r1],
    [x2 + nx * r2, y2 + ny * r2],
    [x2 - nx * r2, y2 - ny * r2],
    [x1 - nx * r1, y1 - ny * r1],
  ]
  return `M${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' L')} Z M${x1 - r1},${y1} a${r1},${r1} 0 1,0 ${r1 * 2},0 a${r1},${r1} 0 1,0 ${-r1 * 2},0 M${x2 - r2},${y2} a${r2},${r2} 0 1,0 ${r2 * 2},0 a${r2},${r2} 0 1,0 ${-r2 * 2},0`
}
const chain = (...j) => j.slice(1).map((b, i) => seg(j[i], b)).join(' ')

const BODY = {
  backArm: chain([52, 30, 3.7], [41, 42, 2.8], [35, 53, 2.1], [34, 56, 2.5]),
  backLeg: chain([47, 67, 7], [38, 93, 4.5], [31, 98, 4.5], [17, 104, 2.3]) + ' ' + chain([18, 104, 2.6], [11, 97, 1.9]),
  torso: 'M49,25 C55,23 61,25 63,29 C63,36 61,44 57,54 L57,66 C52,70 46,70 43,68 C43,60 45,52 46,44 C46,36 46,29 49,25 Z',
  shorts: 'M43,59 L58,59 L61,75 C57,78 52,79 48,76 L41,72 Z',
  neck: chain([58, 19, 3], [56, 26, 3.5]),
  hair: 'M62,6.5 C55,4 48,6 41,11 C38,13 35,14 32,14.5 C37,16 42,15.5 47,14 C51,13.5 54,14.5 56,16 Z',
  frontLeg: chain([52, 65, 7], [68, 81, 4.7], [67, 91, 4.9], [63, 107, 2.5]) + ' ' + chain([62, 108, 2.8], [72, 111, 2.2]),
  frontArm: chain([59, 30, 3.8], [66, 44, 2.8], [75, 38, 2.1], [77, 36, 2.5]),
}

function Figure({ color }) {
  return (
    <g fill={color}>
      <path d={BODY.backArm} opacity="0.88" />
      <path d={BODY.backLeg} opacity="0.9" />
      <path d={BODY.torso} />
      <path d={BODY.shorts} />
      <path d={BODY.neck} />
      <ellipse cx="61" cy="13" rx="6.4" ry="7.4" transform="rotate(12 61 13)" />
      <path d={BODY.hair} />
      <path d={BODY.frontLeg} />
      <path d={BODY.frontArm} />
    </g>
  )
}

const runnerVarsNum = (p) => parseFloat(runnerVars(p)['--pb'])

// Portrait frames (the full-bleed phone view) lift the runner above the type.
export function runnerVars(p) {
  const r = p.runner
  const pb = Math.max(r.bottom, Math.min(r.bottom + 40, 100 - p.horizon - 3))
  return { '--x': `${r.x}%`, '--b': `${r.bottom}%`, '--h': `${r.h}%`, '--pb': `${pb}%`, '--ph': `${r.h * 0.5}%`, '--lean': `${r.lean || 0}deg` }
}

export function Runner({ story }) {
  const r = story.plate.runner
  if (!r) return null
  const night = story.plate.night
  const color = night ? '#0B0907' : '#16120E'
  const id = `run-${story.id}`
  const blur = r.blur ?? 0.8
  return (
    <div className="raw-runner absolute" style={runnerVars(story.plate)} aria-hidden>
      <svg viewBox="0 0 100 140" className="h-full w-full overflow-visible">
        <defs>
          <filter id={`${id}-smear`} x="-60%" y="-10%" width="220%" height="120%">
            <feGaussianBlur stdDeviation={`${blur * 6} ${blur * 0.6}`} />
          </filter>
          <filter id={`${id}-soft`}>
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
        {/* motion ghosts trail behind the direction of travel */}
        <g filter={`url(#${id}-smear)`} opacity="0.32" transform="translate(-9 0)">
          <Figure color={color} />
        </g>
        <g filter={`url(#${id}-smear)`} opacity="0.14" transform="translate(-20 1)">
          <Figure color={color} />
        </g>
        <g filter={`url(#${id}-soft)`}>
          <Figure color={color} />
        </g>
        {/* ground shadow */}
        <ellipse cx="44" cy="117" rx="34" ry="2.6" fill={color} opacity={night ? 0.5 : 0.3} filter={`url(#${id}-smear)`} />
      </svg>
    </div>
  )
}

const GRAVEL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 -2.6 1.55'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>")`

export function RawLayers({ story }) {
  const p = story.plate
  return (
    <>
      {/* ground texture: gravel, cracked tarmac, worn rubber — receding in perspective */}
      <div
        className="absolute inset-x-[-20%] bottom-0"
        style={{
          top: `${p.horizon + 1}%`,
          backgroundImage: GRAVEL,
          backgroundSize: '180px 180px',
          opacity: p.night ? 0.35 : 0.55,
          mixBlendMode: 'multiply',
          transform: 'perspective(500px) rotateX(38deg)',
          transformOrigin: '50% 0',
          maskImage: 'linear-gradient(180deg, #0003, #000 40%)',
        }}
      />
      {p.steps && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: `${p.horizon + 4}%`,
            background: 'repeating-linear-gradient(180deg, #0000 0 26px, #0000004d 26px 30px, #ffffff12 30px 32px)',
            maskImage: 'linear-gradient(180deg, #0008, #000)',
            transform: 'perspective(600px) rotateX(28deg)',
            transformOrigin: '50% 0',
          }}
        />
      )}
      {p.lanes && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${-30 + i * 22},100 C${10 + i * 14},${60 - i * 3} ${50 + i * 8},${p.horizon + 12} ${120},${p.horizon + 6 + i * 2}`} stroke="#EDE6D6" strokeOpacity="0.55" strokeWidth="0.45" fill="none" />
          ))}
        </svg>
      )}
      {p.lights &&
        [18, 40, 63, 86].map((x, i) => (
          <div key={x}>
            <div className="absolute rounded-full" style={{ left: `${x}%`, top: `${p.horizon - 26 + i * 3}%`, width: 10, height: 10, background: '#FFC27A', boxShadow: '0 0 40px 18px #FF9A3C88, 0 0 120px 60px #FF8A2A33' }} />
            <div className="absolute" style={{ left: `${x - 12}%`, top: `${p.horizon - 25 + i * 3}%`, width: '24%', height: 2, background: 'linear-gradient(90deg, #0000, #FFB76488, #0000)', filter: 'blur(1px)' }} />
          </div>
        ))}
      {p.dust && (
        <div className="raw-dust absolute" style={{ '--dy': `${p.dust[1]}%`, '--pdy': `${100 - runnerVarsNum(p) - p.runner.h * 0.2}%`, left: `${p.dust[0]}%`, width: `${p.dust[2]}%`, aspectRatio: '1.7' }} aria-hidden>
          {[
            [22, 62, 42, 0.95],
            [40, 48, 50, 0.9],
            [58, 58, 46, 0.95],
            [74, 70, 34, 0.85],
            [36, 74, 40, 1],
            [12, 76, 26, 0.7],
            [52, 34, 30, 0.55],
          ].map(([x, y, sz, o], i) => (
            <div key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: `${sz}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, #E2CDAE 0%, #C9AC88dd 34%, #A98A6600 70%)', opacity: o, filter: 'blur(7px)' }} />
          ))}
        </div>
      )}
      <Runner story={story} />
      {/* kicked-up dust at the feet */}
      {p.dust && p.runner && (
        <div className="raw-kick absolute" style={{ ...runnerVars(p), left: `${p.runner.x - 14}%`, width: '20%', height: '6%', background: 'radial-gradient(ellipse, #A88A6A99, #0000 70%)', filter: 'blur(6px)' }} />
      )}
      {/* halation + light leak: film, not screen */}
      <div className="absolute inset-0 mix-blend-screen" style={{ background: `radial-gradient(ellipse 50% 40% at ${p.sun[0]}% ${p.sun[1]}%, ${p.night ? '#FF9A4A33' : '#FFF6E055'}, #0000 70%)` }} />
      <div className="absolute inset-y-0 right-0 w-[18%] mix-blend-screen" style={{ background: 'linear-gradient(90deg, #0000, #FF6A2A1f 70%, #FFB0702e)' }} />
      {/* crushed, faded blacks at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(180deg, #0000, #0a080633 60%, #0a0806aa)' }} />
      <div className="absolute inset-0" style={{ background: '#2a2018', mixBlendMode: 'lighten', opacity: 0.18 }} />
    </>
  )
}
