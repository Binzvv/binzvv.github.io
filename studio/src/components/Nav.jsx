import { useRef, useState } from 'react'
import { gsap, useGSAP, EASE } from '../lib/motion'
import { nav, studio } from '../data/content'
import { useClock } from '../lib/useClock'
import { scrollToHash } from '../lib/scrollTo'
import Magnetic from './Magnetic'

export default function Nav() {
  const bar = useRef(null)
  const menu = useRef(null)
  const tl = useRef(null)
  const [open, setOpen] = useState(false)
  const time = useClock(studio.timezone)
  const [hh, mm] = time.split(':')

  // Intro: nav items drop in after the hero headline.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.nav > *', { yPercent: -120, autoAlpha: 0, stagger: 0.08, delay: 1.1, duration: 1.2 })
    })
  }, { scope: bar })

  // Mobile menu timeline (built once, played/reversed).
  useGSAP(() => {
    gsap.set(menu.current, { autoAlpha: 0 })
    tl.current = gsap
      .timeline({ paused: true, defaults: { ease: EASE.inOut } })
      .set(menu.current, { autoAlpha: 1 })
      .fromTo(menu.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 })
      .from('.menu__link span', { yPercent: 110, stagger: 0.06, duration: 0.9, ease: EASE.out }, '-=0.45')
      .from('.menu__foot', { autoAlpha: 0, y: 12, duration: 0.6, ease: EASE.soft }, '-=0.6')
  }, { scope: menu })

  const toggle = (next = !open) => {
    setOpen(next)
    document.documentElement.classList.toggle('menu-open', next)
    if (next) tl.current.timeScale(1).play()
    else tl.current.timeScale(1.6).reverse()
  }

  const go = (e, href) => {
    if (open) toggle(false)
    scrollToHash(e, href)
  }

  return (
    <>
      <header ref={bar} className="nav">
        <Magnetic strength={0.25}>
          <a href="#top" className="logo" onClick={(e) => go(e, '#top')} aria-label={`${studio.name} — back to top`}>
            <span className="logo__o" aria-hidden="true" />dd<span className="logo__sep">/</span>hours
          </a>
        </Magnetic>

        <nav className="nav__links" aria-label="Primary">
          {nav.map((item) => (
            <Magnetic key={item.href}>
              <a href={item.href} className="nav__link roll" onClick={(e) => go(e, item.href)}>
                <span className="roll__mask"><span className="roll__text">{item.label}</span></span>
              </a>
            </Magnetic>
          ))}
        </nav>

        <p className="nav__clock mono" aria-label={`${studio.city} time ${time}`}>
          {studio.city} {hh}<span className="blink">:</span>{mm}
        </p>

        <button className="nav__menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => toggle()}>
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span className="burger" data-open={open} aria-hidden="true"><i /><i /></span>
        </button>
      </header>

      <div ref={menu} id="mobile-menu" className="menu" aria-hidden={!open}>
        <ul>
          {nav.map((item, i) => (
            <li key={item.href}>
              <a className="menu__link" href={item.href} tabIndex={open ? 0 : -1} onClick={(e) => go(e, item.href)}>
                <span><em className="mono">0{i + 1}</em>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="menu__foot mono">
          <a href={`mailto:${studio.email}`} tabIndex={open ? 0 : -1}>{studio.email}</a>
          <span>{studio.city} {time}</span>
        </div>
      </div>
    </>
  )
}
