import { useEffect, useRef } from 'react'
import { COLORS, FORM_COUNT, formation, mass } from '../formation.js'

// One persistent WebGL canvas behind every state. It renders the 12 forms as a
// single implicit surface (metaballs), so forms that come close merge, pull
// apart, stretch and dissolve rather than overlapping. Light, a soft halo and
// fine grain give them depth. Nothing here knows about modes: it only follows
// the current formation (see formation.js).

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_soft;
uniform float u_dpr;
uniform vec3 u_b[${FORM_COUNT}];
uniform vec3 u_c[${FORM_COUNT}];
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float f = 0.0; vec2 g = vec2(0.0); vec3 col = vec3(0.0); float ws = 0.0;
  for (int i = 0; i < ${FORM_COUNT}; i++) {
    vec3 b = u_b[i];
    if (b.z < 0.5) continue;
    vec2 d = p - b.xy;
    float d2 = dot(d, d) + 1.0;
    float w = b.z * b.z / d2;
    // cap each form's pull so forms nested inside a mass don't show as specks
    float s = 2.5 / (w + 2.5);
    g += -2.0 * w * d / d2 * s * s;
    w *= s;
    f += w;
    float k = w;
    col += u_c[i] * k; ws += k;
  }
  if (f < 0.12) { gl_FragColor = vec4(0.0); return; }
  col /= max(ws, 1e-6);
  float edge = smoothstep(1.0 - u_soft, 1.0 + u_soft, f);
  float halo = smoothstep(0.35, 1.0, f) * 0.14;
  // shade a softened height (1 - 1/f) so merged interiors stay smooth
  vec3 n = normalize(vec3(-g / (f * f) * 70.0 * u_dpr, 1.0));
  vec3 L = normalize(vec3(-0.45, -0.65, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 28.0);
  float rim = 1.0 - n.z;
  vec3 lit = col * (0.62 + 0.5 * diff) + vec3(spec * 0.38) - rim * 0.12;
  float grain = (hash(p * 0.5 + fract(u_time)) - 0.5) * 0.05;
  vec3 c = mix(col, lit, edge) + grain * edge;
  float a = max(edge, halo);
  gl_FragColor = vec4(c * a, a);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

export default function Field() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true })
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    const forms = Array.from({ length: FORM_COUNT }, (_, i) => ({
      x: window.innerWidth * 0.7,
      y: window.innerHeight * 0.5,
      r: 0,
      vx: 0,
      vy: 0,
      c: [...COLORS[i % 3]],
    }))

    let prog = null
    let U = {}
    if (gl) {
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      gl.useProgram(prog)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      U = {
        res: gl.getUniformLocation(prog, 'u_res'),
        time: gl.getUniformLocation(prog, 'u_time'),
        soft: gl.getUniformLocation(prog, 'u_soft'),
        dpr: gl.getUniformLocation(prog, 'u_dpr'),
        b: gl.getUniformLocation(prog, 'u_b'),
        c: gl.getUniformLocation(prog, 'u_c'),
      }
      gl.clearColor(0, 0, 0, 0)
    }
    const ctx2d = gl ? null : canvas.getContext('2d')

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 1.75)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const B = new Float32Array(FORM_COUNT * 3)
    const C = new Float32Array(FORM_COUNT * 3)
    let soft = 0.08
    let t = 0
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!reduce) t += dt
      let targets
      try {
        targets = formation.fn ? formation.fn(t, w, h) : null
      } catch {
        targets = null
      }
      if (!targets) targets = mass(w * 0.72, h * 0.5, Math.min(w, h) * 0.14, t)
      const k = reduce ? 1 : formation.stiffness
      soft += (formation.soft - soft) * 0.05

      forms.forEach((f, i) => {
        const tg = targets[i]
        if (reduce) {
          f.x = tg.x
          f.y = tg.y
          f.r = tg.r
        } else {
          f.vx = (f.vx + (tg.x - f.x) * k) * 0.82
          f.vy = (f.vy + (tg.y - f.y) * k) * 0.82
          f.x += f.vx
          f.y += f.vy
          f.r += (tg.r - f.r) * k * 1.1
        }
        for (let j = 0; j < 3; j++) f.c[j] += (tg.c[j] - f.c[j]) * 0.05
        B[i * 3] = f.x * dpr
        B[i * 3 + 1] = f.y * dpr
        B[i * 3 + 2] = Math.max(0, f.r) * dpr
        C[i * 3] = f.c[0]
        C[i * 3 + 1] = f.c[1]
        C[i * 3 + 2] = f.c[2]
      })

      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(U.res, canvas.width, canvas.height)
        gl.uniform1f(U.time, t)
        gl.uniform1f(U.soft, soft)
        gl.uniform1f(U.dpr, dpr)
        gl.uniform3fv(U.b, B)
        gl.uniform3fv(U.c, C)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      } else if (ctx2d) {
        ctx2d.setTransform(1, 0, 0, 1, 0, 0)
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
        forms.forEach((f) => {
          if (f.r < 1) return
          ctx2d.fillStyle = `rgb(${f.c.map((v) => Math.round(v * 255)).join(',')})`
          ctx2d.beginPath()
          ctx2d.arc(f.x * dpr, f.y * dpr, f.r * dpr * 0.9, 0, Math.PI * 2)
          ctx2d.fill()
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
}
