import { useEffect } from 'react';
import { ScrollTrigger, prefersReducedMotion } from './lib/motion';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Statement from './components/Statement';
import Finishes from './components/Finishes';
import SkyOS from './components/SkyOS';
import Stream from './components/Stream';
import Channels from './components/Channels';
import Home from './components/Home';
import Closing from './components/Closing';
import ConceptBar from './components/ConceptBar';

export default function App() {
  useEffect(() => {
    // Measurements depend on the web font; re-measure once it lands.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    // In-page links glide rather than jump (instant under reduced motion).
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const el = id === 'top' ? document.body : document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const y = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded-full bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Statement />
        <Finishes />
        <SkyOS />
        <Stream />
        <Channels />
        <Home />
        <Closing />
      </main>
      <ConceptBar className="fixed bottom-4 left-4 hidden lg:flex" />
    </>
  );
}
