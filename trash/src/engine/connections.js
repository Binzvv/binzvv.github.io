/**
 * Experiment 002 — Connected thinking.
 * Four disciplines, six possible pairings. Deterministic copy only.
 */

export const STATEMENT = 'I connect things that aren’t supposed to connect.';
export const SECONDARY = 'Culture. Behaviour. Brand. Technology.';
export const RESULT = 'Experiences that give people a reason to return.';
export const PERSON =
  'I work across culture, brand, technology and human behaviour to question what should exist next. My work connects strategic thinking with interactive experimentation — turning ideas into experiences people can actually use.';

/**
 * Positions are fractions of the field (centre of each word).
 * `wide` for landscape screens, `narrow` for phones.
 */
export const DISCIPLINES = [
  { id: 'culture', label: 'Culture', wide: [0.2, 0.26], narrow: [0.32, 0.1] },
  { id: 'behaviour', label: 'Behaviour', wide: [0.76, 0.16], narrow: [0.68, 0.36] },
  { id: 'brand', label: 'Brand', wide: [0.3, 0.82], narrow: [0.3, 0.62] },
  { id: 'technology', label: 'Technology', wide: [0.8, 0.68], narrow: [0.64, 0.88] },
];

const ORDER = DISCIPLINES.map((d) => d.id);
const keyFor = (a, b) => [a, b].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).join('+');

const MEANINGS = {
  'culture+behaviour': 'Understanding why people participate, not just what they consume.',
  'brand+technology': 'Turning brand identity into something people can actually experience.',
  'behaviour+brand': 'Designing reasons to return, not just reasons to notice.',
  'culture+technology': 'Finding new possibilities at the intersection of emerging tools and cultural change.',
  'culture+brand': 'Earning a place in what people already care about, instead of interrupting it.',
  'behaviour+technology': 'Building tools around what people actually do, not what we hope they will.',
};

export const meaningFor = (a, b) => MEANINGS[keyFor(a, b)];
