import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CONNECTED, LENSES } from './data'
import type { Brew, Intent, Lens, Mode } from './data'
import { Shop } from './components/Shop'
import type { Freq, Region, Size } from './components/Shop'
import { Thread } from './components/Thread'
import { Reveal } from './components/Reveal'
import { Proof } from './components/Proof'
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

  const allSeen = seen.size === 3
  const state = { mode, seen, brew, intent, freq, size }

  useEffect(() => {
    try { window.history.replaceState(null, '', window.location.pathname + buildQuery(state) + window.location.hash) } catch { /* sandboxed preview */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, seen, brew, intent, freq, size])

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
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-5 sm:px-8">
        <p className="label">Experiment 01</p>
        <p className="label hidden text-mute sm:block">Brand · Product · Systems</p>
        <button onClick={reset} className="label underline-offset-4 hover:underline">Reset</button>
      </header>

      {/* 01 — Arrival */}
      <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-28">
        <h1 className="text-[clamp(3rem,10.5vw,10rem)] font-extrabold leading-[0.88] tracking-[-0.055em]">
          Same problem.<br /><span className="text-mute">Different thinking.</span>
        </h1>
        <div className="mt-10 grid gap-8 border-t border-line pt-6 sm:mt-14 md:grid-cols-12">
          <p className="text-lg leading-snug md:col-span-5 md:text-xl">One business challenge. Three ways to see it. One connected solution.</p>
          <div className="md:col-span-6 md:col-start-7">
            <p className="label text-mute">The brief</p>
            <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">“People are visiting our website, but they’re not taking action.”</p>
          </div>
        </div>
      </section>

      {/* 02–05 — The experiment */}
      <section ref={experiment} id="experiment" className="mx-auto max-w-[1440px] scroll-mt-4 px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-6">
              <p className="label text-mute">Choose a lens</p>
              <div className="no-scrollbar -mx-4 mt-3 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:block lg:overflow-visible lg:px-0" role="group" aria-label="Design lenses">
                {LENSES.map((l) => {
                  const active = mode === l.id
                  const visited = l.id !== 'original' && seen.has(l.id as Lens)
                  return (
                    <button
                      key={l.id}
                      onClick={() => choose(l.id)}
                      aria-pressed={active}
                      disabled={busy}
                      className={`group shrink-0 border-t border-line py-3 pr-5 text-left transition-colors lg:flex lg:w-full lg:items-baseline lg:gap-4 lg:pr-0 ${active ? 'text-ink' : 'text-mute hover:text-ink'}`}
                    >
                      <span className="label block lg:w-6">{l.index}</span>
                      <span className="block">
                        <span className="flex items-center gap-2 text-xl font-bold tracking-tight lg:text-2xl">
                          {l.label}
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />}
                          {visited && !active && <span className="label text-[9px] text-mute">Seen</span>}
                        </span>
                        <span className="mt-0.5 hidden text-[13px] lg:block">{l.question}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <button
                  onClick={connect}
                  disabled={!allSeen || busy}
                  aria-disabled={!allSeen}
                  aria-describedby="connect-hint"
                  className={`flex w-full items-center justify-between px-5 py-4 text-left text-[15px] font-semibold transition-colors ${
                    mode === 'connected' ? 'border border-ink bg-paper text-ink' : allSeen ? 'bg-ink text-paper hover:bg-ink/85' : 'cursor-not-allowed bg-ink/10 text-mute'
                  }`}
                >
                  <span>{mode === 'connected' ? 'Thinking connected' : 'Connect the thinking'}</span>
                  <span aria-hidden="true">{mode === 'connected' ? '●' : '→'}</span>
                </button>
                <p id="connect-hint" className="label mt-2 text-mute">
                  {mode === 'connected' ? 'All three lenses, one experience' : allSeen ? 'Ready — combine all three' : `Explore all three lenses · ${seen.size}/3`}
                </p>
              </div>

              <div ref={panel} className="mt-8 hidden lg:block" aria-live="polite">
                <p className="label text-mute">{info.index} — {info.label}</p>
                <p className="mt-2 text-3xl font-bold leading-[1.05] tracking-tight">{info.question}</p>
                <p className="mt-4 text-[15px] leading-relaxed">{info.intervention}</p>
                {info.limit && <p className="mt-3 text-[13px] leading-relaxed text-mute">{info.limit}</p>}
              </div>
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-8 xl:col-span-9">
            {/* Mobile explanation */}
            <div className="lg:hidden" aria-live="polite">
              <p className="text-2xl font-bold leading-tight tracking-tight">{info.question}</p>
              <p className="mt-2 text-[15px] leading-relaxed">{info.intervention}</p>
              {info.limit && <p className="mt-2 text-[13px] text-mute">{info.limit}</p>}
            </div>

            <div ref={frame} className="relative mt-6 border border-ink/80 bg-white lg:mt-0">
              <div className="flex items-center justify-between border-b border-ink/80 px-3 py-2">
                <span className="label text-mute">northfield.coffee</span>
                <span className="label">{info.label}</span>
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
                <div ref={overlay} className="absolute inset-0 z-40 hidden flex-col items-center justify-center bg-paper" aria-hidden="true">
                  <div className="relative grid h-48 w-full place-items-center">
                    {['Brand', 'Product', 'Systems'].map((w) => (
                      <span key={w} data-word className="absolute text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">{w}</span>
                    ))}
                    <span data-final className="absolute text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">One experience.</span>
                  </div>
                  <span data-rule className="block h-[1.5px] w-40 origin-center bg-ink" />
                </div>
              </div>
            </div>

            {showThread ? (
              <Thread mode={mode} brew={brew} intent={intent} freq={freq} size={size} setHot={setHot} />
            ) : (
              <p className="label mt-5 text-mute">The fictional shop is fully interactive — browse, choose, add to basket.</p>
            )}
          </div>
        </div>
      </section>

      {mode === 'connected' && <Reveal />}

      <Proof />
      <Share state={state} buildQuery={buildQuery} />

      <footer className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-line px-4 py-6 sm:px-8">
        <p className="label text-mute">Same problem. Different thinking.</p>
        <button onClick={reset} className="label hover:underline">Start again</button>
      </footer>
    </div>
  )
}
