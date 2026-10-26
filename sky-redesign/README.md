# Sky homepage: concept redesign

A working prototype of the Sky UK homepage with Apple-level restraint, pacing and motion, built in Sky's own visual language. It's a concept, not an official Sky website.

- **Source:** `sky-redesign/` (React 18, Tailwind 3, GSAP 3 + ScrollTrigger, Vite)
- **Build output:** `/sky` at the repo root, served by GitHub Pages at `/sky/` once merged
- **Run:** `cd sky-redesign && npm install && npm run dev`. `npm run build` writes to `../sky`.

## 1. Audit

### What could and couldn't be checked
The build environment couldn't reach sky.com or apple.com (the network policy blocked them). So the live homepage, its imagery and its current offers were **not inspected**.

| Verified (search results and Sky UI foundations) | Not verified, so not used |
|---|---|
| Sky Glass Gen 2: 43/55/65", Volcanic Grey, Arctic Silver, Atlantic Blue; brighter 4K Quantum Dot; Dolby Atmos; Sky OS with "Hello Sky" | Any current price, offer, bundle or promo code |
| Glass and Stream stream over broadband with no dish (25Mbps minimum); Stream is a puck over HDMI and Wi‑Fi | Current homepage hero campaign and its imagery |
| Sky Essential TV includes Sky Atlantic, Netflix Standard with ads, and discovery+ | Exact current nav labels and order |
| Sky UI tokens: `#000ff5` for interaction only, sentence case, 18/28 body, pill buttons, focus ring `#007ecc` | Sky Text fonts, Sky wordmark, Skycons, product photography (all licensed) |
| Feature lines on sky.com/glass: "personal playlist TV", "voice control TV", "auto‑adjusting TV", "No dish. No box. No fuss." | Exact sky.com URLs for Stream, Broadband and Mobile (the prototype links to likely paths) |

### Observations (hypotheses from prior knowledge of sky.com, to check against the live page)
- **Fragmented hierarchy.** Price-led offer tiles get the same visual weight as product stories, so nothing leads.
- **Competing commerce.** Several offers, each with its own price, asterisk and CTA, sit above the fold.
- **Density.** Product tabs, icon strips, deal grids and help links are stacked with uniform spacing. There's no rhythm change and no breathing room.
- **Motion.** Carousels rotate offers. Motion cycles content instead of explaining a product.
- **Imagery.** Products sit inside boxed cards and are rarely shown full-bleed or at a real physical scale.
- **Navigation.** A broad mega-menu repeats destinations that the page body also promotes.
- **Assembled components.** Each module is self-contained, with no visual thread from one section to the next.

**Apple's approach, in contrast:** one product per screen, two CTAs at most, full-bleed alternating light and dark bands, scroll-linked reveals that explain the hardware, and commerce saved for the end.

## 2. Creative direction: "lit from the screen"
Sky's spectrum is treated as **light**, never as type colour. The page opens inside a screen and pulls back to reveal the product. Dark, cinematic bands (content) alternate with daylit editorial bands (hardware and home). The light from the hero carries through: statement words light up as you read, and the Sky Glass room "switches on" as it scrolls in.

### The three most important improvements
1. **One hero, one idea, one CTA.** A pinned pull-back from a full-bleed picture to Sky Glass replaces the rotating offer carousel.
2. **Motion that explains.** Size buttons scale the TV against fixed furniture. Finish swatches recolour the frame and tint the room. Four pinned Sky OS states each change the screen. The Stream cable draws itself into "your TV". Wi‑Fi rings fill the house.
3. **Commerce steps back.** Deals and existing-customer tasks get one calm closing section.

## 3. Principles in the build
| Principle | Where |
|---|---|
| One idea at a time | Each section has one headline and at most one primary button |
| Product first | The hero ends on the product; the finishes stage shows Glass at physical scale |
| Motion with purpose | Pull-back (content → product), size scaling, finish change, OS states, cable draw, coverage rings |
| Controlled pacing | Dark/light alternation; 160px desktop section padding; a 0.25 "rest" at the end of each pinned timeline |
| Premium, not generic minimalism | Spectrum light, Sky blue CTAs, Sky's own feature phrasing, colourful channel panels |
| Effortless interaction | Native scroll (no smooth-scroll library), gentle label snapping in one pinned section only, one easing family |

### Motion system
- `expo.out` for arrivals, `power2.inOut` for scrubbed camera moves. Durations are 0.35 / 0.9 / 1.4s.
- Only transform and opacity animate, with two exceptions: the clip-path reveal on the channel panels (runs once) and the SVG ring radii.
- Two pinned sections: the hero (desktop +140%, mobile +110%) and Sky OS (desktop only). Mobile and reduced-motion users get a stacked Sky OS with no pinning.
- With `prefers-reduced-motion`, there are no pins, scrubs or entrance animations, and CSS transitions are reduced to ~0ms. Every state is still reachable.

## 4. Accessibility
Semantic landmarks, a skip link, and labelled sections. The desktop flyouts open on hover with intent delay, or on click / Enter, and Escape returns focus. The mobile sheet is a modal dialog that locks scroll and closes on Escape. Swatches and sizes are `aria-pressed` buttons, with an `aria-live` summary. Channel panels expand on keyboard focus. Focus rings are 2px `#007ecc` (white on dark).

## 5. Asset slots
Use the **Concept → Asset slots** toggle to outline every place a licensed asset should replace a stand-in: hero key art, Sky Glass and Stream photography, room photography, Sky OS captures, channel key art, handset imagery and the Sky wordmark. Fonts fall back from Sky Text to Figtree. Finish hex values are illustrative.
