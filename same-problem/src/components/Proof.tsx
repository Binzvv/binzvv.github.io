import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { PROJECTS } from '../data'
import { prefersReducedMotion } from '../motion'

const FRAMES = 5

export function Proof() {
  const [open, setOpen] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const slide = useRef<HTMLDivElement>(null)
  const project = PROJECTS.find((p) => p.id === open)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    if (!slide.current || prefersReducedMotion()) return
    gsap.fromTo(slide.current, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' })
  }, [i, open])

  const go = (d: number) => setI((n) => (n + d + FRAMES) % FRAMES)

  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-28 sm:px-8 sm:pt-40" aria-labelledby="proof-title">
      <div className="grid gap-6 md:grid-cols-12">
        <h2 id="proof-title" className="text-4xl font-extrabold tracking-[-0.04em] md:col-span-4 sm:text-5xl">Thinking applied.</h2>
        <ul className="border-t border-line md:col-span-8">
          {PROJECTS.map((p, n) => (
            <li key={p.id} className="border-b border-line">
              <button
                onClick={() => { setI(0); setOpen(p.id) }}
                className="group grid w-full grid-cols-[2rem_1fr_auto] items-baseline gap-4 py-6 text-left"
                aria-haspopup="dialog"
              >
                <span className="label text-mute">0{n + 1}</span>
                <span>
                  <span className="block text-2xl font-bold tracking-tight sm:text-3xl">{p.title}</span>
                  <span className="mt-1 block text-[15px] text-mute">{p.line}</span>
                </span>
                <span className="label text-mute transition-transform group-hover:translate-x-1 group-hover:text-ink">View gallery →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}
        className="m-auto w-[min(1100px,calc(100vw-2rem))] max-w-none bg-paper p-0 text-ink backdrop:bg-ink/60"
        aria-labelledby="gallery-title"
      >
        {project && (
          <div className="p-4 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 id="gallery-title" className="text-2xl font-bold tracking-tight">{project.title}</h3>
                <p className="text-[14px] text-mute">{project.line}</p>
              </div>
              <button onClick={() => setOpen(null)} className="label hover:underline" autoFocus>Close</button>
            </div>
            <div ref={slide} className="mt-6 grid aspect-[16/10] place-items-center border border-line bg-ink/[0.04]">
              <div className="text-center">
                <p className="label text-mute">Image placeholder</p>
                <p className="mt-2 text-lg font-semibold">{String(i + 1).padStart(2, '0')} / {String(FRAMES).padStart(2, '0')}</p>
                <p className="mt-1 text-[13px] text-mute">Project imagery to be added.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: FRAMES }).map((_, n) => <span key={n} className={`h-1 w-6 ${n === i ? 'bg-ink' : 'bg-ink/15'}`} />)}
              </div>
              <div className="flex gap-4">
                <button onClick={() => go(-1)} className="label hover:underline" aria-label="Previous image">← Prev</button>
                <button onClick={() => go(1)} className="label hover:underline" aria-label="Next image">Next →</button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}
