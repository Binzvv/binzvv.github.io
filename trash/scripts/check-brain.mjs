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

console.log('\n— curated examples and natural variations');
for (const e of CURATED) {
  expect(e.example, e.id);
  for (const v of e.also ?? []) expect(v, e.id);
}

console.log('\n— v0.1 easter eggs: exact answers');
const exact = {
  'Is design dead?': 'Yes. The version we know today.',
  'What is user testing good for?': 'Collecting data. Not outsourcing judgement.',
  'Where is the future of design?': 'Between worlds. Not inside another discipline.',
  'What’s wrong with UK design?': 'Too much imitation. Not enough imagination.',
  'Is streetwear dead?': 'No. It just got a mortgage.',
  'Why is Netflix so successful?': 'Easy entry. Easy exit.',
  'What’s the future?': 'A kid building the world they imagined.',
  'Recommend me a book.': 'Steve Jobs. Walter Isaacson. Read it before another design book.',
  '2Pac or Biggie?': 'Biggie had the flow. Pac became the mythology.',
  'Best running brand?': 'SATISFY. Brice Partouche understood that running could have the energy of early Supreme.',
  'Who are your biggest influences?': 'Steve Jobs. David Carson. Ye. Make of that what you will.',
  'Why Ye?': 'Because an album was never just an album.',
  'Is AI replacing creativity?': 'No. It’s exposing how much of it was imitation.',
  'What’s wrong with design agencies?': 'They keep selling the things they make. Not what they make possible.',
  'What’s the future of branding?': 'Less about being seen. More about giving people a reason to return.',
  'Why do most portfolios look the same?': 'Because designers keep designing for other designers.',
  'What’s wrong with AI design?': 'Everyone’s generating. Who’s deciding?',
  'What makes a great product?': 'It changes what you do. Not just what you see.',
  'What’s the difference between a campaign and a world?': 'A campaign ends. A world gives you somewhere to return.',
  'Who are you?': 'Someone who connects things that aren’t supposed to connect.',
};
for (const [q, a] of Object.entries(exact)) expect(q, (r) => r.lines.join(' ') === a);

console.log('\n— false positives: must NOT trigger an easter egg');
const not = (id) => (r) => r.id !== id;
expect('What should I watch on Netflix?', not('netflix'));
expect('Any good Netflix series?', not('netflix'));
expect('Is Netflix raising prices?', not('netflix'));
expect('Is Pac-Man a big deal?', not('pac-or-biggie'));
expect('Who is the Notorious B.I.G.?', not('pac-or-biggie'));
expect('This layout is dead simple', not('design-dead'));
expect('What makes a great product manager?', not('great-product'));
expect('Our campaign went around the world', not('campaign-vs-world'));
expect('Who made this cake?', not('who-are-you'));
expect('I like running in the morning', not('running-brand'));
expect('Why yes?', not('why-ye'));
expect('Design agencies near me', not('agencies'));
expect('The future of AI is weird', not('the-future'));
expect('Is AI good at maths?', not('ai-creativity'));
expect('What is a portfolio?', not('portfolios'));

console.log('\n— fallbacks by kind of input');
expect('What’s the weather in Tokyo?', 'unknown-factual');
expect('How much does a PS5 cost?', 'unknown-factual');
expect('Who won the match last night?', 'unknown-factual');
expect('Is pineapple on pizza good?', 'unknown-subjective');
expect('Do you think cats are better than dogs?', 'unknown-subjective');
expect('Why is the sky so quiet at night?', 'unknown-question');
expect('Tell me something completely random.', 'unknown-request');
expect('I was thinking about', 'incomplete');
expect('Maybe…', 'incomplete');
expect('I painted my kitchen green yesterday', 'unknown-statement');
expect('Honestly no idea', (r) => !r.lines.join(' ').includes('Honestly'));
for (const q of ['What’s the weather in Tokyo?', 'Is pineapple on pizza good?', 'Tell me something completely random.']) {
  const a = respond(q).lines.join(), b = respond(q).lines.join();
  if (a !== b) { failures++; console.log('✗ not deterministic:', q); }
}

console.log('\n— Experiment 001 journeys (must be unchanged)');
expect('How do we make our brand relevant to Gen Z?', (r) => r.lines[0] === 'What if Gen Z doesn’t have a problem with your brand?' && r.lines[1] === 'What if they simply have no reason to return?');
expect('Why are customers leaving us?', 'loyalty');
expect('Should our customer service be run by AI?', 'ai');
expect('How can we grow faster?', 'how');
expect('We need a new logo', 'generic');

console.log('\n— near misses: must NOT trigger a curated answer');
expect('Who are the best talent agents in London?', (r) => r.source === 'fallback');
expect('What did the supreme court decide?', (r) => r.source === 'fallback');
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
expect('Is design dead? Honestly I want to die', 'crisis');
expect('My dad passed away, why is Netflix so successful', 'heavy');

console.log('\n— final check');
for (const q of ['Why is Netflix successful?', 'Pac or Biggie?', 'What makes good design?', 'Why Ye?', 'Best running brand?', 'Is design dead?', 'What’s the weather in Tokyo?', 'Tell me something completely random.']) expect(q, () => true);

console.log('\n— voice guard');
for (const e of CURATED) {
  const text = [...e.say, e.note ?? ''].join(' ').toLowerCase();
  const bad = NEVER_SAY.find((p) => text.includes(p));
  if (bad) { failures++; console.log(`✗ ${e.id} uses banned phrase "${bad}"`); }
}
console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed.');
await vite.close();
process.exit(failures ? 1 : 0);
