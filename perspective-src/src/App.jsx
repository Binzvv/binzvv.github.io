import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Intro from './components/Intro.jsx';
import Return from './components/Return.jsx';
import Header from './components/Header.jsx';
import TestPanel from './components/TestPanel.jsx';
import Welcome from './components/Welcome.jsx';
import Sound from './lenses/Sound.jsx';
import Film from './lenses/Film.jsx';
import Culture from './lenses/Culture.jsx';
import { LENS_META, STARTERS, pickDiscovery } from './content.js';

gsap.config({ nullTargetWarn: false });
import { bootSession, clearRecord, markSeen, readRecord, saveLens, simulateReturn } from './storage.js';
import { useMotionPreference } from './motion.js';

// Boot exactly once per page load (StrictMode would otherwise count two visits in dev).
let BOOT = null;
function getBoot() {
  if (!BOOT) BOOT = bootSession();
  return BOOT;
}

const LENS_VIEWS = { sound: Sound, film: Film, culture: Culture };
const WIPE_COLORS = { sound: '#d4ff3a', film: '#ff7a1a', culture: '#e2401c', none: '#efede6' };

function initialState(boot) {
  if (boot.returning) {
    const prevLens = boot.previous.lens;
    return {
      phase: 'return',
      lens: prevLens,
      session: {
        returning: true,
        previous: boot.previous,
        visits: boot.record.visits,
        discovery: pickDiscovery(prevLens, boot.previous.seen, boot.record.visits),
      },
    };
  }
  return { phase: 'intro', lens: null, session: { returning: false, visits: boot.record.visits } };
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const boot = getBoot();
  const [{ phase, lens, session }, setState] = useState(() => initialState(boot));
  // `welcome` is the lens-styled acknowledgement shown inside the experience.
  const [welcome, setWelcome] = useState(null);
  const [testOpen, setTestOpen] = useState(() => /[?&]test\b/.test(window.location.search));
  const [log, setLog] = useState(() => [
    {
      t: stamp(),
      msg: boot.returning
        ? `Recognised a returning visitor (visit ${boot.record.visits}). Last lens: ${boot.previous.lens}.`
        : 'No memory found. Treating as a first visit — playing the opening.',
    },
  ]);
  const [record, setRecord] = useState(() => readRecord());
  const [announcement, setAnnouncement] = useState('');
  const { reduced, toggle: toggleMotion } = useMotionPreference();
  const wipeRef = useRef(null);
  const busy = useRef(false);

  const addLog = useCallback((msg) => {
    setLog((l) => [{ t: stamp(), msg }, ...l].slice(0, 30));
    setRecord(readRecord());
  }, []);

  // Cover the screen, swap state underneath, uncover. The wipe colour belongs to the destination lens.
  const transition = useCallback(
    (apply, color = WIPE_COLORS.none) => {
      const el = wipeRef.current;
      if (!el || reduced) {
        apply();
        window.scrollTo(0, 0);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      gsap
        .timeline({ onComplete: () => (busy.current = false) })
        .set(el, { backgroundColor: color, display: 'block', yPercent: 100 })
        .to(el, { yPercent: 0, duration: 0.55, ease: 'power4.inOut' })
        .add(() => {
          apply();
          window.scrollTo(0, 0);
        })
        .to(el, { yPercent: -100, duration: 0.6, ease: 'power4.inOut', delay: 0.08 })
        .set(el, { display: 'none' });
    },
    [reduced]
  );

  const enterLens = useCallback(
    (next, { welcomeNote = null, source = 'intro' } = {}) => {
      saveLens(next);
      transition(() => {
        setState((s) => ({ ...s, phase: 'experience', lens: next }));
        setWelcome(welcomeNote);
        setAnnouncement(`${LENS_META[next].label} lens. ${LENS_META[next].announce}`);
      }, WIPE_COLORS[next]);
      addLog(`Lens set to ${next} (from ${source}). Saved to localStorage.`);
    },
    [transition, addLog]
  );

  // ----- Return-visit choices -----
  const continueReturn = () => {
    const d = session.discovery;
    if (d) markSeen(lens, d.id);
    enterLens(lens, {
      source: 'return screen',
      welcomeNote: { kind: 'return', discovery: d, previous: session.previous, visits: session.visits },
    });
  };

  const switchFromReturn = (next) => {
    const d = STARTERS[next];
    enterLens(next, {
      source: 'return screen',
      welcomeNote: { kind: 'bridge', from: lens, discovery: d, previous: session.previous, visits: session.visits },
    });
  };

  const openDiscoveryCross = (target) => {
    const d = session.discovery;
    markSeen(lens, d.id);
    enterLens(target, {
      source: 'cross-lens discovery',
      welcomeNote: { kind: 'bridge', from: lens, discovery: d, previous: session.previous, visits: session.visits },
    });
  };

  const reset = () => {
    clearRecord();
    BOOT = bootSession();
    transition(() => {
      setState(initialState(BOOT));
      setWelcome(null);
      setAnnouncement('Memory cleared. Starting again from the beginning.');
    });
    addLog('Reset: localStorage cleared. Opening replays as for a first-time visitor.');
  };

  // ----- Test mode -----
  const testSimulateReturn = (asLens) => {
    simulateReturn(asLens, 4);
    BOOT = bootSession();
    transition(() => {
      setState(initialState(BOOT));
      setWelcome(null);
    });
    addLog(`TEST: simulated a visitor who chose ${asLens} 4 days ago. Booted as a return visit.`);
  };

  const testFirstVisit = () => {
    clearRecord();
    BOOT = bootSession();
    transition(() => {
      setState(initialState(BOOT));
      setWelcome(null);
    });
    addLog('TEST: cleared memory and booted as a first-time visitor.');
  };

  const testReplayIntro = () => {
    transition(() => setState((s) => ({ ...s, phase: 'intro' })));
    addLog('TEST: replaying the opening (memory kept).');
  };

  // Global keyboard: Escape closes test panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && testOpen) setTestOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [testOpen]);

  useEffect(() => {
    document.documentElement.dataset.lens = phase === 'experience' ? lens : phase;
  }, [phase, lens]);

  const LensView = lens ? LENS_VIEWS[lens] : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {phase === 'intro' && (
        <Intro
          reduced={reduced}
          onChoose={(l) => enterLens(l, { source: 'opening' })}
          onToggleTest={() => setTestOpen((o) => !o)}
        />
      )}

      {phase === 'return' && (
        <Return
          reduced={reduced}
          lens={lens}
          session={session}
          onContinue={continueReturn}
          onSwitch={switchFromReturn}
          onCross={openDiscoveryCross}
          onReset={reset}
        />
      )}

      {phase === 'experience' && LensView && (
        <div className={`experience lens-${lens}`}>
          <Header
            lens={lens}
            visits={session.visits}
            returning={session.returning}
            reduced={reduced}
            onToggleMotion={toggleMotion}
            onLens={(l) => l !== lens && enterLens(l, { source: 'header' })}
            onReset={reset}
            testOpen={testOpen}
            onToggleTest={() => setTestOpen((o) => !o)}
          />
          <LensView
            key={lens}
            reduced={reduced}
            welcome={welcome && <Welcome lens={lens} note={welcome} onDismiss={() => setWelcome(null)} />}
          />
        </div>
      )}

      {phase !== 'experience' && (
        <button
          type="button"
          className="test-fab"
          aria-pressed={testOpen}
          onClick={() => setTestOpen((o) => !o)}
        >
          Test mode
        </button>
      )}

      {testOpen && (
        <TestPanel
          record={record}
          log={log}
          phase={phase}
          lens={lens}
          onClose={() => setTestOpen(false)}
          onSimulateReturn={testSimulateReturn}
          onFirstVisit={testFirstVisit}
          onReplayIntro={testReplayIntro}
        />
      )}

      <div className="wipe" ref={wipeRef} aria-hidden="true" />
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
    </>
  );
}
