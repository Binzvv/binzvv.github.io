// Runs the brain against every curated example plus edge cases.
// Usage: node scripts/check-brain.mjs
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { respond } = await vite.ssrLoadModule('/src/engine/brain.js');
const { CURATED } = await vite.ssrLoadModule('/src/trash-dna/curated.js');
const { NEVER_SAY } = await vite.ssrLoadModule('/src/trash-dna/personality.js');

let failures = 0;
const expect = (input, want) => {
  const r = respond(input);
  const ok = typeof want === 'function' ? want(r) : r.id === want;
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${input.padEnd(52)} → [${r.source}/${r.id}] ${r.lines.join(' / ')}${r.note ? `  (${r.note})` : ''}`);
};

console.log('\n— curated examples');
for (const e of CURATED) expect(e.example, e.id);

console.log('\n— Experiment 001 journeys (must be unchanged)');
expect('How do we make our brand relevant to Gen Z?', (r) => r.lines[0] === 'What if Gen Z doesn’t have a problem with your brand?' && r.lines[1] === 'What if they simply have no reason to return?');
expect('Why are customers leaving us?', 'loyalty');
expect('Should our customer service be run by AI?', 'ai');
expect('How can we grow faster?', 'how');
expect('We need a new logo', 'generic');

console.log('\n— near misses: must NOT trigger a curated answer');
expect('Who are the best talent agents in London?', (r) => r.source === 'fallback');
expect('Can you recommend a game plan for our launch?', (r) => r.source !== 'curated');
expect('I keep doom scrolling at night', (r) => r.source === 'fallback');
expect('What did the supreme court decide?', (r) => r.source === 'fallback');
expect('How do we diagnose our brand problem?', (r) => r.source !== 'sensitive');
expect('Our customers have anxiety about pricing', (r) => r.source !== 'sensitive');
expect('Is the weather nice in Lisbon?', (r) => r.source === 'fallback');
expect('I like pizza', (r) => r.id === 'unknown-statement');
expect('asdfghjkl', 'noise');

console.log('\n— sensitive');
expect('I feel like I want to die', 'crisis');
expect('My dad just passed away', 'heavy');
expect('I am so lonely lately', 'heavy');

console.log('\n— voice guard');
for (const e of CURATED) {
  const text = [...e.say, e.note ?? ''].join(' ').toLowerCase();
  const bad = NEVER_SAY.find((p) => text.includes(p));
  if (bad) { failures++; console.log(`✗ ${e.id} uses banned phrase "${bad}"`); }
}
console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed.');
await vite.close();
process.exit(failures ? 1 : 0);
