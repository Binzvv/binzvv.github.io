// All copy lives here so it can be checked against sky.com in one place.
// Facts used are limited to what could be verified (see README):
// Sky Glass Gen 2 sizes and finishes, Sky OS / "Hello Sky", streaming over
// broadband (25Mbps minimum), Sky Stream puck over HDMI and Wi-Fi, and
// Sky Essential TV including Sky Atlantic, Netflix (Standard with ads) and
// discovery+. No prices or offers are shown: none could be verified.

export const SKY = 'https://www.sky.com';

export const NAV = [
  {
    id: 'tv',
    label: 'TV',
    links: [
      { label: 'Sky Glass', href: '#glass' },
      { label: 'Sky Stream', href: '#stream' },
      { label: 'Sky Sports', href: '#channels' },
      { label: 'Sky Cinema', href: '#channels' },
      { label: 'Netflix on Sky', href: '#channels' },
    ],
  },
  {
    id: 'broadband',
    label: 'Broadband',
    links: [
      { label: 'Full Fibre broadband', href: '#home' },
      { label: 'Broadband and TV', href: '#home' },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    links: [
      { label: 'Sky Mobile', href: '#home' },
      { label: 'Piggybank', href: '#home' },
    ],
  },
  { id: 'deals', label: 'Deals', href: '#deals' },
  { id: 'help', label: 'Help', href: `${SKY}/help` },
];

export const FINISHES = [
  // Illustrative values from the Sky Glass design-system reference.
  { id: 'volcanic', name: 'Volcanic Grey', hex: '#4a4c50', wall: '#e9e9ec' },
  { id: 'atlantic', name: 'Atlantic Blue', hex: '#2f4a66', wall: '#e3e8ef' },
  { id: 'arctic', name: 'Arctic Silver', hex: '#d8dadd', wall: '#ececef' },
];

export const SIZES = [43, 55, 65];

export const OS_STEPS = [
  {
    id: 'playlist',
    title: 'It’s a personal playlist TV.',
    body: 'Save shows and films to one Playlist, whichever app they’re on, and pick up right where you left off.',
  },
  {
    id: 'voice',
    title: 'It’s a voice control TV.',
    body: 'Just say “Hello Sky” to find something to watch, switch channel or turn it up.',
  },
  {
    id: 'adjust',
    title: 'It’s an auto‑adjusting TV.',
    body: 'Picture and sound adapt to your room, so everything looks and sounds its best.',
  },
  {
    id: 'nodish',
    title: 'No dish. No box. No fuss.',
    body: 'Everything streams over your broadband. All you need is a plug socket and Wi‑Fi.',
    legal: 'Requires broadband with a minimum speed of 25Mbps.',
  },
];

export const CHANNELS = [
  { id: 'sports', name: 'Sky Sports', line: 'Premier League, F1, cricket, golf and more.', art: 'art-sports' },
  { id: 'cinema', name: 'Sky Cinema', line: 'Blockbusters, Sky Original films and family favourites.', art: 'art-cinema' },
  { id: 'netflix', name: 'Netflix', line: 'Netflix Standard with ads is included with Sky Essential TV.', art: 'art-netflix' },
  { id: 'tnt', name: 'TNT Sports', line: 'UEFA Champions League, Premiership Rugby and more.', art: 'art-tnt' },
  { id: 'kids', name: 'Sky Kids', line: 'Shows for little ones, without the ads.', art: 'art-kids' },
];
