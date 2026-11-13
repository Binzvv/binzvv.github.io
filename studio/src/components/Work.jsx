import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, EASE } from '../lib/motion'
import { projects } from '../data/content'
import { SplitChars } from './Split'
import ProjectArt from './ProjectArt'

export default function Work() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Section heading slides in letter by letter.
      gsap.from('.work__heading .char', {
        yPercent: 110, duration: 1.3, stagger: 0.03,
        scrollTrigger: { trigger: '.work__heading', start: 'top 85%' },
      })

      gsap.utils.toArray('.project').forEach((project) => {
        const media = project.querySelector('.project__media')
        const inner = project.querySelector('.project__inner')

        // Window opens from a smaller rounded frame to full bleed.
        gsap.fromTo(media,
          { clipPath: 'inset(14% 10% 14% 10% round 28px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
            scrollTrigger: { trigger: project, start: 'top 95%', end: 'top 15%', scrub: 0.6 },
          })

        // Artwork settles from oversized and drifts in parallax.
        gsap.fromTo(inner,
          { scale: 1.35, yPercent: -8 },
          {
            scale: 1, yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true },
          })

        // Caption: title rises, meta fades.
        const tl = gsap.timeline({ scrollTrigger: { trigger: project.querySelector('.project__meta'), start: 'top 88%' } })
        tl.from(project.querySelectorAll('.project__title .char'), { yPercent: 110, stagger: 0.025, duration: 1.2, ease: EASE.out })
          .from(project.querySelectorAll('.project__info > *'), { y: 16, autoAlpha: 0, stagger: 0.06, duration: 0.9 }, 0.15)
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

      {projects.map((p) => (
        <article key={p.id} className="project">
          <a href="#work" className="project__link" data-cursor="view" data-cursor-label="View"
            onClick={(e) => e.preventDefault()} aria-label={`${p.title} — case study coming soon`}>
            <div className="project__media">
              <div className="project__inner">
                <ProjectArt art={p.art} image={p.image} title={p.title} />
              </div>
              <span className="project__placeholder mono">Placeholder visual</span>
            </div>
          </a>
          <div className="project__meta section">
            <span className="project__num mono">{p.id}</span>
            <h3 className="project__title mask"><SplitChars text={p.title} /></h3>
            <div className="project__info mono">
              <span>{p.client}</span>
              <span>{p.tags.join(' · ')}</span>
              <span>{p.year} <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
