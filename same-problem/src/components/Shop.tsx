import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { BREWS, INTENTS, PRODUCTS, flagsFor, money } from '../data'
import type { Brew, Intent, Mode, Product } from '../data'
import { Bag, Mark } from './Bag'
import { prefersReducedMotion } from '../motion'

gsap.registerPlugin(Flip)

export type Region = 'intent' | 'promise' | 'decision' | 'behaviour'
export type Freq = 'once' | 'repeat'
export type Size = '250' | '1000'

interface Props {
  mode: Mode
  brew: Brew | null
  setBrew: (b: Brew) => void
  intent: Intent | null
  setIntent: (i: Intent) => void
  freq: Freq
  setFreq: (f: Freq) => void
  size: Size
  setSize: (s: Size) => void
  hot: Region | null
  /** Extra delay before the entrance plays (used by the connected reveal). */
  entranceDelay?: number
}

interface Line { id: string; name: string; detail: string; price: number; qty: number }

const GRINDS = ['Whole bean', 'Espresso', 'Moka pot', 'Aeropress', 'Filter', 'Chemex', 'Cafetière', 'Turkish']
const NAV_FULL = ['Shop All', 'Coffee', 'Equipment', 'Subscriptions', 'Gifts', 'Wholesale', 'About', 'Blog']
const NAV_SIMPLE = ['Coffee', 'Subscriptions', 'Our story']
const FREE_AT = 40

const sizePrice = (p: Product, s: Size) => (s === '1000' ? Math.round(p.price * 3.1) : p.price)

export function Shop(props: Props) {
  const { mode, hot, entranceDelay = 0 } = props
  const root = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<Mode>(mode)
  const [cart, setCart] = useState<Line[]>([])
  const [drawer, setDrawer] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [popup, setPopup] = useState(false)
  const first = useRef(true)

  // Exit: fade the current state out, then swap.
  useEffect(() => {
    if (mode === shown) return
    const els = root.current?.querySelectorAll('[data-a]')
    const swap = () => {
      setShown(mode)
      setCart([])
      setDrawer(false)
      setCheckout(false)
      scroller.current?.scrollTo({ top: 0 })
    }
    if (prefersReducedMotion() || !els?.length) return swap()
    const t = gsap.to(els, { opacity: 0, y: -8, duration: 0.24, ease: 'power2.in', stagger: 0.012, onComplete: swap })
    return () => { t.kill() }
  }, [mode, shown])

  // Entrance: choreograph the new state in.
  useLayoutEffect(() => {
    const els = root.current?.querySelectorAll('[data-a]')
    if (!els?.length) return
    if (first.current) { first.current = false; return }
    if (prefersReducedMotion()) { gsap.set(els, { opacity: 1, y: 0 }); return }
    const connected = shown === 'connected'
    const t = gsap.fromTo(
      els,
      { opacity: 0, y: connected ? 28 : 16 },
      { opacity: 1, y: 0, duration: connected ? 1.1 : 0.7, ease: 'expo.out', stagger: connected ? 0.09 : 0.04, delay: connected ? entranceDelay : 0 },
    )
    return () => { t.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])

  // The discount pop-up: part of the original noise.
  useEffect(() => {
    setPopup(false)
    if (shown !== 'original' && shown !== 'brand') return
    const id = window.setTimeout(() => setPopup(true), 1600)
    return () => window.clearTimeout(id)
  }, [shown])

  const f = flagsFor(shown)
  const add = (line: Omit<Line, 'qty'>) => {
    setCart((c) => {
      const hit = c.find((l) => l.id === line.id && l.detail === line.detail)
      if (hit) return c.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l))
      return [...c, { ...line, qty: 1 }]
    })
    setCheckout(false)
    setDrawer(true)
  }
  const count = cart.reduce((n, l) => n + l.qty, 0)
  const ctx = { ...props, shown, f, add, hot }

  return (
    <div ref={root} className="shop relative h-full overflow-hidden" data-theme={shown}>
      <div ref={scroller} className="shop-scroll h-full overflow-y-auto">
        <TopBar shown={shown} />
        <Header shown={shown} count={count} onCart={() => setDrawer(true)} />
        <Hero {...ctx} />
        {shown === 'systems' && <IntentBar {...ctx} />}
        {f.product ? <Decision {...ctx} /> : <Grid {...ctx} />}
        <Footer shown={shown} />
      </div>

      {popup && (
        <div data-a className="absolute bottom-4 left-4 z-20 w-60 bg-white p-4 text-[#1f2937] shadow-xl ring-1 ring-black/10" style={{ fontFamily: 'Arial, sans-serif' }} role="dialog" aria-label="Discount offer">
          <button className="absolute right-2 top-1 text-lg leading-none text-gray-500" onClick={() => setPopup(false)} aria-label="Close offer">×</button>
          <p className="text-sm font-bold">WAIT! Don’t go yet!</p>
          <p className="mt-1 text-xs">Sign up for 10% OFF your first order*</p>
          <div className="mt-2 flex gap-1"><input className="w-full border px-2 py-1 text-xs" placeholder="Email address" aria-label="Email" /><button className="bg-[#e53935] px-2 text-xs font-bold text-white" onClick={() => setPopup(false)}>GO</button></div>
          <p className="mt-1 text-[9px] text-gray-500">*Excludes subscriptions, sale items and bundles.</p>
        </div>
      )}

      <Drawer
        {...ctx}
        open={drawer}
        cart={cart}
        checkout={checkout}
        onClose={() => setDrawer(false)}
        onCheckout={() => setCheckout(true)}
        onAdd={add}
      />
    </div>
  )
}

type Ctx = Props & { shown: Mode; f: ReturnType<typeof flagsFor>; add: (l: Omit<Line, 'qty'>) => void }

/* ---------------- Regions ---------------- */

function Zone({ id, hot, on, n, children, className = '' }: { id: Region; hot: Region | null; on: boolean; n: number; children: React.ReactNode; className?: string }) {
  return (
    <section data-region={id} className={`relative ${on ? (hot === id ? 'hot' : 'hot-dim') : ''} ${className}`}>
      {on && (
        <span data-a className="pointer-events-none absolute -right-1 -top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-[#0071E3] text-[10px] font-semibold text-white" aria-hidden="true">{n}</span>
      )}
      {children}
    </section>
  )
}

function TopBar({ shown }: { shown: Mode }) {
  const txt: Record<Mode, string> = {
    original: 'FREE SHIPPING ON ORDERS OVER £40!!  |  USE CODE WELCOME10  |  NEW: SUMMER BLENDS',
    brand: 'Free delivery over £40 — good mornings shouldn’t cost extra.',
    product: 'Free delivery over £40',
    systems: `Free delivery over £${FREE_AT}. The same at basket and checkout.`,
    connected: `Roasted on Monday. At your door by Thursday. Free delivery over £${FREE_AT}.`,
  }
  const loud = shown === 'original'
  return (
    <div data-a className={`px-4 py-2 text-center text-[10px] sm:text-[11px] ${loud ? 'bg-[#ffe45c] font-bold tracking-wide text-[#1f2937]' : 'border-b s-line s-mute'}`}>
      {txt[shown]}
    </div>
  )
}

function Header({ shown, count, onCart }: { shown: Mode; count: number; onCart: () => void }) {
  const f = flagsFor(shown)
  const nav = f.product ? NAV_SIMPLE : NAV_FULL
  return (
    <header data-a className="flex items-center justify-between gap-4 border-b s-line px-4 py-3 sm:px-6">
      {f.brand ? (
        <div className="flex items-center gap-2">
          <Mark className="h-3.5 w-6" color="var(--s-accent)" />
          <span className="s-display text-lg italic tracking-tight">Northfield</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--s-accent)] text-[10px] font-bold text-white">N</span>
          <span className="text-[13px] font-bold tracking-tight">NORTHFIELD COFFEE CO.</span>
        </div>
      )}
      <nav className="hidden flex-1 justify-center gap-4 text-[11px] lg:flex" aria-label="Shop navigation">
        {nav.map((n) => <span key={n} className={f.product ? 's-mute' : ''}>{n}</span>)}
      </nav>
      <div className="flex items-center gap-3 text-[11px]">
        {!f.product && <span className="hidden sm:inline s-mute">Search</span>}
        {!f.product && <span className="hidden sm:inline s-mute">Account</span>}
        <button onClick={onCart} className="flex items-center gap-1.5 font-semibold" aria-label={`Basket, ${count} items`}>
          {f.brand ? 'Basket' : 'Cart'}
          <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${count ? 's-btn' : 's-soft'}`}>{count}</span>
        </button>
      </div>
    </header>
  )
}

function Hero(c: Ctx) {
  const { shown, f, hot } = c
  const zoneOn = f.systems

  if (shown === 'original') {
    return (
      <section className="grid gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6">
        <div>
          <p data-a className="text-[10px] font-bold tracking-widest text-[#6b7280]">WELCOME TO NORTHFIELD COFFEE CO.</p>
          <h3 data-a className="mt-2 text-2xl font-bold leading-tight sm:text-[28px]">Quality Coffee Products For All Your Coffee Needs</h3>
          <p data-a className="mt-3 text-[13px] leading-relaxed text-[#4b5563]">We offer a wide range of premium coffees, blends, single origins, equipment and accessories for every taste and budget. Shop our collection today and discover something for everyone!</p>
          <div data-a className="mt-5 flex flex-wrap gap-2">
            <button className="s-btn px-4 py-2 text-[11px] font-bold">SHOP NOW</button>
            <button className="s-ghost px-4 py-2 text-[11px] font-bold">LEARN MORE</button>
            <button className="bg-[#e53935] px-4 py-2 text-[11px] font-bold text-white" style={{ borderRadius: 4 }}>SUBSCRIBE &amp; SAVE 10%</button>
          </div>
        </div>
        <div data-a className="relative grid min-h-40 place-items-center bg-[#e5e7eb] p-6 text-center">
          <div>
            <p className="text-[10px] font-bold text-[#e53935]">LIMITED TIME ONLY</p>
            <p className="text-xl font-bold">SUMMER SALE</p>
            <p className="text-sm">UP TO 30% OFF SELECTED LINES*</p>
          </div>
          <div className="absolute bottom-2 flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-gray-600" /><i className="h-1.5 w-1.5 rounded-full bg-gray-400" /><i className="h-1.5 w-1.5 rounded-full bg-gray-400" /></div>
          <span className="absolute left-2 top-1/2 text-gray-500">‹</span><span className="absolute right-2 top-1/2 text-gray-500">›</span>
        </div>
      </section>
    )
  }

  if (shown === 'product') {
    return (
      <section className="px-4 pb-4 pt-8 sm:px-6">
        <h3 data-a className="text-2xl font-semibold tracking-tight sm:text-[28px]">Quality coffee, delivered.</h3>
        <p data-a className="mt-2 max-w-md text-[13px] s-mute">Find the right coffee for how you brew. Two questions, one recommendation.</p>
      </section>
    )
  }

  if (shown === 'systems') {
    return (
      <Zone id="promise" hot={hot} on={zoneOn} n={2} className="mx-4 mt-6 sm:mx-6">
        <div className="py-2">
          <p data-a className="text-[10px] font-semibold tracking-widest s-mute">NORTHFIELD COFFEE CO.</p>
          <h3 data-a className="mt-2 text-2xl font-semibold leading-tight sm:text-[28px]">Quality coffee products for all your coffee needs</h3>
          <p data-a className="mt-2 max-w-lg text-[13px] s-mute">A wide range of coffees for every taste and budget.</p>
        </div>
      </Zone>
    )
  }

  // brand + connected share the proposition.
  const connected = shown === 'connected'
  return (
    <Zone id="promise" hot={hot} on={zoneOn} n={2} className={connected ? 'mx-4 mt-6 sm:mx-6' : ''}>
      <div className={`grid items-end gap-6 ${connected ? 'pb-2 pt-4' : 'px-4 py-10 sm:px-6'} sm:grid-cols-[1.3fr_1fr]`}>
        <div>
          <p data-a className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] s-mute"><Mark className="h-2.5 w-4" color="var(--s-accent)" /> Small-batch roasters</p>
          <h3 data-a className="s-display mt-4 text-[34px] font-light leading-[0.98] tracking-[-0.02em] sm:text-[52px]">
            Coffee for the<br /><em className="text-[var(--s-accent)]">first quiet hour.</em>
          </h3>
          <p data-a className="mt-4 max-w-sm text-[13px] leading-relaxed s-mute">
            We roast for people who protect their mornings. Before the inbox, before the noise — a cup worth getting up for.
          </p>
          {!connected && (
            <div data-a className="mt-6 flex gap-4 text-[12px]">
              <button className="s-btn px-5 py-2.5">Shop the roasts</button>
              <button className="underline underline-offset-4">Read our story</button>
            </div>
          )}
        </div>
        {!connected && (
          <div data-a className="relative hidden h-48 sm:block" aria-hidden="true">
            <div className="absolute bottom-0 right-6 h-32 w-32 rounded-t-full bg-[var(--s-accent)] opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--s-ink)]" />
            <Bag color="#3F4A36" label="Small Hours" branded className="absolute bottom-0 left-4 h-36" />
            <Bag color="#B4462B" label="First Light" branded className="absolute bottom-0 left-28 h-28" />
          </div>
        )}
      </div>
      {connected && <BrewQuestion {...c} />}
    </Zone>
  )
}

function BrewQuestion(c: Ctx) {
  const { brew, setBrew, hot, f } = c
  return (
    <Zone id="intent" hot={hot} on={f.systems} n={1} className="mt-6">
      <fieldset data-a>
        <legend className="s-display text-lg italic">How does your first hour start?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {BREWS.map((b) => (
            <label key={b.id} className={`flex cursor-pointer items-center gap-3 border px-3 py-3 text-[13px] ${brew === b.id ? 'border-[var(--s-ink)] bg-[var(--s-ink)] text-[var(--s-bg)]' : 's-line hover:border-[var(--s-ink)]'}`} style={{ borderRadius: 2 }}>
              <input type="radio" name="brew-c" className="sr-only" checked={brew === b.id} onChange={() => setBrew(b.id)} />
              <span className={`h-2.5 w-2.5 rounded-full border ${brew === b.id ? 'border-[var(--s-bg)] bg-[var(--s-accent)]' : 'border-current'}`} />
              {b.brandLabel}
            </label>
          ))}
        </div>
      </fieldset>
    </Zone>
  )
}

function IntentBar(c: Ctx) {
  const { intent, hot } = c
  return (
    <Zone id="intent" hot={hot} on n={1} className="mx-4 mt-5 sm:mx-6">
      <fieldset data-a className="flex flex-wrap items-center gap-2 border s-line s-soft px-3 py-3" style={{ borderRadius: 8 }}>
        <legend className="sr-only">What brings you here today?</legend>
        <span className="mr-1 text-[12px] font-semibold">What brings you here today?</span>
        {INTENTS.map((i) => (
          <label key={i.id} className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] ${intent === i.id ? 'border-[var(--s-accent)] bg-[var(--s-accent)] text-white' : 's-line bg-white'}`}>
            <input type="radio" name="intent" className="sr-only" checked={intent === i.id} onChange={() => c.setIntent(i.id)} />
            {i.label}
          </label>
        ))}
      </fieldset>
    </Zone>
  )
}

/* ---------------- Grid: many choices ---------------- */

function Grid(c: Ctx) {
  const { shown, f, intent, hot, add } = c
  const [sort, setSort] = useState('featured')
  const gridRef = useRef<HTMLDivElement>(null)
  const flip = useRef<Flip.FlipState | null>(null)
  const lastIntent = useRef(intent)

  if (lastIntent.current !== intent && gridRef.current && !flip.current) {
    // Capture positions before React re-orders the cards.
    flip.current = Flip.getState(gridRef.current.querySelectorAll('[data-card]'))
  }
  lastIntent.current = intent

  useLayoutEffect(() => {
    if (!flip.current) return
    if (!prefersReducedMotion()) Flip.from(flip.current, { duration: 0.7, ease: 'expo.inOut', stagger: 0.02 })
    flip.current = null
  }, [intent])

  let list = [...PRODUCTS]
  if (sort === 'low') list.sort((a, b) => a.price - b.price)
  if (sort === 'high') list.sort((a, b) => b.price - a.price)
  const systems = shown === 'systems'
  if (systems && intent) list = [...list.filter((p) => p.intents.includes(intent)), ...list.filter((p) => !p.intents.includes(intent))]

  return (
    <Zone id="decision" hot={hot} on={f.systems} n={3} className="mx-4 mt-6 pb-8 sm:mx-6">
      <div data-a className="flex flex-wrap items-center justify-between gap-2 border-b s-line pb-3 text-[11px]">
        <span className={f.brand ? 's-display text-base italic' : 'font-bold'}>{f.brand ? 'The roasts' : 'ALL PRODUCTS'} <span className="s-mute">({PRODUCTS.length})</span></span>
        <div className="flex flex-wrap gap-2 s-mute">
          {!systems && ['Roast', 'Origin', 'Process', 'Price'].map((x) => <span key={x} className="s-ghost hidden px-2 py-1 sm:inline">{x} ▾</span>)}
          <label className="s-ghost flex items-center gap-1 px-2 py-1">Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent" aria-label="Sort products">
              <option value="featured">Featured</option><option value="low">Price: low–high</option><option value="high">Price: high–low</option>
            </select>
          </label>
        </div>
      </div>
      {systems && intent && (
        <p data-a className="mt-3 text-[12px] s-mute" aria-live="polite">Showing what fits “{INTENTS.find((i) => i.id === intent)?.label.toLowerCase()}” first. All {PRODUCTS.length} still available.</p>
      )}
      <div ref={gridRef} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <Card key={p.id} p={p} shown={shown} match={!!(systems && intent && p.intents.includes(intent))} dim={!!(systems && intent && !p.intents.includes(intent))} onAdd={add} />
        ))}
      </div>
    </Zone>
  )
}

function Card({ p, shown, match, dim, onAdd }: { p: Product; shown: Mode; match: boolean; dim: boolean; onAdd: Ctx['add'] }) {
  const [grind, setGrind] = useState('')
  const [err, setErr] = useState(false)
  const branded = shown === 'brand'
  const loud = shown === 'original'
  const go = () => {
    if (!grind && p.id !== 'gift') { setErr(true); return }
    onAdd({ id: p.id, name: branded ? p.brandName : p.name, detail: p.id === 'gift' ? 'Digital card' : grind, price: p.price })
  }
  return (
    <article data-card data-a className={`flex flex-col transition-opacity duration-500 ${dim ? 'opacity-40' : ''}`}>
      <div className={`relative grid aspect-[4/4.2] place-items-center ${branded ? 's-soft' : 'bg-[#f3f4f6]'} ${match ? 'ring-2 ring-[var(--s-accent)]' : ''}`} style={{ borderRadius: 'var(--s-radius)' }}>
        <Bag color={p.bag} label={branded ? p.brandName : p.code} branded={branded} className="h-[72%]" />
        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          {(loud ? p.tags : p.tags.slice(0, 1)).map((t) => (
            <span key={t} className={`px-1.5 py-0.5 text-[8px] font-bold ${loud ? (t.includes('%') || t === 'SALE' ? 'bg-[#e53935] text-white' : 'bg-[#111827] text-white') : branded ? 'bg-[var(--s-bg)] font-medium tracking-widest' : 'bg-white'}`}>{t}</span>
          ))}
          {match && <span className="bg-[var(--s-accent)] px-1.5 py-0.5 text-[8px] font-bold text-white">MATCH</span>}
        </div>
        {loud && <span className="absolute right-2 top-1.5 text-sm text-gray-400" aria-hidden="true">♡</span>}
      </div>
      <div className="mt-2 flex flex-1 flex-col">
        {branded ? (
          <>
            <h4 className="s-display text-[15px] italic leading-tight">{p.brandName}</h4>
            <p className="mt-0.5 text-[10px] leading-snug s-mute">{p.brandNote}</p>
            <p className="mt-0.5 font-mono text-[8px] s-mute">{p.code}</p>
          </>
        ) : (
          <h4 className={`text-[12px] leading-tight ${loud ? 'font-bold' : 'font-semibold'}`}>{p.name}</h4>
        )}
        <p className="mt-1 text-[12px]">
          {p.priceNote && <span className="s-mute">{p.priceNote} </span>}
          {money(p.price)}
          {loud && p.tags.some((t) => t.includes('%')) && <s className="ml-1 text-[10px] text-gray-400">{money(Math.round(p.price * 1.15))}</s>}
        </p>
        {p.id !== 'gift' && (
          <select
            value={grind}
            onChange={(e) => { setGrind(e.target.value); setErr(false) }}
            className={`mt-2 w-full border bg-transparent px-1.5 py-1 text-[10px] ${err ? 'border-[#e53935]' : 's-line'}`}
            style={{ borderRadius: 'var(--s-radius)' }}
            aria-label={`Grind for ${p.name}`}
            aria-invalid={err}
          >
            <option value="">{branded ? 'Choose a grind…' : 'Select grind *'}</option>
            {GRINDS.map((g) => <option key={g}>{g}</option>)}
          </select>
        )}
        {err && <p className="mt-1 text-[10px] text-[#e53935]" role="alert">{branded ? 'Pick a grind first.' : 'Please select an option.'}</p>}
        <div className="mt-auto flex gap-1 pt-2">
          <button onClick={go} className="s-btn flex-1 px-2 py-1.5 text-[10px] font-semibold">{loud ? 'ADD TO CART' : 'Add to basket'}</button>
          {loud && <button className="s-ghost px-2 py-1.5 text-[10px]">QUICK VIEW</button>}
          {branded && <button className="s-ghost px-2 py-1.5 text-[10px]">Details</button>}
        </div>
      </div>
    </article>
  )
}

/* ---------------- Decision: product thinking ---------------- */

function Decision(c: Ctx) {
  const { shown, brew, setBrew, size, setSize, freq, setFreq, hot, add, f } = c
  const connected = shown === 'connected'
  const b = BREWS.find((x) => x.id === brew)
  const p = b ? PRODUCTS.find((x) => x.id === b.productId)! : null
  const [all, setAll] = useState(false)
  const result = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!result.current || prefersReducedMotion()) return
    gsap.fromTo(result.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
  }, [brew, size, freq])

  const price = p ? sizePrice(p, size) : 0
  const option = (active: boolean) =>
    connected
      ? `border px-3 py-2.5 text-[13px] ${active ? 'border-[var(--s-ink)] bg-[var(--s-ink)] text-[var(--s-bg)]' : 's-line hover:border-[var(--s-ink)]'}`
      : `border px-3 py-3 text-[13px] text-left ${active ? 'border-[var(--s-accent)] bg-[#eef2ff] font-semibold' : 's-line bg-white hover:border-gray-400'}`

  return (
    <div className="px-4 pb-10 sm:px-6">
      {!connected && (
        <fieldset data-a className="mt-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wider s-mute">Step 1 of 2 — How do you brew?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {BREWS.map((x) => (
              <label key={x.id} className={`cursor-pointer ${option(brew === x.id)}`} style={{ borderRadius: 'var(--s-radius)' }}>
                <input type="radio" name="brew-p" className="sr-only" checked={brew === x.id} onChange={() => setBrew(x.id)} />
                {x.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Zone id="decision" hot={hot} on={f.systems} n={3} className={connected ? 'mt-8' : 'mt-6'}>
        <div data-a>
          {!p ? (
            <p className={`border border-dashed s-line px-4 py-8 text-center text-[13px] s-mute ${connected ? 's-display italic' : ''}`}>
              {connected ? 'Tell us how you brew, and we’ll choose the roast.' : 'Choose how you brew to see your coffee.'}
            </p>
          ) : (
            <div ref={result} className={`grid gap-5 ${connected ? 'sm:grid-cols-[180px_1fr]' : 'border s-line bg-white p-4 sm:grid-cols-[120px_1fr]'}`} style={{ borderRadius: 'var(--s-radius)' }}>
              <div className={`grid place-items-center ${connected ? 's-soft py-4' : 'bg-[#f3f4f6] py-3'}`} style={{ borderRadius: 'var(--s-radius)' }}>
                <Bag color={p.bag} label={connected ? p.brandName : p.code} branded={connected} className={connected ? 'h-40' : 'h-24'} />
              </div>
              <div className="flex flex-col">
                {connected ? (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.2em] s-mute">Chosen for your mornings</p>
                    <h4 className="s-display mt-1 text-[30px] font-light italic leading-none">{p.brandName}</h4>
                    <p className="mt-2 text-[13px] s-mute">{p.brandNote} Ground {b!.grind.split(',')[0].toLowerCase()}, for your {b!.id === 'cafetiere' ? 'cafetière' : b!.id === 'filter' ? 'pour-over' : 'espresso'}.</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--s-accent)]">Recommended for you</p>
                    <h4 className="mt-1 text-lg font-semibold">{p.name.replace(/ 250g| 1kg/, '')}</h4>
                    <p className="text-[12px] s-mute">Grind: {b!.grind}</p>
                  </>
                )}

                <fieldset className="mt-4">
                  <legend className={`text-[11px] ${connected ? 's-mute' : 'font-semibold uppercase tracking-wider s-mute'}`}>{connected ? 'How much?' : 'Step 2 of 2 — How much?'}</legend>
                  <div className="mt-1.5 flex gap-2">
                    {(['250', '1000'] as Size[]).map((s) => (
                      <label key={s} className={`cursor-pointer ${option(size === s)} !py-1.5`} style={{ borderRadius: 'var(--s-radius)' }}>
                        <input type="radio" name={`size-${shown}`} className="sr-only" checked={size === s} onChange={() => setSize(s)} />
                        {s === '250' ? '250g' : '1kg'} · {money(sizePrice(p, s))}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {connected && (
                  <Zone id="behaviour" hot={hot} on n={4} className="mt-4">
                    <fieldset>
                      <legend className="text-[11px] s-mute">When should the next bag arrive?</legend>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {([['repeat', 'Before I run out — every 3 weeks'], ['once', 'Just this once']] as [Freq, string][]).map(([k, l]) => (
                          <label key={k} className={`cursor-pointer ${option(freq === k)} !py-1.5`} style={{ borderRadius: 2 }}>
                            <input type="radio" name="freq" className="sr-only" checked={freq === k} onChange={() => setFreq(k)} />
                            {l}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </Zone>
                )}

                <button
                  onClick={() => add({ id: p.id, name: connected ? p.brandName : p.name.replace(/ 250g| 1kg/, ''), detail: `${size === '250' ? '250g' : '1kg'} · ${b!.grind}${connected && freq === 'repeat' ? ' · every 3 weeks' : ''}`, price })}
                  className={`s-btn mt-5 px-5 py-3 text-[13px] font-semibold ${connected ? 'self-start' : 'w-full sm:w-auto sm:self-start'}`}
                >
                  {connected ? (freq === 'repeat' ? `Start my mornings — ${money(price)}` : `Add to basket — ${money(price)}`) : `Add to basket — ${money(price)}`}
                </button>
                <p className="mt-2 text-[11px] s-mute">
                  {connected ? `Free delivery over £${FREE_AT}. ${freq === 'repeat' ? 'Pause, skip or change any time.' : 'Roasted Monday, with you by Thursday.'}` : 'Delivery calculated at checkout.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Zone>

      {!connected && (
        <div data-a className="mt-6 text-[12px]">
          <button className="underline underline-offset-4 s-mute" onClick={() => setAll((a) => !a)} aria-expanded={all}>
            {all ? 'Hide' : 'Not sure? Compare all'} {PRODUCTS.length} coffees
          </button>
          {all && (
            <ul className="mt-3 divide-y border-y s-line">
              {PRODUCTS.map((x) => (
                <li key={x.id} className="flex justify-between py-2"><span>{x.name}</span><span className="s-mute">{money(x.price)}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- Footer ---------------- */

function Footer({ shown }: { shown: Mode }) {
  if (shown === 'original' || shown === 'brand') {
    const b = shown === 'brand'
    return (
      <footer data-a className="mt-4 grid gap-4 border-t s-line px-4 py-6 text-[11px] sm:grid-cols-3 sm:px-6">
        <div><p className="font-bold">{b ? 'Join the early risers' : 'SIGN UP FOR NEWS, OFFERS & MORE!'}</p><p className="s-mute">{b ? 'Letters from the roastery, now and then.' : 'Get 10% off your first order.'}</p></div>
        <div><p className="font-bold">{b ? 'Delivery' : 'DELIVERY INFO'}</p><p className="s-mute">{b ? 'Free when you spend £50 or more.' : 'Free delivery when you spend £50+. T&Cs apply.'}</p></div>
        <div><p className="font-bold">{b ? 'Wholesale' : 'TRADE ACCOUNTS'}</p><p className="s-mute">{b ? 'Pouring Northfield at your café.' : 'Wholesale enquiries welcome.'}</p></div>
      </footer>
    )
  }
  return (
    <footer data-a className="border-t s-line px-4 py-5 text-[11px] s-mute sm:px-6">
      {shown === 'connected' ? 'Northfield — roasted for the first quiet hour.' : 'Northfield Coffee Co.'}
    </footer>
  )
}

/* ---------------- Basket ---------------- */

function Drawer(c: Ctx & { open: boolean; cart: Line[]; checkout: boolean; onClose: () => void; onCheckout: () => void; onAdd: Ctx['add'] }) {
  const { open, cart, shown, onClose, onCheckout, checkout, intent, hot, f, brew, freq } = c
  const panel = useRef<HTMLDivElement>(null)
  const opened = useRef(false)
  const [extra, setExtra] = useState(false)
  const total = cart.reduce((n, l) => n + l.price * l.qty, 0)
  const brand = f.brand

  useLayoutEffect(() => {
    if (!panel.current) return
    const d = prefersReducedMotion() || !opened.current ? 0 : 0.5
    if (open) opened.current = true
    gsap.to(panel.current, { xPercent: open ? 0 : 105, duration: open && d === 0 && !prefersReducedMotion() ? 0.5 : d, ease: 'expo.out' })
  }, [open])
  useEffect(() => { setExtra(false) }, [shown])
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!wrap.current) return
    if (open) wrap.current.removeAttribute('inert')
    else wrap.current.setAttribute('inert', '')
  }, [open])

  const shipping = () => {
    if (shown === 'systems' || shown === 'connected') {
      return total >= FREE_AT ? 'Free delivery included.' : `${money(FREE_AT - total)} from free delivery (over £${FREE_AT}).`
    }
    return brand ? 'Spend £50 and delivery’s on us.' : 'Spend £50+ for FREE delivery! Shipping calculated at checkout.'
  }

  const brewWord = brew === 'cafetiere' ? 'cafetière' : brew === 'filter' ? 'pour-over' : 'espresso'
  const body = (
    <>
      {cart.length === 0 ? (
        <p className="py-6 text-[13px] s-mute">{brand ? 'Nothing here yet. The kettle can wait.' : 'Your cart is empty.'}</p>
      ) : (
        <ul className="divide-y s-line">
          {cart.map((l) => (
            <li key={l.id + l.detail} className="flex justify-between gap-3 py-3 text-[12px]">
              <div><p className={brand ? 's-display text-[15px] italic' : 'font-semibold'}>{l.name}</p><p className="s-mute">{l.detail} · Qty {l.qty}</p></div>
              <p>{money(l.price * l.qty)}</p>
            </li>
          ))}
        </ul>
      )}
      {cart.length > 0 && (
        <div className="mt-2 flex justify-between border-t s-line pt-3 text-[13px] font-semibold"><span>Subtotal</span><span>{money(total)}</span></div>
      )}
      {cart.length > 0 && <p className={`mt-1 text-[11px] ${shown === 'original' ? 'font-bold text-[#e53935]' : 's-mute'}`}>{shipping()}</p>}
    </>
  )

  let next: React.ReactNode = null
  if (cart.length) {
    if (shown === 'original' || shown === 'brand') {
      next = (
        <>
          <div className="mt-4 grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
            <button className="s-ghost px-1 py-2" onClick={onClose}>{brand ? 'Keep looking' : 'CONTINUE SHOPPING'}</button>
            <button className="s-ghost px-1 py-2">{brand ? 'View basket' : 'VIEW CART'}</button>
            <button className="s-btn px-1 py-2" onClick={onCheckout}>{brand ? 'Checkout' : 'CHECKOUT'}</button>
          </div>
          <p className={`mt-5 text-[11px] ${brand ? 's-display text-sm italic' : 'font-bold'}`}>{brand ? 'Pairs well with' : 'YOU MAY ALSO LIKE'}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRODUCTS.slice(3, 6).map((p) => (
              <div key={p.id} className="text-[10px]"><div className={`grid aspect-square place-items-center ${brand ? 's-soft' : 'bg-[#f3f4f6]'}`}><Bag color={p.bag} label={brand ? p.brandName : p.code} branded={brand} className="h-3/4" /></div><p className="mt-1 leading-tight">{brand ? p.brandName : p.name}</p></div>
            ))}
          </div>
        </>
      )
    } else if (shown === 'product') {
      next = (
        <>
          <button className="s-btn mt-4 w-full py-3 text-[13px] font-semibold" onClick={onCheckout}>Checkout — {money(total)}</button>
          <button className="mt-2 w-full py-1 text-[12px] underline underline-offset-4 s-mute" onClick={onClose}>Keep browsing</button>
        </>
      )
    } else if (shown === 'systems') {
      const suggest =
        intent === 'gift' ? { q: 'Buying for someone? Add a gift note and hide prices on the receipt.', a: 'Add gift note' }
        : intent === 'new' ? { q: 'Trying something new? Add the sampler to compare three roasts side by side.', a: 'Add the sampler' }
        : { q: 'Your everyday coffee? Repeat this order every 3 weeks so it arrives before you run out.', a: 'Make it a repeat order' }
      next = (
        <Zone id="behaviour" hot={hot} on n={4} className="mt-4">
          <div className="border s-line s-soft p-3 text-[12px]" style={{ borderRadius: 8 }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider s-mute">{intent ? 'Because you told us' : 'Tell us what brings you here for a smarter next step'}</p>
            {intent && <p className="mt-1">{suggest.q}</p>}
            {intent && (
              <label className="mt-2 flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} /> {suggest.a}
              </label>
            )}
          </div>
          <button className="s-btn mt-3 w-full py-3 text-[13px] font-semibold" onClick={onCheckout}>Checkout — {money(total)}</button>
        </Zone>
      )
    } else {
      next = (
        <div className="mt-4">
          <div className="border-l-2 border-[var(--s-accent)] pl-3 text-[12px] leading-relaxed">
            <p className="s-mute">You told us you start with {brewWord === 'espresso' ? 'an espresso' : `a ${brewWord}`}.</p>
            <p className="s-mute">So we’ll grind it {BREWS.find((x) => x.id === brew)?.grind.split(',')[0].toLowerCase() ?? 'to suit'}, roast it on Monday,</p>
            <p>{freq === 'repeat' ? 'and send the next bag every 3 weeks — before you run out.' : 'and have it with you by Thursday.'}</p>
          </div>
          <button className="s-btn mt-5 w-full py-3 text-[13px] font-semibold" onClick={onCheckout}>{freq === 'repeat' ? 'Confirm my mornings' : 'Continue to checkout'} — {money(total)}</button>
          <p className="mt-2 text-center text-[11px] s-mute">{freq === 'repeat' ? 'Pause, skip or change any time. No commitment.' : 'Free delivery over £40.'}</p>
        </div>
      )
    }
  }

  return (
    <div ref={wrap} className={`absolute inset-0 z-30 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/25 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div ref={panel} className="absolute bottom-0 right-0 top-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-[var(--s-bg)] p-5 shadow-2xl" role="dialog" aria-label="Basket" aria-modal="false">
        <div className="flex items-center justify-between border-b s-line pb-3">
          <p className={brand ? 's-display text-xl italic' : 'text-[13px] font-bold'}>
            {checkout ? (brand ? 'Thank you.' : 'Checkout') : shown === 'connected' && cart.length ? 'Your mornings, sorted.' : brand ? (cart.length ? 'Lovely choice.' : 'Your basket') : shown === 'original' ? 'YOUR CART' : 'Basket'}
          </p>
          <button onClick={onClose} className="text-[12px] s-mute" aria-label="Close basket">Close</button>
        </div>
        {checkout ? (
          <div className="py-6 text-[13px]">
            <p className="font-semibold">This is where the prototype ends.</p>
            <p className="mt-1 s-mute">Nothing is charged, nothing is stored. Switch lens and try the same journey again.</p>
          </div>
        ) : (
          <>{body}{next}</>
        )}
      </div>
    </div>
  )
}
