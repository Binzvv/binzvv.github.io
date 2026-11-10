import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../motion'

const LINE = 'This is what happens when you stop designing in silos.'

const COMPARE = [
  ['Brand alone', 'A reason to care, but no easy way to decide.'],
  ['Product alone', 'An easy decision, but no reason to make it.'],
  ['Systems alone', 'A connected journey, carrying weak signals.'],
  ['Together', 'A reason, a decision and a next step that all say the same thing.'],
]

export function Reveal() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 3.2 })
      tl.from('[data-w]', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.045 })
        .from('[data-sub]', { opacity: 0, y: 16, duration: 0.8, ease: 'expo.out' }, '-=0.5')
        .from('[data-cmp]', { opacity: 0, y: 12, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, '-=0.4')
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-8 sm:pt-36" aria-labelledby="reveal-title">
      <h2 id="reveal-title" className="max-w-[14ch] text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-[0.92] tracking-[-0.05em]">
        {LINE.split(' ').map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
            <span data-w className="inline-block">{w}&nbsp;</span>
          </span>
        ))}
      </h2>
      <p data-sub className="mt-10 max-w-2xl text-xl leading-snug sm:text-2xl">
        I connect brand, product and systems to create experiences that make sense for people and work harder for businesses.
      </p>
      <dl className="mt-16 grid gap-px border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {COMPARE.map(([k, v], i) => (
          <div key={k} data-cmp className={`border-b border-line py-5 sm:pr-6 ${i === 3 ? 'text-ink' : ''}`}>
            <dt className={`label ${i === 3 ? 'text-ink' : 'text-mute'}`}>{k}</dt>
            <dd className={`mt-2 text-[17px] leading-snug ${i === 3 ? 'font-semibold' : 'text-mute'}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
