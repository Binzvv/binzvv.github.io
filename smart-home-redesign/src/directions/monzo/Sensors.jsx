import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap.js';
import { useFinePointer, useMotion } from '../../lib/motion.js';
import { IndoorCamera, LeakSensor, MotionSensor, SensorBridge } from '../../components/art/Devices.jsx';
import { indoor, plans } from '../../lib/content.js';

const CARDS = [
  {
    id: 'camera',
    tone: 'sky',
    kicker: 'Indoor Camera',
    title: 'Eyes on the living room.',
    body: 'Watch live in 1080p, get motion alerts, and talk through it. Sees in the dark, too.',
    price: 'Included with Plan+',
  },
  {
    id: 'motion',
    tone: 'sun',
    kicker: 'Motion Pack',
    title: 'Something moved? You’ll know.',
    body: `${indoor.packs[0].contents}. Doors, windows, hallways — covered.`,
    price: `£${indoor.packs[0].price}`,
  },
  {
    id: 'leak',
    tone: 'mint',
    kicker: 'Leak Pack',
    title: 'Drips don’t stand a chance.',
    body: `${indoor.packs[1].contents}. Tuck them under sinks and behind the washing machine.`,
    price: `£${indoor.packs[1].price}`,
  },
  {
    id: 'bridge',
    tone: 'coral',
    kicker: 'Sensor Bridge',
    title: 'The friendly middleman.',
    body: 'Plugs into the back of your Indoor Camera so every sensor can talk to the app. One per home is plenty.',
    price: 'Comes with the Leak Pack',
  },
];

function CameraDemo() {
  return (
    <div className="mz-demo mz-demo--camera">
      <IndoorCamera variant="monzo" />
      <span className="mz-demo__pill">Motion in the living room</span>
    </div>
  );
}

function MotionDemo() {
  return (
    <div className="mz-demo mz-demo--motion" aria-hidden="true">
      <div className="mz-demo__sensor">
        <svg className="mz-demo__arcs" viewBox="0 0 200 200">
          <path d="M130 60a50 50 0 0 1 0 80" />
          <path d="M150 40a80 80 0 0 1 0 120" />
          <path d="M170 20a110 110 0 0 1 0 160" />
        </svg>
        <MotionSensor />
      </div>
      <div className="mz-demo__door">
        <span className="mz-demo__frame" />
        <span className="mz-demo__leaf" />
        <span className="mz-demo__contact mz-demo__contact--a" />
        <span className="mz-demo__contact mz-demo__contact--b" />
      </div>
      <span className="mz-demo__pill">Front door opened</span>
    </div>
  );
}

function LeakDemo() {
  return (
    <div className="mz-demo mz-demo--leak" aria-hidden="true">
      <span className="mz-demo__pipe" />
      <span className="mz-demo__drop" />
      <span className="mz-demo__puddle" />
      <LeakSensor className="mz-demo__puck" />
      <span className="mz-demo__pill">Leak under the sink!</span>
    </div>
  );
}

function BridgeDemo() {
  return (
    <div className="mz-demo mz-demo--bridge" aria-hidden="true">
      <div className="mz-demo__cam">
        <IndoorCamera variant="monzo" title="" />
      </div>
      <div className="mz-demo__plug">
        <SensorBridge variant="monzo" />
      </div>
      <span className="mz-demo__pill">4 sensors connected</span>
    </div>
  );
}

const DEMOS = { camera: CameraDemo, motion: MotionDemo, leak: LeakDemo, bridge: BridgeDemo };

export default function Sensors() {
  const root = useRef(null);
  const { reduced } = useMotion();
  const fine = useFinePointer();

  const { contextSafe } = useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      const pin = q('.mz-sn__pin')[0];
      const track = q('.mz-sn__track')[0];

      const split = SplitText.create(q('.mz-sn__title'), { type: 'words' });
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%' } })
        .from(q('.mz-sn__intro .mz-tag'), { scale: 0, rotate: -10, duration: 0.7, ease: 'back.out(2.5)' })
        .from(split.words, { yPercent: 120, rotate: 8, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'back.out(1.8)' }, 0.1)
        .from(q('.mz-sn__intro .mz-lede, .mz-sn__intro .mz-sn__hint'), { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: 'back.out(1.5)' }, 0.4);

      // Vertical scroll drives a horizontal track.
      const distance = () => track.scrollWidth - pin.clientWidth;
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.9,
          pin: true,
          invalidateOnRefresh: true,
          onToggle: (self) => root.current?.classList.toggle('is-live', self.isActive),
        },
      });
      gsap.to(q('.mz-sn__progress i'), {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      });

      // Each card tumbles in and straightens as it reaches the viewport.
      q('.mz-card').forEach((card, i) => {
        gsap.from(card, {
          rotate: i % 2 ? -7 : 6,
          y: 60,
          scale: 0.92,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 100%', end: 'left 55%', scrub: 0.6 },
        });
      });

      // Camera lens follows the pointer around the page.
      const pupil = q('.mz-demo--camera .art-camera__pupil')[0];
      const lens = q('.mz-demo--camera .art-camera__lens')[0];
      if (pupil && fine) {
        const px = gsap.quickTo(pupil, 'x', { duration: 0.5, ease: 'power3.out' });
        const py = gsap.quickTo(pupil, 'y', { duration: 0.5, ease: 'power3.out' });
        const onMove = (e) => {
          const r = lens.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const d = Math.hypot(dx, dy) || 1;
          const reach = Math.min(1, d / 400) * 12;
          px((dx / d) * reach);
          py((dy / d) * reach);
        };
        window.addEventListener('pointermove', onMove);
        return () => window.removeEventListener('pointermove', onMove);
      }
      if (pupil) {
        gsap.to(pupil, {
          keyframes: [{ x: -10, y: 2 }, { x: 10, y: -4 }, { x: 0, y: 6 }, { x: 0, y: 0 }],
          duration: 5,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }
    },
    { scope: root, dependencies: [reduced, fine] },
  );

  // Cards tilt toward the pointer and squash on press.
  const tilt = contextSafe((e) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: x * 10, rotateX: -y * 10, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
  });
  const untilt = contextSafe((e) => {
    if (reduced) return;
    gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, scale: 1, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
  });
  const press = contextSafe((e) => {
    if (reduced) return;
    gsap.to(e.currentTarget, { scale: 0.96, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
  });
  const release = contextSafe((e) => {
    if (reduced) return;
    gsap.to(e.currentTarget, { scale: 1, duration: 0.8, ease: 'elastic.out(1.1, 0.35)', overwrite: 'auto' });
  });

  return (
    <section id="sensors" className={`mz-sn ${reduced ? 'is-static' : 'is-motion'}`} ref={root} aria-labelledby="mz-sn-title">
      <div className="mz-sn__pin">
        <div className="mz-sn__track">
          <div className="mz-sn__intro">
            <p className="mz-tag mz-tag--mint">{indoor.eyebrow}</p>
            <h2 className="mz-sn__title mz-h2" id="mz-sn-title">
              Small gadgets. Big peace of&nbsp;mind.
            </h2>
            <p className="mz-lede">
              Add an Indoor Camera and sensors with Smart Home Plan+ and the whole house checks in with you.
            </p>
            <p className="mz-sn__hint" aria-hidden="true">
              Keep scrolling
              <svg viewBox="0 0 40 16">
                <path d="M2 8h34M30 2l6 6-6 6" />
              </svg>
            </p>
          </div>

          {CARDS.map((c) => {
            const Demo = DEMOS[c.id];
            return (
              <article key={c.id} className={`mz-card is-${c.tone}`}>
                <div
                  className="mz-card__body"
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                  onPointerDown={press}
                  onPointerUp={release}
                >
                  <Demo />
                  <div className="mz-card__text">
                    <p className="mz-card__kicker">
                      {c.kicker}
                      <span className="mz-card__price">{c.price}</span>
                    </p>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="mz-sn__end" id="sensors-end">
            <h3>Pick a plan, any plan.</h3>
            <ul>
              {plans.map((p) => (
                <li key={p.id}>
                  <span className="mz-sn__planName">{p.name}</span>
                  <span className="mz-sn__planIncl">{p.includes}</span>
                  <span className="mz-sn__planPrice">
                    £{p.monthly}
                    <small>/month</small>
                  </span>
                  <span className="mz-sn__planUp">+ £{p.upfront} upfront</span>
                </li>
              ))}
            </ul>
            <a className="mz-btn mz-btn--light mz-press" href="#top">
              Build my setup
            </a>
          </div>
        </div>
        <div className="mz-sn__progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
