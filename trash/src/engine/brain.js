import { CURATED } from '../trash-dna/curated';
import { SENSITIVE } from '../trash-dna/sensitive';
import { NOISE, STRATEGIC_SIGNAL, UNKNOWN_QUESTION, UNKNOWN_STATEMENT } from '../trash-dna/fallbacks';
import { scoreScenario } from './scenarios';
import { reframe } from './reframe';

/**
 * The brain. Decides how TRASH responds, in this order:
 *
 *   1. sensitive  — personal or crisis topics: calm, no wit
 *   2. noise      — keyboard mash
 *   3. curated    — recognised inputs from trash-dna
 *   4. strategic  — the original Experiment 001 reframes, only for
 *                   questions about a brand, business or team
 *   5. fallback   — an honest, short answer instead of pretending
 *
 * Every path returns the same shape, which is also the shape a future
 * model provider must return:
 *
 *   { id, register, source, lines: [first, second?], note: string|null }
 */

export const normalise = (s) =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
const pick = (list, key) => list[hash(key) % list.length];

const matches = (entry, text) =>
  entry.match.some((re) => re.test(text)) && (!entry.requires || entry.requires.test(text));

const shape = (source, entry) => ({
  id: entry.id,
  register: entry.register ?? source,
  source,
  lines: entry.say,
  note: entry.note ?? null,
});

const isNoise = (text) => {
  const letters = text.replace(/[^a-z]/g, '');
  const mash = text.split(' ').length <= 2 && /[bcdfghjklmnpqrstvwxz]{5,}/.test(text);
  return letters.length < 2 || !/[aeiouy]/.test(letters) || /^(.)\1+$/.test(letters) || mash;
};

const looksLikeQuestion = (text) =>
  /\?\s*$/.test(text) ||
  /^(who|what|when|where|why|how|which|is|are|am|do|does|did|can|could|should|would|will|was|were)\b/.test(text);

export function respond(rawInput) {
  const input = rawInput.trim();
  const text = normalise(input);

  const sensitive = SENSITIVE.find((e) => matches(e, text));
  if (sensitive) return shape('sensitive', { ...sensitive, register: 'sensitive' });

  if (isNoise(text)) return { id: 'noise', register: 'casual', source: 'fallback', lines: NOISE, note: null };

  const curated = CURATED.find((e) => matches(e, text));
  if (curated) return shape('curated', curated);

  const strategic = STRATEGIC_SIGNAL.test(text);
  const { scenario, score } = scoreScenario(input);
  if (strategic || (scenario && score >= 4)) {
    const r = reframe(input);
    return { id: r.id, register: 'strategic', source: scenario ? 'scenario' : 'template', lines: r.lines, note: null };
  }

  const question = looksLikeQuestion(text);
  return {
    id: question ? 'unknown-question' : 'unknown-statement',
    register: 'casual',
    source: 'fallback',
    lines: pick(question ? UNKNOWN_QUESTION : UNKNOWN_STATEMENT, text),
    note: null,
  };
}

/**
 * Ready for a model later: pass a provider `(input, { dna }) => Promise<shape>`.
 * Sensitive topics never leave the curated path, and any provider failure
 * falls back to the local brain.
 */
export async function respondWith(rawInput, provider) {
  const local = respond(rawInput);
  if (!provider || local.source === 'sensitive' || local.source === 'curated') return local;
  try {
    const r = await provider(rawInput);
    return r?.lines?.length ? { note: null, ...r, source: 'model' } : local;
  } catch {
    return local;
  }
}
