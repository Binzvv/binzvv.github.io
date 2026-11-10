import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CONNECTED, LENSES } from './data'
import type { Brew, Intent, Lens, Mode } from './data'
import { Shop } from './components/Shop'
import type { Freq, Region, Size } from './components/Shop'
import { Thread } from './components/Thread'
import { Reveal } from './components/Reveal'
import { Share } from './components/Share'
import { prefersReducedMotion } from './motion'

const LENS_KEYS: Record<string, Lens> = { b: 'brand', p: 'product', s: 'systems' }

function readUrl() {
  const q = new URLSearchParams(window.location.search)
  const lens = q.get('lens') as Mode | null
  const mode: Mode = lens && ['original', 'brand', 'product', 'systems', 'connected'].includes(lens) ? lens : 'original'
  const seen = new Set<Lens>((q.get('seen') ?? '').split('').map((c) => LENS_KEYS[c]).filter(Boolean))
  if (mode === 'connected') ['brand', 'product', 'systems'].forEach((l) => seen.add(l as Lens))
  if (mode !== 'original' && mode !== 'connected') seen.add(mode)
  const brew = q.get('brew') as Brew | null
  const intent = q.get('intent') as Intent | null
  return {
    mode,
    seen,
    brew: brew && ['espresso', 'filter', 'cafetiere'].includes(brew) ? brew : null,
    intent: intent && ['everyday', 'new', 'gift'].includes(intent) ? intent : null,
    freq: (q.get('freq') === 'once' ? 'once' : 'repeat') as Freq,
    size: (q.get('size') === '1000' ? '1000' : '250') as Size,
  }
}

export function buildQuery(s: { mode: Mode; seen: Set<Lens>; brew: Brew | null; intent: Intent | null; freq: Freq; size: Size }) {
  const q = new URLSearchParams()
  if (s.mode !== 'original') q.set('lens', s.mode)
  const seen = ['brand', 'product', 'systems'].filter((l) => s.seen.has(l as Lens)).map((l) => l[0]).join('')
  if (seen && s.mode !== 'connected') q.set('seen', seen)
  if (s.brew) q.set('brew', s.brew)
  if (s.intent) q.set('intent', s.intent)
  if (s.freq !== 'repeat') q.set('freq', s.freq)
  if (s.size !== '250') q.set('size', s.size)
  const str = q.toString()
  return str ? `?${str}` : ''
}

export default function App() {
  const init = useRef(readUrl()).current
  const [mode, setMode] = useState<Mode>(init.mode)
  const [seen, setSeen] = useState<Set<Lens>>(init.seen)
  const [brew, setBrew] = useState<Brew | null>(init.brew)
  const [intent, setIntent] = useState<Intent | null>(init.intent)
  const [freq, setFreq] = useState<Freq>(init.freq)
  const [size, setSize] = useState<Size>(init.size)
  const [hot, setHot] = useState<Region | null>(null)
  const [busy, setBusy] = useState(false)
  const [delay, setDelay] = useState(0)
  const overlay = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const experiment = useRef<HTMLElement>(null)
  const seg = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)

  const allSeen = seen.size === 3
  const state = { mode, seen, brew, intent, freq, size }

  useEffect(() => {
    try { window.history.replaceState(null, '', window.location.pathname + buildQuery(state) + window.location.hash) } catch { /* sandboxed preview */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, seen, brew, intent, freq, size])

  // Segmented control: slide the active pill under the current lens.
  const placePill = useCallback((animate: boolean) => {
    const wrap = seg.current
    const p = pill.current
    if (!wrap || !p) return
    const btn = wrap.querySelector<HTMLButtonElement>(`[data-lens="${mode}"]`)
    if (!btn) { gsap.to(p, { opacity: 0, duration: 0.3 }); return }
    const vars = { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 }
    if (!animate || prefersReducedMotion()) gsap.set(p, vars)
    else gsap.to(p, { ...vars, duration: 0.55, ease: 'expo.out' })
  }, [mode])

  useLayoutEffect(() => { placePill(true) }, [placePill])
  useEffect(() => {
    const onResize = () => placePill(false)
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(() => placePill(false))
    return () => window.removeEventListener('resize', onResize)
  }, [placePill])

  const choose = (m: Mode) => {
    if (busy || m === mode) return
    setDelay(0)
    setMode(m)
    if (m === 'brand' || m === 'product' || m === 'systems') setSeen((s) => new Set(s).add(m))
  }

  // Explanation panel transition.
  useLayoutEffect(() => {
    if (!panel.current || prefersReducedMotion()) return
    const t = gsap.fromTo(panel.current.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: mode === 'connected' ? 2.4 : 0.15 })
    return () => { t.kill() }
  }, [mode])

  const connect = useCallback(() => {
    if (!allSeen || busy || mode === 'connected') return
    if (prefersReducedMotion() || !overlay.current) {
      setDelay(0)
      setMode('connected')
      return
    }
    setBusy(true)
    const o = overlay.current
    const words = o.querySelectorAll('[data-word]')
    const final = o.querySelector('[data-final]')
    const rule = o.querySelector('[data-rule]')
    frame.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const tl = gsap.timeline({ onComplete: () => { gsap.set(o, { display: 'none' }); setBusy(false) } })
    tl.set(o, { display: 'flex', clipPath: 'inset(100% 0% 0% 0%)' })
      .set(words, { y: (i) => (i - 1) * 64, opacity: 0 })
      .set(final, { opacity: 0, y: 12 })
      .set(rule, { scaleX: 0 })
      .to(o, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' })
      .to(words, { opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, '-=0.15')
      .call(() => { setDelay(1.05); setMode('connected') })
      .to(words, { y: 0, duration: 0.8, ease: 'expo.inOut' }, '+=0.25')
      .to(words, { opacity: 0, duration: 0.3 }, '-=0.25')
      .to(rule, { scaleX: 1, duration: 0.6, ease: 'expo.inOut' }, '-=0.3')
      .to(final, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '-=0.35')
      .to(o, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '+=0.35')
  }, [allSeen, busy, mode])

  const reset = () => {
    if (busy) return
    setDelay(0)
    setMode('original')
    setSeen(new Set())
    setBrew(null)
    setIntent(null)
    setFreq('repeat')
    setSize('250')
    experiment.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const info = mode === 'connected' ? CONNECTED : LENSES.find((l) => l.id === mode)!
  const showThread = mode === 'systems' || mode === 'connected'

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-line bg-paper">
        <div className="mx-auto flex h-12 max-w-[1080px] items-center justify-between px-4 sm:px-6">
          <p className="text-[13px] font-semibold tracking-tight">Same problem.</p>
          <p className="hidden text-[12px] text-mute sm:block">An experiment in connected design</p>
          <button onClick={reset} className="text-[12px] text-link hover:underline">Reset</button>
        </div>
      </header>

      {/* Arrival */}
      <section className="mx-auto max-w-[1080px] px-4 pb-20 pt-20 text-center sm:px-6 sm:pb-28 sm:pt-32">
        <p className="eyebrow text-mute">Brand. Product. Systems.</p>
        <h1 className="mx-auto mt-3 max-w-[12ch] text-[clamp(3rem,9vw,6.5rem)] font-semibold leading-[1.02] tracking-[-0.045em] [text-wrap:balance]">
          Same problem. Different thinking.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[clamp(1.1rem,2vw,1.5rem)] leading-snug text-mute">
          One business challenge. Three ways to see it. One connected solution.
        </p>
        <div className="mx-auto mt-14 max-w-2xl rounded-[28px] bg-card px-6 py-8 sm:px-10 sm:py-10">
          <p className="label text-mute">The brief</p>
          <p className="mt-3 text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance]">
            “People are visiting our website, but they’re not taking action.”
          </p>
        </div>
      </section>

      {/* Experiment */}
      <section ref={experiment} id="experiment" className="scroll-mt-12 bg-card pb-24 pt-20 sm:pb-32 sm:pt-28">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <div className="text-center">
            <p className="eyebrow text-mute">Choose a lens.</p>
            <h2 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em]">See the same website change.</h2>
          </div>

          <div className="sticky top-14 z-40 mt-10 flex justify-center">
            <div className="no-scrollbar max-w-full overflow-x-auto rounded-full">
              <div ref={seg} className="relative flex rounded-full bg-paper p-1" role="group" aria-label="Design lenses">
                <span ref={pill} aria-hidden="true" className="absolute bottom-1 left-0 top-1 rounded-full bg-ink opacity-0" />
                {LENSES.map((l) => {
                  const active = mode === l.id
                  const visited = l.id !== 'original' && seen.has(l.id as Lens)
                  return (
                    <button
                      key={l.id}
                      data-lens={l.id}
                      onClick={() => choose(l.id)}
                      aria-pressed={active}
                      disabled={busy}
                      className={`relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-300 sm:px-6 sm:text-[15px] ${active ? 'text-paper' : 'text-ink hover:text-mute'}`}
                    >
                      {l.label}
                      {visited && !active && <span className="h-1 w-1 rounded-full bg-link" aria-label="seen" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div ref={panel} className="mx-auto mt-12 min-h-[150px] max-w-2xl text-center" aria-live="polite">
            <p className="text-[clamp(1.6rem,3.4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em]">{info.question}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-ink">{info.intervention}</p>
            {info.limit && <p className="mt-2 text-[15px] leading-relaxed text-mute">{info.limit}</p>}
          </div>

          <div ref={frame} className="relative mt-8 rounded-[32px] bg-ink p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] sm:p-3">
            <div className="overflow-hidden rounded-[24px] bg-white">
              <div className="flex items-center justify-between bg-[#F2F2F4] px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden="true"><i className="h-2.5 w-2.5 rounded-full bg-black/15" /><i className="h-2.5 w-2.5 rounded-full bg-black/15" /><i className="h-2.5 w-2.5 rounded-full bg-black/15" /></span>
                <span className="rounded-md bg-white px-6 py-0.5 text-[11px] text-mute">northfield.coffee</span>
                <span className="w-16 text-right text-[11px] font-medium text-mute">{info.label}</span>
              </div>
              <div className="relative h-[620px] sm:h-[700px]">
                <Shop
                  mode={mode}
                  brew={brew} setBrew={setBrew}
                  intent={intent} setIntent={setIntent}
                  freq={freq} setFreq={setFreq}
                  size={size} setSize={setSize}
                  hot={hot}
                  entranceDelay={delay}
                />
                <div ref={overlay} className="absolute inset-0 z-40 hidden flex-col items-center justify-center bg-card" aria-hidden="true">
                  <div className="relative grid h-48 w-full place-items-center">
                    {['Brand', 'Product', 'Systems'].map((w) => (
                      <span key={w} data-word className="absolute text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">{w}</span>
                    ))}
                    <span data-final className="absolute text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">One experience.</span>
                  </div>
                  <span data-rule className="block h-[2px] w-40 origin-center rounded-full bg-link" />
                </div>
              </div>
            </div>
          </div>

          {showThread ? (
            <Thread mode={mode} brew={brew} intent={intent} freq={freq} size={size} setHot={setHot} />
          ) : (
            <p className="mt-6 text-center text-[13px] text-mute">The shop is fully interactive. Browse, choose and add to basket.</p>
          )}

          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <button
              onClick={connect}
              disabled={!allSeen || busy}
              aria-disabled={!allSeen}
              aria-describedby="connect-hint"
              className={`rounded-full px-8 py-4 text-[17px] font-medium transition-all duration-300 ${
                mode === 'connected' ? 'bg-paper text-ink' : allSeen ? 'bg-link text-white hover:scale-[1.02] hover:bg-[#0077ED]' : 'cursor-not-allowed bg-paper text-mute'
              }`}
            >
              {mode === 'connected' ? 'Thinking connected' : 'Connect the thinking'}
            </button>
            <p id="connect-hint" className="text-[13px] text-mute">
              {mode === 'connected' ? 'All three lenses, one experience.' : allSeen ? 'Ready. Combine all three.' : `Explore all three lenses first. ${seen.size} of 3 seen.`}
            </p>
          </div>
        </div>
      </section>

      {mode === 'connected' && <Reveal />}

      <Share state={state} buildQuery={buildQuery} />

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-5 text-[12px] text-mute sm:px-6">
          <p>Same problem. Different thinking.</p>
          <button onClick={reset} className="text-link hover:underline">Start again</button>
        </div>
      </footer>
    </div>
  )
}
