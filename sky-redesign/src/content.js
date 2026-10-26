// All copy lives here so it can be checked against sky.com in one place.
// Every product claim is limited to what could be verified (see README),
// and no prices or offers are shown.

export const SKY = 'https://www.sky.com';

// Drop licensed Sky imagery into /public/assets and set its path here.
// Until then each slot shows an art-directed stand-in.
export const ASSETS = {
  hero: null, // e.g. 'assets/hero-key-art.jpg'
  sports: null,
  glassRoom: null,
  stream: null,
  glassAir: null,
  broadband: null,
  mobile: null,
};

export const NAV = [
  {
    id: 'tv',
    label: 'TV',
    links: [
      { label: 'Sky TV', href: '#tv' },
      { label: 'Sky Glass', href: '#glass' },
      { label: 'Sky Glass Air', href: '#screens' },
      { label: 'Sky Stream', href: '#screens' },
    ],
  },
  { id: 'sports', label: 'Sports', href: '#sports' },
  { id: 'broadband', label: 'Broadband', href: '#broadband' },
  { id: 'mobile', label: 'Mobile', href: '#mobile' },
  { id: 'deals', label: 'Deals', href: `${SKY}/deals` },
  { id: 'help', label: 'Help', href: `${SKY}/help` },
];

// Channels and apps you can watch on Sky (names only, no pack claims).
export const CHANNEL_ROWS = [
  ['Sky Atlantic', 'Netflix', 'discovery+', 'Sky Max', 'Sky Showcase', 'Sky Comedy'],
  ['Sky Cinema', 'Sky Documentaries', 'Sky Nature', 'Sky Witness', 'Sky Crime', 'Sky History'],
  ['Sky Sports', 'TNT Sports', 'Sky Kids', 'Sky Arts', 'Sky Atlantic', 'Sky Cinema'],
];

export const GLASS_FINISHES = [
  // Illustrative values from the Sky Glass design-system reference.
  { id: 'volcanic', name: 'Volcanic Grey', hex: '#4a4c50', wall: '#e9e9ec' },
  { id: 'atlantic', name: 'Atlantic Blue', hex: '#2f4a66', wall: '#e3e8ef' },
  { id: 'arctic', name: 'Arctic Silver', hex: '#d8dadd', wall: '#ececef' },
];
export const SIZES = [43, 55, 65];

export const DIRECTORY = [
  { id: 'tv', name: 'Sky TV', line: 'Streamed to any TV over Wi‑Fi.', href: '#tv' },
  { id: 'sports', name: 'Sky Sports', line: 'Premier League and Formula 1, live.', href: '#sports' },
  { id: 'glass', name: 'Sky Glass', line: 'The TV with Sky built in.', href: '#glass' },
  { id: 'stream', name: 'Sky Stream', line: 'Sky on the TV you already have.', href: '#screens' },
  { id: 'broadband', name: 'Sky Broadband', line: 'Full Fibre, up to 5Gbps.', href: '#broadband' },
  { id: 'mobile', name: 'Sky Mobile', line: 'Keep the data you don’t use.', href: '#mobile' },
];
