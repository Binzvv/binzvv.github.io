import './monzo.css';
import Hero from './Hero.jsx';
import Doorbell from './Doorbell.jsx';
import Sensors from './Sensors.jsx';

export default function MonzoExperience() {
  return (
    <div className="mz" id="top">
      <header className="mz-nav">
        <a className="mz-nav__brand" href="#top">
          smart home<span aria-hidden="true">.</span>
        </a>
        <nav className="mz-nav__links" aria-label="Smart Home">
          <a href="#doorbell">Doorbell</a>
          <a href="#sensors">Camera &amp; sensors</a>
          <a href="#sensors-end">Plans</a>
        </nav>
        <a className="mz-btn mz-btn--sm mz-press" href="#sensors-end">
          Get started
        </a>
      </header>

      <main id="main">
        <Hero />
        <Doorbell />
        <Sensors />
      </main>

      <footer className="mz-foot">
        <p>
          <strong>Psst — this is a design exploration.</strong> Not affiliated with or endorsed by Sky. Product details
          and prices are illustrative, referenced from public pages in October 2026. All illustrations are original
          placeholders.
        </p>
        <p>Prototype scope: hero and first two feature sections.</p>
      </footer>
    </div>
  );
}
