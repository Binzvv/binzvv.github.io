import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/motion';
import { NAV, SKY } from '../content';
import { Wordmark } from './Glass';
import { ChevronDown, Search, User } from './Icons';

// Global navigation.
// - Theme follows the section underneath it (data-nav="dark" | "light"),
//   so the bar never fights the content.
// - Desktop: hover-intent flyouts that also open on click / Enter.
// - Mobile: a full-height sheet with a short, ordered reveal.
export default function Nav() {
  const [theme, setTheme] = useState('dark');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null); // desktop flyout id
  const [sheet, setSheet] = useState(false); // mobile menu
  const headerRef = useRef(null);
  const panelRef = useRef(null);
  const sheetRef = useRef(null);
  const menuBtnRef = useRef(null);
  const timer = useRef();

  // Section-driven theme.
  useEffect(() => {
    const triggers = [...document.querySelectorAll('[data-nav]')].map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 32px',
        end: 'bottom 32px',
        onToggle: (self) => self.isActive && setTheme(el.dataset.nav),
      }),
    );
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      triggers.forEach((t) => t.kill());
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Flyout open/close: height to auto, then the links settle in order.
  const flyout = NAV.find((n) => n.id === open && n.links);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const reduce = prefersReducedMotion();
    if (flyout) {
      gsap.to(panel, { height: 'auto', duration: reduce ? 0 : 0.5, ease: EASE.settle, overwrite: true });
      gsap.fromTo(
        panel.querySelectorAll('[data-fly]'),
        { opacity: 0, y: reduce ? 0 : -6 },
        { opacity: 1, y: 0, duration: reduce ? 0 : 0.45, ease: EASE.settle, stagger: 0.03, delay: 0.05 },
      );
    } else {
      gsap.to(panel, { height: 0, duration: reduce ? 0 : 0.35, ease: EASE.glide, overwrite: true });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hoverOpen = (id) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(id), open ? 0 : 90);
  };
  const hoverClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 160);
  };

  // Escape closes whatever is open and returns focus sensibly.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (sheet) {
        setSheet(false);
        menuBtnRef.current?.focus();
      }
      if (open) {
        headerRef.current?.querySelector(`[data-top="${open}"]`)?.focus();
        setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, open]);

  // Mobile sheet.
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    document.documentElement.style.overflow = sheet ? 'hidden' : '';
    if (sheet) {
      gsap.set(el, { display: 'block' });
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.3, ease: EASE.settle });
      gsap.fromTo(
        el.querySelectorAll('[data-sheet]'),
        { opacity: 0, y: reduce ? 0 : 12 },
        { opacity: 1, y: 0, duration: reduce ? 0 : 0.6, ease: EASE.settle, stagger: 0.035, delay: 0.05 },
      );
      el.querySelector('a, button')?.focus();
    } else {
      gsap.to(el, { opacity: 0, duration: reduce ? 0 : 0.2, ease: EASE.exit, onComplete: () => gsap.set(el, { display: 'none' }) });
    }
  }, [sheet]);

  const solid = scrolled || open || sheet;
  const light = theme === 'light' || open || sheet;
  const bar = light
    ? `${open || sheet ? 'bg-flat/[0.97]' : solid ? 'bg-flat/80' : 'bg-transparent'} ${solid ? 'shadow-[0_1px_0_rgb(0_0_0/0.06)]' : ''} text-ink`
    : `${solid ? 'bg-night/70' : 'bg-transparent'} text-white on-dark`;

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 ${solid ? 'backdrop-blur-xl backdrop-saturate-150' : ''} transition-[background-color,color,box-shadow] duration-500 ease-sky ${bar}`}
        onMouseLeave={hoverClose}
      >
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-[1280px] items-center px-4 lg:h-16 lg:px-8">
          <a href="#top" className="mr-auto shrink-0 lg:mr-12" aria-label="Sky home">
            <Wordmark />
          </a>

          <ul className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.id} onMouseEnter={() => (item.links ? hoverOpen(item.id) : hoverClose())}>
                {item.links ? (
                  <button
                    type="button"
                    data-top={item.id}
                    aria-expanded={open === item.id}
                    aria-controls="nav-flyout"
                    onClick={() => setOpen(open === item.id ? null : item.id)}
                    className={`group inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-medium transition-opacity duration-300 ${
                      open && open !== item.id ? 'opacity-60' : 'opacity-100'
                    } hover:opacity-100`}
                  >
                    {item.label}
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ease-sky ${open === item.id ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className={`inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium transition-opacity duration-300 ${
                      open ? 'opacity-60' : ''
                    } hover:opacity-100`}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <a href={`${SKY}/search`} className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-opacity duration-300 hover:opacity-70" aria-label="Search Sky">
              <Search />
            </a>
            <a href={`${SKY}/signin`} className="hidden h-10 items-center gap-2 rounded-full px-3 text-[15px] font-medium lg:inline-flex">
              <User /> Sign in
            </a>
            <button
              ref={menuBtnRef}
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center lg:hidden"
              aria-expanded={sheet}
              aria-controls="nav-sheet"
              aria-label={sheet ? 'Close menu' : 'Open menu'}
              onClick={() => setSheet((s) => !s)}
            >
              <span className={`absolute h-[1.5px] w-[18px] rounded bg-current transition-transform duration-500 ease-sky ${sheet ? 'rotate-45' : '-translate-y-[4px]'}`} />
              <span className={`absolute h-[1.5px] w-[18px] rounded bg-current transition-transform duration-500 ease-sky ${sheet ? '-rotate-45' : 'translate-y-[4px]'}`} />
            </button>
          </div>
        </nav>

        {/* Desktop flyout */}
        <div id="nav-flyout" ref={panelRef} className="hidden h-0 overflow-hidden lg:block" onMouseEnter={() => clearTimeout(timer.current)}>
          {flyout && (
            <div className="mx-auto flex max-w-[1280px] gap-24 px-8 pb-12 pt-6">
              <div>
                <p data-fly className="mb-4 text-[13px] text-grey-70">Explore {flyout.label}</p>
                <ul className="space-y-2">
                  {flyout.links.map((l) => (
                    <li key={l.label} data-fly>
                      <a
                        href={l.href}
                        onClick={() => setOpen(null)}
                        className="font-headline text-[26px] font-medium leading-[36px] tracking-[-0.01em] text-ink transition-colors hover:text-primary"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p data-fly className="mb-4 text-[13px] text-grey-70">Already with Sky?</p>
                <ul className="space-y-2 text-[15px] font-medium">
                  <li data-fly><a className="hover:text-primary" href={`${SKY}/signin`}>Sign in to My Sky</a></li>
                  <li data-fly><a className="hover:text-primary" href={`${SKY}/help`}>Get help</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Dims the page while a flyout is open, keeping focus on the menu. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-40 bg-night/30 backdrop-blur-[2px] transition-opacity duration-500 ease-sky ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Mobile sheet */}
      <div id="nav-sheet" ref={sheetRef} className="fixed inset-0 z-40 hidden overflow-y-auto bg-flat px-6 pb-16 pt-24 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
        <ul className="space-y-8">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                data-sheet
                href={item.href || item.links[0].href}
                onClick={() => setSheet(false)}
                className="block font-headline text-[32px] font-medium leading-[40px] tracking-[-0.02em] text-ink"
              >
                {item.label}
              </a>
              {item.links && (
                <ul className="mt-2 space-y-1">
                  {item.links.map((l) => (
                    <li key={l.label} data-sheet>
                      <a href={l.href} onClick={() => setSheet(false)} className="block py-1 text-[17px] text-grey-70">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <a data-sheet href={`${SKY}/signin`} className="btn btn-primary mt-12 w-full">
          Sign in to My Sky
        </a>
      </div>
    </>
  );
}
