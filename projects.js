/* Binz Tamang — project archive data
 *
 * Each project feeds one tile on the spatial rail (its coverImage) and one gallery in the
 * fullscreen viewer (its slides, shown in order, up to five).
 *
 * Every image is real work taken from the archive recording; nothing here is placeholder art.
 * Most projects have one image so far. To add more, append slides (up to five) to that
 * project's `slides` array: the viewer picks them up automatically, shows the arrows and
 * counter, and needs no other change.
 *
 *   { src: "assets/archive/fluid-02.webp", width: 1600, height: 1200, alt: "…", caption: "…" }
 *
 * width/height are the image's pixel size (only the ratio matters); they let the viewer lay
 * the slide out before it loads, so nothing jumps. caption is optional.
 *
 * Titles taken from text visible in the work are marked as such; the others are neutral
 * labels until real project names are added.
 */
window.BINZ_PROJECTS = [
  {
    id: "fluid",
    title: "Fluid", // from the album design shown in the recording
    coverImage: { src: "assets/archive/fluid.webp", width: 657, height: 474, alt: "Fluid: clear vinyl record with a lime label in an embossed white sleeve" },
    slides: [
      { src: "assets/archive/fluid.webp", width: 657, height: 474, alt: "Fluid: clear vinyl record with a lime label in an embossed white sleeve" },
    ],
  },
  {
    id: "photo-cards",
    title: "Project 02",
    coverImage: { src: "assets/archive/collage.webp", width: 653, height: 465, alt: "Printed photo cards with pink deckled edges laid out on a white surface" },
    slides: [
      { src: "assets/archive/collage.webp", width: 653, height: 465, alt: "Printed photo cards with pink deckled edges laid out on a white surface" },
    ],
  },
  {
    id: "mc-sleeve",
    title: "Project 03",
    coverImage: { src: "assets/archive/mc.webp", width: 342, height: 455, alt: "Black embossed sleeve with a photo of a figure in a red jacket" },
    slides: [
      { src: "assets/archive/mc.webp", width: 342, height: 455, alt: "Black embossed sleeve with a photo of a figure in a red jacket" },
    ],
  },
  {
    id: "leaf",
    title: "Project 04",
    coverImage: { src: "assets/archive/leaf.webp", width: 654, height: 462, alt: "Dark print with golden leaf shadows" },
    slides: [
      { src: "assets/archive/leaf.webp", width: 654, height: 462, alt: "Dark print with golden leaf shadows" },
    ],
  },
  {
    id: "quiet-gallery",
    title: "Quiet Gallery", // from the poster's own text
    coverImage: { src: "assets/archive/gallery.webp", width: 566, height: 226, alt: "Pink poster for a show at Quiet Gallery, Tokyo" },
    slides: [
      { src: "assets/archive/gallery.webp", width: 566, height: 226, alt: "Pink poster for a show at Quiet Gallery, Tokyo" },
    ],
  },
  {
    id: "heart-card",
    title: "Project 06",
    coverImage: { src: "assets/archive/heart.webp", width: 416, height: 452, alt: "Pink card with a heart-shaped window over a portrait, in clear packaging" },
    slides: [
      { src: "assets/archive/heart.webp", width: 416, height: 452, alt: "Pink card with a heart-shaped window over a portrait, in clear packaging" },
    ],
  },
  {
    id: "phone-portrait",
    title: "Project 07",
    coverImage: { src: "assets/archive/phone.webp", width: 638, height: 458, alt: "Portrait of a man on the phone beside a green payphone" },
    slides: [
      { src: "assets/archive/phone.webp", width: 638, height: 458, alt: "Portrait of a man on the phone beside a green payphone" },
    ],
  },
  {
    id: "iowa",
    title: "Project 08",
    coverImage: { src: "assets/archive/iowa.webp", width: 488, height: 176, alt: "White print with colourful hand-drawn characters and lettering" },
    slides: [
      { src: "assets/archive/iowa.webp", width: 488, height: 176, alt: "White print with colourful hand-drawn characters and lettering" },
    ],
  },
  {
    id: "interwoven",
    title: "Interwoven", // from the poster's own text
    coverImage: { src: "assets/archive/interwoven.webp", width: 648, height: 470, alt: "Interwoven: Hong Kong Art Meets London, event artwork in rust and black" },
    slides: [
      { src: "assets/archive/interwoven.webp", width: 648, height: 470, alt: "Interwoven: Hong Kong Art Meets London, event artwork in rust and black" },
    ],
  },
  {
    id: "seated-portrait",
    title: "Project 10",
    coverImage: { src: "assets/archive/chair.webp", width: 615, height: 228, alt: "Black-and-white portrait of a seated man in glasses" },
    slides: [
      { src: "assets/archive/chair.webp", width: 615, height: 228, alt: "Black-and-white portrait of a seated man in glasses" },
    ],
  },
];
