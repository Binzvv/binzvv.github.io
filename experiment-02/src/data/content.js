// Curated content for the prototype.
// Every image is a procedural "plate" (clearly labelled placeholder). To use real
// photography, add `src: './images/your-file.jpg'` to an item — the Plate component
// will use it and fall back to the placeholder if it fails to load.

export const MODES = {
  escape: {
    id: 'escape',
    word: 'ESCAPE',
    verb: 'Disconnect',
    line: 'Space. Quiet. Nobody watching.',
    // tempo drives every transition in this world
    tempo: { duration: 2.4, ease: [0.22, 1, 0.36, 1] },
    drift: 60, // seconds for one ambient plate drift cycle
    bg: '#E4E5E1',
    ink: '#1B1D1C',
    wdth: 125,
    wght: 260,
  },
  push: {
    id: 'push',
    word: 'PUSH',
    verb: 'Intensity',
    line: 'Effort, on purpose.',
    tempo: { duration: 0.45, ease: [0.7, 0, 0.2, 1] },
    drift: 14,
    bg: '#0E0E0C',
    ink: '#EDEBE5',
    wdth: 62,
    wght: 880,
  },
  wander: {
    id: 'wander',
    word: 'WANDER',
    verb: 'Discovery',
    line: 'Take the long way. Then a longer one.',
    tempo: { type: 'spring', stiffness: 70, damping: 20, mass: 1 },
    drift: 32,
    bg: '#DCD3C4',
    ink: '#24211C',
    wdth: 100,
    wght: 520,
  },
}

export const MODE_ORDER = ['escape', 'push', 'wander']

// plate: sky (top→horizon), haze, ground (near→far), horizon %, sun position, ridge seed
export const STORIES = [
  // ───────────────────────── ESCAPE — landscapes, few words
  {
    id: 'e-fog-ridge',
    mode: 'escape',
    title: 'Fog Ridge',
    place: 'Highland plateau, early',
    line: 'The path is there. The rest is optional.',
    body: [
      'Above the treeline the fog decides how far you can see. Usually: the next ten metres. That turns out to be enough.',
      'There is no split to hit and no one to pass. Breathing finds its own count. You stop narrating and start noticing — the wet grass, the sound your shoes make on stone, the way the light arrives sideways.',
    ],
    deeper:
      'Run it without a watch once. Out for as long as it feels right, back the same way. The only data that matters is whether you want to go again tomorrow.',
    plate: { sky: ['#B9C0C2', '#DDE0DC'], haze: '#E7E8E3', ground: ['#5A625D', '#2E3431'], horizon: 58, sun: [70, 38], seed: 3, ridge: 0.5 },
  },
  {
    id: 'e-salt-flat',
    mode: 'escape',
    title: 'Salt Line',
    place: 'Dry lake bed, late afternoon',
    line: 'Flat, white, and entirely yours.',
    body: [
      'Nothing to climb, nothing to turn. A line drawn on a surface that reflects the sky back at itself.',
      'Distance stops meaning anything when the horizon never moves. You run until you feel like turning around, which is the most honest training plan there is.',
    ],
    deeper:
      'Go late, when the heat breaks and the shadows lengthen to ten times your height. Carry water. Tell someone where you went. Then leave the phone in the car.',
    plate: { sky: ['#C9C3B6', '#EEE7DA'], haze: '#F3EDE2', ground: ['#D9D2C4', '#B8B0A2'], horizon: 64, sun: [24, 52], seed: 9, ridge: 0.08 },
  },
  {
    id: 'e-pine-coast',
    mode: 'escape',
    title: 'Pine Coast',
    place: 'North shore, after rain',
    line: 'Resin, salt, and the sound of your own feet.',
    body: [
      'The trail follows the coast at the height of the trees. Through gaps in the pines: grey sea, grey sky, one gull.',
      'This is the run you do when the week has been loud. Ten minutes in, it gets quiet. Thirty minutes in, you forget to check anything.',
    ],
    deeper:
      'Soft ground forgives. Let your stride shorten on the roots and lengthen on the needles. You are not late for anything out here.',
    plate: { sky: ['#9EA8A6', '#C9CFCB'], haze: '#D3D8D3', ground: ['#2F3A34', '#1A211D'], horizon: 46, sun: [80, 20], seed: 17, ridge: 0.85 },
  },
  {
    id: 'e-long-valley',
    mode: 'escape',
    title: 'Long Valley',
    place: 'River bottom, blue hour',
    line: 'Follow the water. It knows the way down.',
    body: [
      'A valley is a set of instructions: stay low, follow the river, the walls will keep you company.',
      'In blue hour colour leaves first, then detail, then the sense that you are anywhere in particular. What is left is rhythm.',
    ],
    deeper:
      'Bring a light layer and a small torch. Turn it off for a minute at the furthest point. Listen to how big it is out there.',
    plate: { sky: ['#7F8C98', '#AEB6BC'], haze: '#B9C0C4', ground: ['#3A424A', '#1F252B'], horizon: 52, sun: [50, 60], seed: 23, ridge: 1 },
  },
  {
    id: 'e-open-moor',
    mode: 'escape',
    title: 'Open Moor',
    place: 'Moorland, wind from the west',
    line: 'No trail. Just direction.',
    body: [
      'Heather, peat, a cairn on the skyline that might be an hour away or ten minutes. The wind makes every decision feel shared.',
      'You do not finish a run like this. You simply decide you have had enough sky for one day.',
    ],
    deeper:
      'Pick a landmark, run to it, pick another. Navigation becomes a kind of attention you forgot you had.',
    plate: { sky: ['#A7A99F', '#D3D2C7'], haze: '#DAD8CE', ground: ['#5B5544', '#332F25'], horizon: 60, sun: [36, 30], seed: 31, ridge: 0.3 },
  },

  // ───────────────────────── PUSH — technical performance stories
  {
    id: 'p-stair-repeats',
    mode: 'push',
    title: 'Stair Repeats',
    place: 'Hillside city, 06:10',
    line: '212 steps. Up hard. Down easy. Again.',
    specs: [
      ['Terrain', 'Stone stairs, uneven rise'],
      ['Session', '10 × up · walk down'],
      ['Wear', 'Split short, mesh singlet'],
      ['Asks of you', 'Hips, lungs, honesty'],
    ],
    body: [
      'Stairs remove choice. The next step is always there and it is always the same height higher than this one.',
      'Drive the knee, land mid-foot, keep the eyes three steps ahead. On the way down, let everything go loose — the recovery is part of the work.',
    ],
    deeper:
      'Fatigue shows up in your arms first. When they drop, the session is telling you something. Finish the rep, then decide like an adult whether to do another.',
    plate: { sky: ['#6E6A64', '#A8A39A'], haze: '#B2ACA2', ground: ['#2A2725', '#121110'], horizon: 34, sun: [88, 12], seed: 41, ridge: 0.2, streak: true },
  },
  {
    id: 'p-headwind',
    mode: 'push',
    title: 'Headwind',
    place: 'Coastal road, force 6',
    line: 'Out against it. Home on it.',
    specs: [
      ['Terrain', 'Exposed tarmac, 8 km out'],
      ['Session', 'Steady effort, not steady pace'],
      ['Wear', 'Windproof shell, packable'],
      ['Asks of you', 'Patience, then nerve'],
    ],
    body: [
      'Wind makes pace meaningless and effort everything. Run by feel on the way out: shoulders down, small strong steps, eyes on the next lamppost.',
      'Turn around and the world goes silent. The wind is behind you now. This is where you find out how much you saved.',
    ],
    deeper:
      'A shell that packs to the size of a fist is the most underrated piece of kit you own. Zip it up at the turn, open it at the halfway home.',
    plate: { sky: ['#8D9396', '#C7CACA'], haze: '#D2D4D2', ground: ['#3B3D3D', '#161818'], horizon: 50, sun: [10, 40], seed: 47, ridge: 0.15, streak: true },
  },
  {
    id: 'p-night-tempo',
    mode: 'push',
    title: 'Night Tempo',
    place: 'Ring road underpass, 22:40',
    line: 'Sodium light. Even breathing. Twenty minutes of truth.',
    specs: [
      ['Terrain', 'Concrete loop, 1.6 km'],
      ['Session', '20 min comfortably hard'],
      ['Wear', 'Reflective trim, low-light layer'],
      ['Asks of you', 'Focus, for longer than is comfortable'],
    ],
    body: [
      'The city is mostly asleep. The loop is lit in long orange intervals and each light is a small checkpoint you set for yourself.',
      'Tempo is the conversation between what you can hold and what you want to hold. Settle in early. The last five minutes are where it counts.',
    ],
    deeper:
      'Be seen: reflective detailing on the back and the ankles moves, which is what drivers notice. Run against the traffic where there is no path.',
    plate: { sky: ['#1E1B18', '#3A2F24'], haze: '#6B4F33', ground: ['#1A1713', '#0A0908'], horizon: 56, sun: [62, 54], seed: 53, ridge: 0, streak: true },
  },
  {
    id: 'p-heat',
    mode: 'push',
    title: 'Heat',
    place: 'Desert road, before sunrise',
    line: 'Start in the dark. Finish before the sun wins.',
    specs: [
      ['Terrain', 'Rolling desert asphalt'],
      ['Session', 'Long run, conservative start'],
      ['Wear', 'Lightweight cap, open-knit tee'],
      ['Asks of you', 'Restraint'],
    ],
    body: [
      'Heat is not a challenge to win. It is a condition to respect. The plan is simple: leave early, drink before you are thirsty, slow down before you must.',
      'When the sun clears the ridge the road changes colour, and so does the run. Everything after that is about getting home well.',
    ],
    deeper:
      'Fabric matters most where it touches you: open knits move air, a light cap shades the eyes. Pre-cool with cold water on the neck and wrists.',
    plate: { sky: ['#C9A27E', '#EBD3B4'], haze: '#F1DEC3', ground: ['#7D5A3E', '#3D2A1D'], horizon: 62, sun: [50, 66], seed: 59, ridge: 0.45, streak: true },
  },
  {
    id: 'p-track-ladder',
    mode: 'push',
    title: 'Ladder',
    place: 'Municipal track, lane 4',
    line: '400 · 800 · 1200 · 800 · 400.',
    specs: [
      ['Terrain', 'Old rubber, faded lines'],
      ['Session', 'Up the ladder, back down'],
      ['Wear', 'Light shoe, short sock'],
      ['Asks of you', 'Rhythm under pressure'],
    ],
    body: [
      'The track is the most honest place in running. Same oval, same lines, nowhere to hide from your own effort.',
      'Climb the ladder controlled. Come down it with intent. The final 400 should feel like the reason you came.',
    ],
    deeper:
      'Run the bends tight and the straights tall. Recover by walking a full half lap — the quality of the next rep is the whole point.',
    plate: { sky: ['#7C8589', '#B7BDBE'], haze: '#C4C8C7', ground: ['#7A3A2A', '#3C1D15'], horizon: 40, sun: [20, 18], seed: 61, ridge: 0.1, streak: true },
  },

  // ───────────────────────── WANDER — cultural stories, threads
  {
    id: 'w-bakers-loop',
    mode: 'wander',
    title: "The Bakers' Loop",
    place: 'Old port city, 05:00',
    line: 'A route that follows the smell of the first ovens.',
    body: [
      'Before dawn the old town belongs to delivery vans and bakers in white. One runner we know maps her route by which doors are open and warm.',
      'It is not efficient. It doubles back twice and climbs an alley that goes nowhere. It ends, without fail, at a counter where someone already knows her order.',
    ],
    deeper:
      'Good routes are built from places, not distances. Next time, pick three doors you want to pass and connect them however the streets allow.',
    threads: ['w-rooftop-club', 'w-ferry-run'],
    plate: { sky: ['#8A8F94', '#C9C2B4'], haze: '#D8CDB8', ground: ['#5C4B3B', '#2C231B'], horizon: 44, sun: [74, 46], seed: 71, ridge: 0.35 },
    pos: [24, 24], size: 'l',
  },
  {
    id: 'w-ferry-run',
    mode: 'wander',
    title: 'Run, Ferry, Run',
    place: 'Island archipelago',
    line: 'Two islands, one timetable, no plan.',
    body: [
      'The rule: run to the ferry, cross, run the far island until the next boat home. If you miss it, you get to know the island better.',
      'People who do this talk less about pace and more about the bar by the slipway, the dog that follows them, the bench where they wait.',
    ],
    deeper:
      'Constraints make the best adventures. A timetable, a tide, a closing time — let something other than a watch decide the shape of the run.',
    threads: ['w-bakers-loop', 'w-lava-field'],
    plate: { sky: ['#9CA6AA', '#D2D5D0'], haze: '#DCDDD6', ground: ['#476068', '#24343A'], horizon: 52, sun: [30, 34], seed: 79, ridge: 0.25 },
    pos: [46, 22], size: 'm',
  },
  {
    id: 'w-rooftop-club',
    mode: 'wander',
    title: 'Rooftop Club',
    place: 'Dense city, Thursdays',
    line: 'A crew that only runs routes with a view at the end.',
    body: [
      'They meet at a different stairwell each week. Nobody posts the route. You find out where you are going by following the person in front.',
      'The run ends on a roof — a car park, a church step, a public terrace — and the club’s only tradition is ten minutes of saying nothing while the city lights up.',
    ],
    deeper:
      'Every city has a high point you have never been to. Find yours. Make it the turnaround.',
    threads: ['w-bakers-loop', 'w-concrete-forest'],
    plate: { sky: ['#5E6269', '#A79C92'], haze: '#C1AE98', ground: ['#3B3A3C', '#1B1A1C'], horizon: 60, sun: [56, 58], seed: 83, ridge: 0.6 },
    pos: [68, 28], size: 's',
  },
  {
    id: 'w-lava-field',
    mode: 'wander',
    title: 'Black Ground',
    place: 'Volcanic coast',
    line: 'Moss on lava. Your footsteps sound different here.',
    body: [
      'The ground is young — younger than some of the people who run on it. Green moss over black rock, soft as a mattress, sharp underneath.',
      'You go slowly. Not because you are tired, but because every few minutes something asks to be looked at properly.',
    ],
    deeper:
      'Stay on marked paths where moss grows; it takes decades to recover from a single footprint. The best places ask for a light touch.',
    threads: ['w-ferry-run', 'w-concrete-forest'],
    plate: { sky: ['#8E9799', '#C2C7C4'], haze: '#CDD0CB', ground: ['#4F5C3E', '#1A1D16'], horizon: 48, sun: [18, 26], seed: 89, ridge: 0.7 },
    pos: [26, 66], size: 'm',
  },
  {
    id: 'w-concrete-forest',
    mode: 'wander',
    title: 'Concrete Forest',
    place: 'Post-war estate',
    line: 'Brutalism, at running speed.',
    body: [
      'Walkways in the sky, ramps that lead to ramps, a fountain no one has turned on in years. Architecture designed for walking turns out to be perfect for running.',
      'Locals nod. Kids race you for twenty metres. You leave knowing a place you have driven past for a decade.',
    ],
    deeper:
      'Run the buildings, not the roads. Stairs, ramps and underpasses make a route three-dimensional — and quieter than any park.',
    threads: ['w-rooftop-club', 'w-lava-field'],
    plate: { sky: ['#A3A39D', '#CFCCC2'], haze: '#D7D3C8', ground: ['#6E6A62', '#3C3934'], horizon: 36, sun: [86, 22], seed: 97, ridge: 0.05 },
    pos: [56, 50], size: 'l',
  },
]

// A curated surprise: appears in WANDER only after the visitor has opened three stories.
export const SURPRISE = {
  id: 'w-no-route',
  mode: 'wander',
  title: 'The Route That Isn’t',
  place: 'Wherever you are',
  line: 'The best discovery is usually the street next to yours.',
  body: [
    'You have wandered through ports, islands, rooftops and lava. Here is the one place we cannot show you: the turning you always walk past.',
    'Leave the door, go left where you normally go right, and keep making the less obvious choice for twenty minutes. Then find your way home.',
  ],
  deeper: 'That is the whole story. The rest is yours.',
  threads: [],
  plate: { sky: ['#B4AC9E', '#E2D9C8'], haze: '#E9E0CF', ground: ['#8A7A62', '#4A3F31'], horizon: 50, sun: [50, 44], seed: 101, ridge: 0.4 },
  pos: [82, 70], size: 's',
  surprise: true,
}

export const ALL = [...STORIES, SURPRISE]
export const byId = (id) => ALL.find((s) => s.id === id)
export const storiesFor = (mode) => STORIES.filter((s) => s.mode === mode)
