import { useRef, useState } from 'react'
import { ArrowUp, Copy, Check } from 'lucide-react'
import { gsap, useGSAP, EASE } from '../lib/motion'
import { contact, studio } from '../data/content'
import { useClock } from '../lib/useClock'
import { scrollToHash } from '../lib/scrollTo'
import { SplitChars } from './Split'
import Magnetic from './Magnetic'
import Blob from './Blob'

export default function Contact() {
  const root = useRef(null)
  const [copied, setCopied] = useState(false)
  const time = useClock(studio.timezone)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.contact__title', start: 'top 80%' } })
      tl.from('.contact__title .char', { yPercent: 115, rotate: 6, stagger: 0.025, duration: 1.3, ease: EASE.out })
        .from('.contact__kicker', { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from('.contact__actions > *', { autoAlpha: 0, y: 24, stagger: 0.08, duration: 1 }, 0.4)

      // Blob peeks up from the bottom edge.
      gsap.fromTo('.contact__blob', { yPercent: 75, rotate: 14 }, {
        yPercent: 0, rotate: -6, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 60%', end: 'bottom bottom', scrub: 1 },
      })
    })
  }, { scope: root })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(studio.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${studio.email}`
    }
  }

  return (
    <section ref={root} id="contact" className="contact" data-theme="dark">
      <div className="section contact__inner">
        <p className="contact__kicker mono"><span className="accent">●</span> (04) {contact.kicker}</p>
        <h2 className="contact__title">
          {contact.headline.map((l, i) => (
            <span className="mask" key={i}><SplitChars text={l} /></span>
          ))}
        </h2>

        <div className="contact__actions">
          <Magnetic strength={0.3}>
            <a className="contact__email" href={`mailto:${studio.email}`} data-cursor="hover">
              {studio.email}
            </a>
          </Magnetic>
          <button className="contact__copy mono" onClick={copy} data-copied={copied} aria-live="polite">
            <span className="contact__copy-roll">
              <span><Copy size={14} aria-hidden="true" /> Copy email</span>
              <span><Check size={14} aria-hidden="true" /> Copied</span>
            </span>
          </button>
        </div>

        <ul className="contact__socials">
          {studio.socials.map((s) => (
            <li key={s.label}><a className="ulink" href={s.href}>{s.label}</a></li>
          ))}
        </ul>
      </div>

      <footer className="footer section mono">
        <span>© {new Date().getFullYear()} {studio.name}</span>
        <span>{studio.city} — {time}</span>
        <a href="#top" onClick={(e) => scrollToHash(e, '#top')} className="footer__top">
          Back to top <ArrowUp size={14} aria-hidden="true" />
        </a>
      </footer>

      <div className="contact__blob-wrap">
        <Blob className="contact__blob" label="Poke Blob goodbye" />
      </div>
    </section>
  )
}
