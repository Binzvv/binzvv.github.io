import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { BREWS, INTENTS, PRODUCTS } from '../data'
import type { Brew, Intent, Mode } from '../data'
import type { Freq, Region, Size } from './Shop'
import { prefersReducedMotion } from '../motion'

interface Props { mode: Mode; brew: Brew | null; intent: Intent | null; freq: Freq; size: Size; setHot: (r: Region | null) => void }

interface Node { id: Region; label: string; value: string; note: string; strong: boolean }

export function Thread({ mode, brew, intent, freq, size, setHot }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const connected = mode === 'connected'

  const b = BREWS.find((x) => x.id === brew)
  const p = b ? PRODUCTS.find((x) => x.id === b.productId) : null
  const nodes: Node[] = connected
    ? [
        { id: 'intent', label: 'Customer intent', value: b ? b.brandLabel : 'Waiting for an answer', note: 'Asked once, in the brand’s own words.', strong: !!b },
        { id: 'promise', label: 'Brand promise', value: 'The first quiet hour', note: 'A reason to care that every step can echo.', strong: true },
        { id: 'decision', label: 'Product decision', value: p ? `${p.brandName} · ${size === '250' ? '250g' : '1kg'} · ${b!.grind.split(',')[0].toLowerCase()}` : 'One roast, chosen for you', note: 'Nine options become one considered choice.', strong: !!p },
        { id: 'behaviour', label: 'Experience behaviour', value: freq === 'repeat' ? 'Every 3 weeks, before you run out' : 'Once, at your door by Thursday', note: 'The basket remembers why you came.', strong: !!b },
      ]
    : [
        { id: 'intent', label: 'Customer intent', value: intent ? INTENTS.find((i) => i.id === intent)!.label : 'Not chosen yet', note: 'Captured once, then carried forward.', strong: !!intent },
        { id: 'promise', label: 'Brand promise', value: '“Quality coffee products”', note: 'Generic. There is nothing distinct to carry.', strong: false },
        { id: 'decision', label: 'Product decision', value: intent ? 'Nine options, re-ordered' : 'Nine options', note: 'Filtered, but still not decided.', strong: false },
        { id: 'behaviour', label: 'Experience behaviour', value: intent ? 'Basket adapts to intent' : 'Basket waits for intent', note: 'Messaging is consistent end to end.', strong: !!intent },
      ]

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-seg]', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut', stagger: 0.18, delay: connected ? 2.6 : 0.3, transformOrigin: 'left center' })
      gsap.fromTo('[data-node]', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.12, delay: connected ? 2.5 : 0.2 })
    }, root)
    return () => ctx.revert()
  }, [mode, connected])

  return (
    <div ref={root} className="mt-10 rounded-[28px] bg-paper p-6 sm:p-8" aria-label="How the experience connects">
      <div className="flex items-baseline justify-between gap-4">
        <p className="label text-mute">The thread — {connected ? 'fully connected' : 'connected, carrying weak signals'}</p>
        <p className="label hidden text-mute sm:block">Hover a step to find it on the page</p>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-0">
        {nodes.map((n, i) => {
          const next = nodes[i + 1]
          const linked = next && n.strong && next.strong
          return (
            <li
              key={n.id}
              data-node
              className="relative lg:pr-6"
              tabIndex={0}
              onMouseEnter={() => setHot(n.id)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(n.id)}
              onBlur={() => setHot(null)}
            >
              <div className="relative flex h-3 items-center">
                <span className={`relative z-10 h-3 w-3 rounded-full border-[1.5px] border-link ${n.strong ? 'bg-link' : 'bg-paper'}`} />
                {next && (
                  <span
                    data-seg
                    aria-hidden="true"
                    className={`absolute left-3 right-0 top-1/2 hidden -translate-y-1/2 border-t-[1.5px] lg:block ${linked ? 'border-link' : 'border-dashed border-ink/25'}`}
                  />
                )}
              </div>
              <p className="label mt-4 text-mute">{n.label}</p>
              <p className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight">{n.value}</p>
              <p className="mt-1 text-[13px] leading-snug text-mute">{n.note}</p>
              <p className={`label mt-2 ${n.strong ? 'text-link' : 'text-mute'}`}>{n.strong ? 'Carried' : 'Weak signal'}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
