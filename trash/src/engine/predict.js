import { SCENARIOS, detectScenario } from './scenarios';

/**
 * Predictive strip. Three slots, iOS-style.
 *  - Empty input   → one opening thought per scenario.
 *  - Scenario hit  → full-thought completions from that scenario.
 *  - Otherwise     → word completion / next-word prediction.
 * Every suggestion is { label, value } where value replaces the input.
 */

const VOCAB = `about after again always audience authentic be become believe better brand brands build business can
care change community company competitors could create creative culture customer customers design different digital
do does done every everyone experience experiences feel future grow growth have help how idea ideas if important
innovation is it just know launch lead learn less like listen long love make market marketing matter meaning more
most need new next not now online our out people perception product products purpose question really reason
relevant right should simple start stop story strategy success team than that the their them they think this time
to together trust truth understand us value want we what when where who why will with without work world would year you your`
  .split(/\s+/)
  .filter(Boolean);

const NEXT = {
  how: ['do', 'can', 'should'],
  do: ['we', 'they', 'people'],
  can: ['we', 'our', 'I'],
  should: ['we', 'our', 'I'],
  why: ['do', 'are', 'does'],
  what: ['if', 'does', 'would'],
  we: ['make', 'build', 'need'],
  i: ['think', 'want', 'need'],
  our: ['brand', 'customers', 'team'],
  the: ['brand', 'future', 'problem'],
  make: ['our', 'people', 'it'],
  build: ['a', 'trust', 'our'],
  is: ['it', 'our', 'there'],
  are: ['we', 'our', 'people'],
  to: ['make', 'build', 'be'],
  more: ['relevant', 'human', 'useful'],
  a: ['brand', 'better', 'new'],
};
const OPENERS = ['How', 'Why', 'What if'];
const DEFAULT_NEXT = ['our', 'the', 'we'];

const swapLastWord = (input, word) => input.replace(/(\S*)$/, word) + ' ';
const append = (input, word) => input + word + ' ';

export function predict(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    return SCENARIOS.map((s) => ({ label: s.prompts[0], value: s.prompts[0], kind: 'thought' }));
  }

  const scenario = detectScenario(input);
  if (scenario) {
    const lower = trimmed.toLowerCase();
    return scenario.prompts
      .filter((p) => p.toLowerCase() !== lower)
      .slice(0, 3)
      .map((p) => ({ label: p, value: p, kind: 'thought' }));
  }

  const endsWithSpace = /\s$/.test(input);
  const words = trimmed.split(/\s+/);
  const last = words[words.length - 1];

  if (!endsWithSpace) {
    const lower = last.toLowerCase();
    const matches = VOCAB.filter((w) => w.startsWith(lower) && w !== lower).slice(0, 3);
    const cap = words.length === 1 && /^[A-Z]/.test(last);
    const fmt = (w) => (cap ? w[0].toUpperCase() + w.slice(1) : w);
    if (matches.length) {
      return matches.map((w) => ({ label: fmt(w), value: swapLastWord(input, fmt(w)), kind: 'word' }));
    }
    return [];
  }

  const key = last.toLowerCase().replace(/[^a-z]/g, '');
  if (/[?.!]$/.test(last)) {
    return OPENERS.map((w) => ({ label: w, value: append(input, w), kind: 'word' }));
  }
  return (NEXT[key] ?? DEFAULT_NEXT).map((w) => ({ label: w, value: append(input, w), kind: 'word' }));
}
