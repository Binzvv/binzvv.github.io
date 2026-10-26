# Sky homepage: concept redesign

A working prototype of **sky.com's main homepage**, reimagined as a multi-product story in the style of apple.com/uk. It's built in Sky's own visual language and it's a concept, not an official Sky website.

- **Source:** `sky-redesign/` (React 18, Tailwind 3, GSAP 3 + ScrollTrigger, Vite)
- **Build output:** `/sky` at the repo root, served by GitHub Pages at `/sky/` once merged
- **Run:** `cd sky-redesign && npm install && npm run dev`. `npm run build` writes to `../sky`.

## What could and couldn't be inspected
This build environment's network policy blocks sky.com, apple.com, web archives and image hosts, so the **live homepage, its imagery and its current offers were not inspected**. To let a future session inspect them, add `www.sky.com` and `www.apple.com` under Allowed domains in the cloud environment's network settings.

Product messaging was verified through web search, and only verified claims are used:

| Claim on the page | Source |
|---|---|
| "Goodbye dish." / Sky TV streamed to any TV over Wi‑Fi | Sky's own deals page ("Sky Ultimate TV, streamed to any TV over WiFi. Goodbye dish.") |
| Sky Essential TV includes Sky Atlantic, Netflix (Standard with ads) and discovery+ | Sky help pages |
| Broadband of at least 25Mbps needed for Glass / Stream | Sky help pages |
| At least 215 live Premier League matches a season | Premier League rights award, Aug 2025 to May 2029 |
| Every F1 race live; Sky Sports F1 is the UK home of F1 until 2034 | Rights reporting, 2026 |
| Glass Gen 2: 43/55/65", Volcanic Grey / Atlantic Blue / Arctic Silver, 4K Quantum Dot, Dolby Atmos | Gen 2 launch coverage, Feb 2025 |
| Glass Air: 4K HDR Quantum Dot, Sky OS, hands-free voice, positioned as a second TV | Glass Air launch coverage, June 2025 |
| Stream: puck over HDMI and Wi‑Fi, 4K HDR with Dolby Vision | Stream launch coverage |
| Full Fibre up to 5Gbps (Gigafast+ on CityFibre), Wi‑Fi 7 hub | ISPreview / Expert Reviews, 2025–26 |
| Unused data rolls into Piggybank for up to three years | Sky Mobile reviews, 2026 |

**Not used:** any price, offer, bundle or promo end date (sources conflict and go out of date), plus Sky's licensed assets (Sky Text fonts, wordmark, Skycons, photography, key art).

**Unverified links:** `/stream` and `/mobile` on sky.com are guessed paths. `/deals`, `/deals/sports`, `/broadband`, `/tvandbroadband`, `/glass` and `/help` were seen in search results.

## Audit: hypotheses about the current sky.com homepage
These come from prior knowledge and need checking against the live page:
- **Commerce competes everywhere.** Several price-led offers, each with its own asterisk and CTA, sit above the fold and through the page.
- **Equal-weight modules.** Tabs, deal grids, icon strips and help links all have the same visual weight, so no product leads.
- **Motion cycles content instead of telling a story.** Carousels rotate offers.
- **Products sit in boxes.** Imagery is rarely full-bleed or shown at physical scale.
- **Assembled, not composed.** Nothing carries from one section to the next.

## The new composition
Apple's multi-product homepage pattern: a sequence of art-directed campaigns, a 2-up pair, then an index of everything. The story moves from **watch → play → screens → connect → carry → choose**.

| # | Campaign | Art direction | Signature motion (each used once) |
|---|---|---|---|
| 1 | **Sky TV** "Goodbye dish." | Cinematic night, picture fills the viewport | Pinned camera pull-back from the picture to the TV |
| 2 | **Entertainment** | Pure typography on black | Statement lights up word by word; channel names pass like credits, rows drifting against each other |
| 3 | **Sky Sports** | Floodlit pitch, deep green | Pinned: the pitch dollies in while the live-match count runs to 215; the F1 line lands |
| 4 | **Sky Glass Gen 2** | Daylit room | "Lights on" colour handoff; finish and size change the TV in place |
| 5 | **Sky Stream / Sky Glass Air** | 2-up tiles, warm stone and soft sea green | Cable draws into "your TV"; Glass Air's screen powers on |
| 6 | **Sky Broadband** | The house at night, Sky blue | Wi‑Fi rings grow from the hub; each device lights as the ring reaches it |
| 7 | **Sky Mobile** | Bright, graphic | Each month's unused data lifts into Piggybank, which fills |
| 8 | **All of Sky** | Editorial index | Hover or focus: the row shifts, its line appears, the others step back |

**What carries across:** each section's background starts as the colour of the one before and shifts as it arrives (`bgShift`). There's one easing family (`expo.out` for arrivals, `power2.inOut` for camera moves), one pill-and-chevron interaction language, and Sky blue on interactive elements only.

**Pacing:** only two pinned moments (the TV hero and Sports). Everything else scrubs with native scroll. Commerce has one calm place at the end, plus a "See deals" link in each campaign.

## Accessibility and motion
- **Structure and navigation:** semantic landmarks, a skip link and labelled sections. Flyouts work by hover, click or Enter, and Escape closes them. The mobile menu is a modal dialog.
- **Controls:** swatches and sizes are `aria-pressed` buttons with a live summary.
- **Screen readers:** the animated numeral has a screen-reader sentence, and the decorative channel rows are hidden behind an accessible list.
- **Reduced motion:** with `prefers-reduced-motion`, there are no pins, scrubs or entrance animations, and every final state shows immediately.

## Using real Sky imagery
Toggle **Concept → Asset slots** to outline every stand-in. Put licensed files in `public/assets/` and set their paths in `ASSETS` in `src/content.js`. Each slot then renders the image instead of its stand-in.
