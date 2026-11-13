// ─────────────────────────────────────────────────────────────
// All site copy lives here. Edit freely — components read from it.
// ─────────────────────────────────────────────────────────────

export const studio = {
  name: 'Odd Hours',
  email: 'hello@oddhours.studio',
  city: 'Lisbon',
  timezone: 'Europe/Lisbon',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Are.na', href: '#' },
    { label: 'Read.cv', href: '#' },
  ],
}

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Studio', href: '#studio' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
]

// The hero headline. `blob: true` places the character inline before the line.
export const hero = {
  lines: [
    { text: 'Odd ideas,' },
    { text: 'made', blob: true },
    { text: 'obvious', serif: true, dot: true },
  ],
  intro: 'An independent creative studio for brands that would rather be remembered than liked.',
}

// Manifesto — `em: true` renders the words in the italic serif.
export const manifesto = [
  { t: 'We are a small, stubborn studio building' },
  { t: 'brand worlds,', em: true },
  { t: 'motion systems and digital things that feel' },
  { t: 'a little bit alive.', em: true },
  { t: 'Fewer slides, more prototypes. Fewer trends, more' },
  { t: 'nerve.', em: true },
]

// Projects. Set `image` to a URL to replace the generated placeholder art.
// `art` options: 'orbit' | 'stack' | 'grid' | 'creature'
export const projects = [
  {
    id: '01',
    title: 'Nocturne',
    client: 'Placeholder Records',
    tags: ['Identity', 'Motion'],
    year: 2026,
    art: 'orbit',
    image: null,
  },
  {
    id: '02',
    title: 'Soft Machines',
    client: 'Placeholder Audio',
    tags: ['Product', 'Launch film'],
    year: 2026,
    art: 'stack',
    image: null,
  },
  {
    id: '03',
    title: 'Field Notes',
    client: 'Placeholder Museum',
    tags: ['Exhibition', 'Digital'],
    year: 2025,
    art: 'grid',
    image: null,
  },
  {
    id: '04',
    title: 'Snack Theory',
    client: 'Placeholder Foods',
    tags: ['Campaign', 'Character'],
    year: 2025,
    art: 'creature',
    image: null,
  },
]

export const marquee = ['Brand worlds', 'Motion', 'Characters', 'Digital products', 'Campaigns', 'Type']

export const services = [
  { name: 'Brand identity', note: 'Names, marks, systems, voice — the whole personality.' },
  { name: 'Motion & film', note: 'Launch films, idents and motion languages that move with intent.' },
  { name: 'Digital experiences', note: 'Websites and products with craft you can feel in the scroll.' },
  { name: 'Characters & worlds', note: 'Mascots, worlds and lore your audience adopts as their own.' },
]

// Things the blob says when you poke it.
export const blobLines = [
  'Hi!',
  'Boop.',
  'That tickles.',
  'Hire us?',
  'Again!',
  'I bite (softly).',
  'Still here.',
]

export const contact = {
  kicker: 'Got an odd idea?',
  headline: ["Let's make", 'it obvious.'],
}
