// All content is original placeholder copy for a fictional studio.

export const LENSES = ['sound', 'film', 'culture'];

export const LENS_META = {
  sound: {
    id: 'sound',
    label: 'Sound',
    verb: 'to listen',
    gerund: 'listening',
    noun: 'listener',
    blurb: 'Sonic identity, spatial audio, scores and field recordings.',
    announce: 'The studio is now arranged like a record: a tracklist, a transport bar and a beat.',
  },
  film: {
    id: 'film',
    label: 'Film',
    verb: 'to watch',
    gerund: 'watching',
    noun: 'viewer',
    blurb: 'Short films, title sequences, documentary and stop-motion.',
    announce: 'The studio is now a screening: one scene at a time, with a timeline to move between them.',
  },
  culture: {
    id: 'culture',
    label: 'Culture',
    verb: 'to read',
    gerund: 'reading',
    noun: 'reader',
    blurb: 'Essays, photo stories, guides, gatherings and a quarterly issue.',
    announce: 'The studio is now a magazine: an index, filters and an issue to browse.',
  },
};

export const SOUND = {
  bpm: 92,
  key: 'C minor',
  hero: ['Listen', 'sideways.'],
  intro:
    'PERSPECTIVE Sound is a studio for the things you hear before you see them. We compose identities, build rooms that listen back and record places before they disappear.',
  tracks: [
    {
      id: 'low-tide',
      title: 'Low Tide Sessions',
      kind: 'Field recording · LP',
      duration: '41:12',
      year: '2026',
      seed: 3,
      blurb:
        'Forty-one minutes recorded overnight in a decommissioned ferry terminal. Gulls, gangways, a vending machine that still hums. Released on 180g vinyl with a printed tide table.',
      credits: 'Recorded in situ · 6 contact mics · 1 night',
    },
    {
      id: 'choir',
      title: 'Choir for Empty Rooms',
      kind: 'Spatial installation',
      duration: '∞ loop',
      year: '2025',
      seed: 7,
      blurb:
        'An eight-channel piece that only performs when a room is nearly empty. Sensors count bodies; the fewer people, the more voices join in.',
      credits: '8 channels · 22 voices · reactive score',
    },
    {
      id: 'nocturne',
      title: 'Signal / Noise',
      kind: 'Sonic identity',
      duration: '0:04',
      year: '2025',
      seed: 11,
      blurb:
        'A four-second sound logo for Nocturne Lines, a fictional night-bus network. Built from a recorded door chime, slowed until it sounds like a lullaby.',
      credits: 'Sound logo · 140 system sounds · brand guidelines',
    },
    {
      id: 'hum',
      title: 'Hum Archive',
      kind: 'Ongoing collection',
      duration: '312 files',
      year: '2023–',
      seed: 17,
      blurb:
        'Fridges, transformers, streetlights, escalators. A public catalogue of the background drones of one city, tagged by pitch so you can play the city like an instrument.',
      credits: 'Open archive · tagged by pitch · CC BY-NC',
    },
  ],
  notes: 'We don’t make things louder. We make them clearer.',
  frequencies: [
    { hz: '60 Hz', label: 'Sonic identity', level: 0.86 },
    { hz: '440 Hz', label: 'Score & composition', level: 0.64 },
    { hz: '2 kHz', label: 'Spatial installation', level: 0.92 },
    { hz: '12 kHz', label: 'Field recording', level: 0.48 },
  ],
};

export const FILM = {
  scenes: [
    {
      id: 'opening',
      code: 'SC.00',
      title: 'Every frame is a decision.',
      kind: 'Opening titles',
      year: 'PERSPECTIVE Pictures',
      still: 'opening',
      caption: 'A studio for moving image. We direct, design titles and make the slow kind of documentary.',
      runtime: '00:00:00',
    },
    {
      id: 'corridor',
      code: 'SC.01',
      title: 'The Long Corridor',
      kind: 'Short film · 14 min',
      year: '2026',
      still: 'corridor',
      caption:
        'A night porter walks the same hotel corridor for eleven years. Shot in a single real-time take on a 24mm lens.',
      runtime: '00:14:06',
    },
    {
      id: 'afterlight',
      code: 'SC.02',
      title: 'Afterlight',
      kind: 'Title sequence',
      year: '2025',
      still: 'afterlight',
      caption:
        'Ninety seconds of type dissolving into a sunset that never quite ends. Opening titles for a fictional limited series.',
      runtime: '00:01:30',
    },
    {
      id: 'windows',
      code: 'SC.03',
      title: 'Ninety Windows',
      kind: 'Documentary · 52 min',
      year: '2025',
      still: 'windows',
      caption:
        'One tower block, filmed for a year from the tower opposite. With permission, ninety households let us watch their lights.',
      runtime: '00:52:00',
    },
    {
      id: 'moons',
      code: 'SC.04',
      title: 'Paper Moons',
      kind: 'Stop-motion · 6 min',
      year: '2024',
      still: 'moons',
      caption: '4,320 hand-cut paper moons, photographed one frame at a time on a kitchen table.',
      runtime: '00:06:00',
    },
    {
      id: 'credits',
      code: 'END',
      title: 'Credits',
      kind: 'What we do',
      year: '',
      still: 'credits',
      caption: 'Direction · Title design · Documentary · Animation · Colour',
      runtime: '00:00:00',
    },
  ],
  credits: [
    ['Direction', 'Narrative shorts & commercials'],
    ['Title Design', 'Openings, end crawls, lettering'],
    ['Documentary', 'Long-form, observational, slow'],
    ['Animation', 'Stop-motion, paper, practical'],
    ['Colour', 'Grading & finishing'],
    ['Catering', 'Whoever is closest to the kettle'],
  ],
};

export const CULTURE = {
  issue: 'No. 07',
  season: 'Autumn 2026',
  theme: 'Public Rooms',
  hero: ['Culture', 'is a verb.'],
  standfirst:
    'PERSPECTIVE Culture is our quarterly of essays, photo stories and gatherings about the places people share — and the small rituals that keep them alive.',
  filters: ['All', 'Essay', 'Photo', 'Guide', 'Food', 'Event'],
  stories: [
    {
      id: 'video-shop',
      cat: 'Essay',
      title: 'The Last Video Shop on Harrow Street',
      dek: 'Its owner still writes recommendations by hand. We spent a week behind the counter.',
      by: 'Words by M. Okafor',
      read: '12 min',
      size: 'feature',
      art: 'stripes',
    },
    {
      id: 'club-kids',
      cat: 'Photo',
      title: 'Club Kids, Grown Up',
      dek: 'Portraits of the regulars from a basement night that closed in 2009 — then and now.',
      by: 'Photographs by R. Lindqvist',
      read: '24 images',
      size: 'tall',
      art: 'dots',
    },
    {
      id: 'signage',
      cat: 'Guide',
      title: 'A Field Guide to Bad Signage',
      dek: 'Hand-lettered, misspelled, sun-bleached. A taxonomy of the city’s most honest typography.',
      by: 'Compiled by the studio',
      read: '8 min',
      size: 'wide',
      art: 'type',
    },
    {
      id: 'lunch',
      cat: 'Food',
      title: 'Open Kitchen',
      dek: 'Six recipes from studio lunch, where whoever cooks gets to pick the music.',
      by: 'Recipes by the team',
      read: '6 recipes',
      size: 'small',
      art: 'circle',
    },
    {
      id: 'reading-room',
      cat: 'Event',
      title: 'Reading Room, After Hours',
      dek: 'Thursdays in the studio basement. Bring a book; leave with someone else’s.',
      by: 'Thu 05 Nov · 19:00',
      read: 'Free',
      size: 'small',
      art: 'grid',
    },
    {
      id: 'bus-shelter',
      cat: 'Essay',
      title: 'In Praise of the Bus Shelter',
      dek: 'The most democratic piece of architecture in any city is three panes of glass and a bench.',
      by: 'Words by A. Ferreira',
      read: '9 min',
      size: 'wide',
      art: 'arch',
    },
    {
      id: 'markets',
      cat: 'Photo',
      title: 'Night Markets in Off-Season',
      dek: 'What remains of the summer market when the stalls go home: chalk marks, tarps and one loyal lamp.',
      by: 'Photographs by J. Moreau',
      read: '16 images',
      size: 'small',
      art: 'dots',
    },
  ],
  quote: {
    text: 'A city is just a lot of rooms that agree to share their walls.',
    by: 'From “In Praise of the Bus Shelter”',
  },
  ticker: [
    'New issue: Public Rooms',
    'Reading Room returns Thursday',
    'Open call: send us your worst sign',
    'Studio lunch is soup again',
    'Club Kids exhibition opens 14 Nov',
  ],
};

/**
 * What a returning visitor is offered. Each lens has its own list; one entry in each
 * deliberately crosses into a neighbouring lens, so returning can widen a visitor's view.
 */
export const DISCOVERIES = {
  sound: [
    {
      id: 'skylight',
      title: 'Side C: Skylight',
      kind: 'Unreleased sketch · 6:18',
      blurb:
        'Since you were last here we recorded the rain on the studio skylight for a whole night and kept six minutes of it.',
    },
    {
      id: 'frequency-walk',
      title: 'Frequency Walk',
      kind: 'Map + audio guide · 45 min',
      blurb:
        'A route through the city plotted by its loudest hums, from 50 Hz substations to a bakery extractor in B flat.',
    },
    {
      id: 'room-tone',
      title: 'Room Tone',
      kind: 'From our Film studio',
      blurb:
        'Listeners tend to love this one: sixty seconds of “silence” recorded in twelve cinemas before the projector starts.',
      crossTo: 'film',
    },
  ],
  film: [
    {
      id: 'directors-cut',
      title: 'Afterlight: the abandoned opening',
      kind: 'Director’s cut · 2:40',
      blurb:
        'Since your last visit we dug out the first version of the Afterlight titles — the one with the eclipse — and graded it properly.',
    },
    {
      id: 'single-take',
      title: 'Single-Take Saturdays',
      kind: 'New series · 1 shot, 1 minute',
      blurb: 'Every Saturday, one uncut minute from somewhere in the city. No edit, no music, no second chances.',
    },
    {
      id: 'rewind',
      title: 'Please Rewind',
      kind: 'From our Culture studio',
      blurb:
        'Viewers tend to stay for this: our essay on the last video shop on Harrow Street, and the handwritten recommendations inside.',
      crossTo: 'culture',
    },
  ],
  culture: [
    {
      id: 'issue-8-preview',
      title: 'Issue 08, early pages',
      kind: 'Preview · 4 stories',
      blurb: 'Since you were last here we started Issue 08, “Night Shifts”. Regular readers get the first four stories early.',
    },
    {
      id: 'sign-submissions',
      title: 'Your worst signs',
      kind: 'Reader submissions · 61 photos',
      blurb: 'The open call worked. Sixty-one readers sent us the most beautifully wrong signs in their neighbourhoods.',
    },
    {
      id: 'hum-archive',
      title: 'The Hum Archive',
      kind: 'From our Sound studio',
      blurb:
        'Readers tend to fall for this: 312 recordings of the city’s background drones — fridges, escalators, streetlights — tagged by pitch.',
      crossTo: 'sound',
    },
  ],
};

/** Where someone new to a lens should start (used when a returning visitor changes direction). */
export const STARTERS = {
  sound: {
    id: 'start-sound',
    title: 'Low Tide Sessions',
    kind: 'Start here · Track 01',
    blurb: 'Forty-one minutes inside a closed ferry terminal. Headphones on, then press play in the transport bar below.',
  },
  film: {
    id: 'start-film',
    title: 'The Long Corridor',
    kind: 'Start here · SC.01',
    blurb: 'Fourteen minutes, one take, one corridor. Use the timeline below — or your arrow keys — to move between scenes.',
  },
  culture: {
    id: 'start-culture',
    title: 'The Last Video Shop on Harrow Street',
    kind: 'Start here · Essay, 12 min',
    blurb: 'Our most-read story this issue. The contents and filters alongside will take you through the rest.',
  },
};

export function pickDiscovery(lens, seen = {}, visits = 1) {
  const list = DISCOVERIES[lens] || [];
  const seenIds = new Set(seen[lens] || []);
  const unseen = list.find((d) => !seenIds.has(d.id));
  return unseen || list[visits % list.length];
}
