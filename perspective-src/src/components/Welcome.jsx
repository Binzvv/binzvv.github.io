import { LENS_META } from '../content.js';
import { timeAgo } from '../storage.js';

function sinceLine(ts) {
  const ago = timeAgo(ts);
  if (ago === 'moments ago' || ago.includes('minute') || ago.includes('hour')) return 'back so soon?';
  if (ago === 'yesterday') return 'you were here only yesterday.';
  return `it’s been ${ago.replace(' ago', '')}.`;
}

// The same discovery, said in each lens's own voice.
const VOICE = {
  sound: {
    label: (n) => (n.kind === 'return' ? 'Bonus track · new since your last visit' : 'Guest track · new to you'),
    line: (n) =>
      n.kind === 'return'
        ? `Welcome back. You were last here ${timeAgo(n.previous?.lastVisit)} — this dropped while you were away.`
        : `You usually come here ${LENS_META[n.from].verb}. Turn it up — start with this.`,
  },
  film: {
    label: (n) => (n.kind === 'return' ? 'Coming attraction · since your last screening' : 'Your first screening'),
    line: (n) =>
      n.kind === 'return'
        ? `Welcome back to your seat. Last showing: ${timeAgo(n.previous?.lastVisit)}.`
        : `You usually come here ${LENS_META[n.from].verb}. Tonight, watch — we picked the opener.`,
  },
  culture: {
    label: (n) => (n.kind === 'return' ? 'A note from the editor' : 'A note for a new reader'),
    line: (n) =>
      n.kind === 'return'
        ? `Dear returning reader — ${sinceLine(n.previous?.lastVisit)} We saved you something.`
        : `Dear ${LENS_META[n.from].noun} — you’re usually ${LENS_META[n.from].gerund}. Try reading this first.`,
  },
};

export default function Welcome({ lens, note, onDismiss }) {
  const v = VOICE[lens];
  const d = note.discovery;
  return (
    <aside className={`welcome welcome-${lens}`} aria-labelledby="welcome-title">
      <p className="welcome-label">{v.label(note)}</p>
      <p className="welcome-line">{v.line(note)}</p>
      <h2 className="welcome-title" id="welcome-title">
        {d.title}
      </h2>
      <p className="welcome-kind">{d.kind}</p>
      <p className="welcome-blurb">{d.blurb}</p>
      <button type="button" className="welcome-close" onClick={onDismiss}>
        Dismiss<span className="sr-only"> welcome note</span>
      </button>
    </aside>
  );
}
