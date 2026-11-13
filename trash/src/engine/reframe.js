import { detectScenario } from './scenarios';

/**
 * Turn a thought into a two-beat provocation. Deterministic:
 * the same input always produces the same reframe.
 */

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

const PRONOUNS = {
  we: 'you', us: 'you', our: 'your', ours: 'yours', ourselves: 'yourselves',
  i: 'you', me: 'you', my: 'your', mine: 'yours', myself: 'yourself',
};
const swapPronouns = (s) =>
  s.replace(/\b[a-z]+\b/gi, (w) => PRONOUNS[w.toLowerCase()] ?? w);

const clean = (s) => s.replace(/[\s?.!]+$/, '').trim();

const GENERIC = [
  ['What if this isn’t the problem?', 'What if it’s just the symptom you’re most comfortable with?'],
  ['What if the obvious answer is the risky one?', 'What if doing less would say more?'],
  ['What if no one is waiting for this?', 'What if that’s exactly the opportunity?'],
  ['What if you already know the answer?', 'What if the hard part is admitting it?'],
];

export function reframe(rawInput) {
  const input = rawInput.trim();

  const scenario = detectScenario(input);
  if (scenario) return { id: scenario.id, lines: scenario.reframe };

  const how = input.match(/^how\s+(?:do|can|should|could|would|will|might|to)\s+(?:we|i|you|they|our \w+)?\s*(.+)$/i);
  if (how) {
    const rest = swapPronouns(clean(how[1]));
    if (rest && rest.length <= 52) {
      return {
        id: 'how',
        lines: [`What if the question isn’t how to ${rest}?`, 'What if it’s whether anyone would notice if you didn’t?'],
      };
    }
  }

  if (/^why\b/i.test(input)) {
    return { id: 'why', lines: ['What if the reason is simpler than you think?', 'What if you’ve been avoiding it on purpose?'] };
  }

  if (/^(should|can|will|is|are|do|does|could|would|must|shall)\b/i.test(input)) {
    return { id: 'yesno', lines: ['What if this isn’t a yes-or-no question?', 'What if the real decision is what you’d stop doing?'] };
  }

  if (/^what\b/i.test(input)) {
    return { id: 'what', lines: ['What if you’re asking for an answer when you need a direction?', 'What if the direction is already in front of you?'] };
  }

  return { id: 'generic', lines: GENERIC[hash(input.toLowerCase()) % GENERIC.length] };
}
