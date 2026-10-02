/**
 * Everything replaceable lives here. Swap images / type freely —
 * the scenes read from this object and re-layout on build.
 */
window.MOTION_CONFIG = {
  // Dev controls (play/pause + scrub). Set false for the final build, or add ?dev=0 to the URL.
  dev: true,

  colors: {
    ink: '#0e0f12',   // background
    paper: '#e6e8ec'  // type / type plate
  },
  font: '"Inter", system-ui, Arial, sans-serif',

  type: {
    headline: ['WEBFLOW', '+ GSAP'], // big slammed / cropped lines
    tile: 'WEBFLOW + GSAP',          // tiny repeated tile in the opening grid
    whisper: 'GSAP',                 // single word in the empty-black beat
    flood: null                      // array of lines for the text flood; null = built from headline + tile
  },

  // Image planes. Any number ≥ 1; scenes cycle through them.
  images: [
    { src: 'https://picsum.photos/id/1015/1600/1000', alt: 'Mountain lake' },
    { src: 'https://picsum.photos/id/1025/1600/1000', alt: 'Dog portrait' },
    { src: 'https://picsum.photos/id/1003/1600/1000', alt: 'Desert dunes' },
    { src: 'https://picsum.photos/id/1005/1600/1000', alt: 'Forest road' },
    { src: 'https://picsum.photos/id/1035/1600/1000', alt: 'Cliff and sea' }
  ],
  heroImage: 2,   // index of the image that takes over the full frame

  // Card plane look (scale relative to the full frame, corner radius in on-screen px)
  card: { scale: 0.42, small: 0.24, radius: 22 },

  // Seed for the deliberate timing imperfection — same seed = identical loop every pass.
  seed: 7,
  jitter: 0.18,

  // Scene order. Reorder, repeat or remove; each id maps to a factory in scenes.js.
  sequence: ['grid', 'slam', 'stack', 'takeover', 'void', 'flood', 'smallStack', 'black']
};
