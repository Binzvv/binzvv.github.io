import './apple.css';
import Hero from './Hero.jsx';
import Doorbell from './Doorbell.jsx';
import Indoor from './Indoor.jsx';

export default function AppleExperience() {
  return (
    <div className="ap" id="top">
      <header className="ap-nav">
        <div className="ap-nav__inner">
          <a className="ap-nav__brand" href="#top">
            Smart Home
          </a>
          <nav className="ap-nav__links" aria-label="Smart Home">
            <a href="#doorbell">Doorbell</a>
            <a href="#indoor">Indoor Camera</a>
            <a href="#sensors">Sensors</a>
            <a href="#plans">Plans</a>
          </nav>
          <a className="ap-nav__cta" href="#plans">
            Shop
          </a>
        </div>
      </header>

      <main id="main">
        <Hero />
        <Doorbell />
        <Indoor />
      </main>

      <footer className="ap-foot">
        <p>
          Independent design exploration. Not affiliated with or endorsed by Sky. Product details and prices are
          illustrative, referenced from public pages in October 2026. Device artwork is original placeholder
          illustration.
        </p>
        <p className="ap-foot__next">Prototype scope: hero and first two feature sections.</p>
      </footer>
    </div>
  );
}
