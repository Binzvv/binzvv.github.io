import { useRef, useState } from 'react'
import type { Brew, Intent, Lens, Mode } from '../data'
import { BREWS } from '../data'
import type { Freq, Size } from './Shop'

type State = { mode: Mode; seen: Set<Lens>; brew: Brew | null; intent: Intent | null; freq: Freq; size: Size }

export function Share({ state, buildQuery }: { state: State; buildQuery: (s: State) => string }) {
  const [msg, setMsg] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const shareState: State = { ...state, mode: 'connected', brew: state.brew ?? 'espresso' }
  const url = `${window.location.origin}${window.location.pathname}${buildQuery(shareState)}#summary`
  const brew = BREWS.find((b) => b.id === shareState.brew)!

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setMsg('Link copied.')
    } catch {
      input.current?.select()
      setMsg('Press Ctrl/Cmd + C to copy.')
    }
    window.setTimeout(() => setMsg(''), 2500)
  }

  const rows: [string, string][] = [
    ['The challenge', '“People are visiting our website, but they’re not taking action.”'],
    ['01 Brand', 'A distinct proposition — “Coffee for the first quiet hour” — gives people a reason to care.'],
    ['02 Product', 'Two questions replace nine options, so the next step is obvious.'],
    ['03 Systems', 'Intent is captured once and carried through messaging, choices and the basket.'],
    ['Connected', `The brand asks “How does your first hour start?”, answers with one roast ground for ${brew.label.toLowerCase()}, and the basket remembers why you came.`],
  ]

  return (
    <section id="summary" className="mx-auto max-w-[1440px] scroll-mt-6 px-4 py-28 sm:px-8 sm:py-40" aria-labelledby="summary-title">
      <div className="border border-ink p-5 sm:p-10">
        <p className="label text-mute">Summary to share</p>
        <h2 id="summary-title" className="mt-3 text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-6xl">Same problem.<br />Different thinking.</h2>
        <dl className="mt-10 border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="label pt-1 text-mute">{k}</dt>
              <dd className={`text-[17px] leading-snug ${k === 'Connected' ? 'font-semibold' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="share-url">Shareable link</label>
          <input id="share-url" ref={input} readOnly value={url} className="min-w-0 flex-1 border border-line bg-transparent px-3 py-3 font-mono text-[12px] text-mute" onFocus={(e) => e.target.select()} />
          <button onClick={copy} className="bg-ink px-6 py-3 text-[15px] font-semibold text-paper hover:bg-ink/85">Copy link</button>
        </div>
        <p className="label mt-2 h-4 text-ink" role="status" aria-live="polite">{msg}</p>
      </div>
    </section>
  )
}
