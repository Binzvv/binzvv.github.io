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

// Projects. Each one is its own "world":
//   layout   'cover' | 'split' | 'column' | 'poster'  (alternating editorial compositions)
//   palette  'ink' | 'acid' | 'paper' | 'red'         (colour field for the spread)
//   image    URL — drops a real photo into the frame; grain, crop and type layers stay on top
//   brief    what the photo in this slot should be (shown on the placeholder)
export const projects = [
  {
    id: '01',
    title: 'Nocturne',
    client: 'Placeholder Records',
    tags: ['Identity', 'Motion'],
    year: 2026,
    layout: 'cover',
    palette: 'ink',
    kicker: 'A label that only releases after midnight.',
    brief: 'Long exposure · figure in motion · sodium light',
    ratio: '16:9',
    cursor: 'Enter',
    image: null,
  },
  {
    id: '02',
    title: 'Soft Machines',
    client: 'Placeholder Audio',
    tags: ['Product', 'Launch film'],
    year: 2026,
    layout: 'split',
    palette: 'acid',
    kicker: 'Hardware with the manners of a houseplant.',
    brief: 'Product macro · hard flash · cropped tight',
    ratio: '4:5',
    cursor: 'Listen',
    image: null,
  },
  {
    id: '03',
    title: 'Field Notes',
    client: 'Placeholder Museum',
    tags: ['Exhibition', 'Digital'],
    year: 2025,
    layout: 'column',
    palette: 'paper',
    kicker: 'An archive you are allowed to touch.',
    brief: 'Archive object · overhead · paper texture',
    ratio: '3:4',
    cursor: 'Read',
    image: null,
  },
  {
    id: '04',
    title: 'Snack Theory',
    client: 'Placeholder Foods',
    tags: ['Campaign', 'Character'],
    year: 2025,
    layout: 'poster',
    palette: 'red',
    kicker: 'Fast food, slow jokes.',
    brief: 'Portrait cut-out · mid-bite · direct flash',
    ratio: '4:5',
    cursor: 'Taste',
    image: null,
  },
]

// Full-bleed typographic interruptions, inserted after the project with this index.
export const interruptions = [
  { after: 1, words: ['No safe', 'ideas'], tone: 'acid' },
  { after: 3, words: ['Odd hours', 'only'], tone: 'red' },
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
