/**
 * Three deterministic scenarios. Each has weighted keyword signals,
 * stems that let it surface while a word is still being typed,
 * predictive prompts, and a two-beat reframe.
 */
export const SCENARIOS = [
  {
    id: 'genz',
    signals: [
      [/\bgen[\s-]?z\b/, 4],
      [/\bgenz\b/, 4],
      [/\bzoomers?\b/, 4],
      [/\b(younger|youth|young people|teens?|students?)\b/, 2],
      [/\btik\s?tok\b/, 2],
      [/\brelevan(t|ce)\b/, 1.5],
      [/\b(cool|cultur(e|al)|next generation)\b/, 1],
    ],
    stems: ['gen', 'zoom', 'young', 'youth', 'tikt', 'releva'],
    prompts: [
      'How do we make our brand relevant to Gen Z?',
      'Why don’t younger audiences care about us?',
      'Should we be louder on TikTok?',
      'What does Gen Z actually expect from a brand?',
    ],
    reframe: [
      'What if Gen Z doesn’t have a problem with your brand?',
      'What if they simply have no reason to return?',
    ],
  },
  {
    id: 'loyalty',
    signals: [
      [/\bloyal(ty|ties)?\b/, 4],
      [/\b(retain|retention|churn(ing)?)\b/, 3],
      [/\b(repeat|returning) (customers?|buyers?|purchases?)\b/, 3],
      [/\b(rewards?|points|membership|subscribers?)\b/, 1.5],
      [/\bcustomers? (leave|leaving|left)\b/, 3],
      [/\bcome back\b/, 2],
    ],
    stems: ['loyal', 'retai', 'reten', 'churn', 'reward'],
    prompts: [
      'How do we build customer loyalty?',
      'Why are customers leaving us?',
      'Do loyalty programs still work?',
      'How do we reduce churn this year?',
    ],
    reframe: [
      'What if loyalty isn’t something customers owe you?',
      'What if it’s something you earn again, every single time?',
    ],
  },
  {
    id: 'ai',
    signals: [
      [/\b(ai|a\.i\.)\b/, 4],
      [/\bartificial intelligence\b/, 4],
      [/\b(gen(erative)?\s?ai|llms?|gpt|chat\s?gpt|chatbots?|agents?)\b/, 3],
      [/\b(machine learning|automat(e|ion|ed))\b/, 2],
      [/\b(personali[sz](e|ation|ed))\b/, 1],
    ],
    stems: ['artif', 'machin', 'automa', 'chatb', 'chatg', 'genera'],
    prompts: [
      'How should our brand use AI?',
      'Will AI make brands irrelevant?',
      'What does an AI-native brand experience feel like?',
      'Should our customer service be run by AI?',
    ],
    reframe: [
      'What if AI isn’t the experience?',
      'What if it’s the part your customers should never have to notice?',
    ],
  },
];

const normalise = (s) => s.toLowerCase().replace(/[’']/g, "'");

/** Returns the best matching scenario, or null. */
export function detectScenario(input) {
  return scoreScenario(input).scenario;
}

/** Best scenario plus its score, so callers can judge how strong the signal is. */
export function scoreScenario(input) {
  const text = normalise(input);
  if (!text.trim()) return { scenario: null, score: 0 };

  const lastToken = text.match(/([a-z]+)$/)?.[1] ?? '';
  let best = null;
  let bestScore = 0;

  for (const s of SCENARIOS) {
    let score = 0;
    for (const [re, w] of s.signals) if (re.test(text)) score += w;
    if (lastToken.length >= 3 && s.stems.some((st) => st.startsWith(lastToken) || lastToken.startsWith(st))) {
      score += 1.5;
    }
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  return bestScore >= 1.5 ? { scenario: best, score: bestScore } : { scenario: null, score: bestScore };
}
