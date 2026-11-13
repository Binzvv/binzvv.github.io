import { Fragment, useRef } from 'react'
import { gsap, useGSAP, EASE } from '../lib/motion'
import { projects, interruptions } from '../data/content'
import { SplitChars } from './Split'
import ImageSlot from './ImageSlot'
import Interrupt from './Interrupt'

// How each layout enters: where its image window opens from, and which way its title drifts.
const MOTION = {
  cover: { clip: 'inset(14% 10% 14% 10%)', drift: [6, -10] },
  split: { clip: 'inset(0% 0% 0% 100%)', drift: [-8, 4] },
  column: { clip: 'inset(100% 0% 0% 0%)', drift: [10, -2] },
  poster: { clip: 'inset(50% 50% 50% 50%)', drift: [-4, 4] },
}

export default function Work() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.work__heading .char', {
        yPercent: 110, duration: 1.3, stagger: 0.03,
        scrollTrigger: { trigger: '.work__heading', start: 'top 85%' },
      })

      gsap.utils.toArray('.pj').forEach((pj) => {
        const m = MOTION[pj.dataset.layout] || MOTION.cover
        const media = pj.querySelector('.pj__media')
        const plx = pj.querySelector('.pj__parallax')

        // Image window opens in this layout's own direction.
        gsap.fromTo(media, { clipPath: m.clip }, {
          clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
          scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 30%', scrub: 0.6 },
        })
        gsap.fromTo(plx, { scale: 1.3, yPercent: -7 }, {
          scale: 1, yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: pj, start: 'top bottom', end: 'bottom top', scrub: true },
        })

        // Title drifts sideways against the scroll — alternating direction per spread.
        gsap.fromTo(pj.querySelectorAll('.pj__title-move'), { xPercent: m.drift[0] }, {
          xPercent: m.drift[1], ease: 'none',
          scrollTrigger: { trigger: pj, start: 'top bottom', end: 'bottom top', scrub: 1 },
        })

        // Title arrives with a motion-blur smear, then details settle.
        const tl = gsap.timeline({ scrollTrigger: { trigger: pj.querySelector('.pj__title'), start: 'top 85%' } })
        tl.from(pj.querySelectorAll('.pj__title .char'), {
          yPercent: 110, skewY: 7, stagger: 0.022, duration: 1.2, ease: EASE.out,
        })
          .fromTo(pj.querySelector('.pj__title'), { filter: 'blur(14px)' }, { filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', clearProps: 'filter' }, 0)
          .from(pj.querySelectorAll('.pj__fade'), { y: 18, autoAlpha: 0, stagger: 0.07, duration: 0.9 }, 0.2)
      })
    })
  }, { scope: root })

  return (
    <section ref={root} id="work" className="work" data-theme="dark">
      <header className="work__head section">
        <p className="mono"><span className="accent">●</span> (02) Selected work</p>
        <h2 className="work__heading">
          <span className="mask"><SplitChars text="Selected" /></span>
          <span className="mask"><SplitChars text="work" /><sup className="mono">({String(projects.length).padStart(2, '0')})</sup></span>
        </h2>
      </header>

      {projects.map((p, i) => {
        const interrupt = interruptions.find((x) => x.after === i)
        return (
          <Fragment key={p.id}>
            <article className="pj" data-layout={p.layout} data-palette={p.palette}>
              <div className="pj__grid section">
                <p className="pj__issue mono pj__fade">
                  <span>No.{p.id}</span><span>{p.tags.join(' / ')}</span>
                </p>

                <a href="#work" className="pj__media" data-cursor="view" data-cursor-label={p.cursor}
                  onClick={(e) => e.preventDefault()} aria-label={`${p.title} — case study coming soon`}>
                  <div className="pj__parallax"><ImageSlot project={p} /></div>
                </a>

                <h3 className="pj__title" aria-label={p.title}>
                  {p.title.split(' ').map((w) => (
                    <span className="mask" key={w} aria-hidden="true">
                      <span className="pj__title-move" data-text={w}><SplitChars text={w} /></span>
                    </span>
                  ))}
                </h3>

                <p className="pj__kicker serif pj__fade">{p.kicker}</p>

                <dl className="pj__meta mono pj__fade">
                  <div><dt>Client</dt><dd>{p.client}</dd></div>
                  <div><dt>Scope</dt><dd>{p.tags.join(', ')}</dd></div>
                  <div><dt>Year</dt><dd>{p.year}</dd></div>
                </dl>
              </div>
            </article>
            {interrupt && <Interrupt {...interrupt} />}
          </Fragment>
        )
      })}
    </section>
  )
}
