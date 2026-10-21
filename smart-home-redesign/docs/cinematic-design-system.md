# Cinematic — design system and rules

The Cinematic direction is an Apple-inspired language for product
storytelling: one typeface, two greys, one accent, and motion that only
ever explains the product.

Examples use **Relic Pocket**, a fictional handheld game console. The
system is product-agnostic, and none of its rules depend on the example.

- **Tokens:** `src/directions/apple/tokens.css` (CSS) and `tokens.js` (GSAP)
- **Implementation:** `src/directions/apple/apple.css`
- **Living style guide:** `system.html`, built from the same CSS and run with `npm run dev`

When a value in this document and a token disagree, the token wins. Fix
this document.

---

## 1. Principles

1. **One idea per viewport.** Each screen carries one headline, one object
   and at most one action. If a viewport needs two headlines, it needs two
   viewports.
2. **Space is the material.** Generous, consistent section rhythm. Empty
   space is never filled for its own sake.
3. **Two worlds, one accent.** *Stage* (black) is for drama and the
   product. *Paper* (light) is for detail and decisions. Blue marks actions,
   nothing else.
4. **Motion explains, never decorates.** Every animation demonstrates a
   product truth (the screen's sharpness, a save state, battery life). If
   you can't caption what an animation shows, cut it.
5. **Precision over flourish.** Decelerating curves, no bounce, no
   overshoot. Scroll-scrubbed so the reader stays in control.

---

## 2. Colour

### Worlds

| World | Background | Primary text | Secondary text | Raised surface |
|---|---|---|---|---|
| **Stage** | `--cn-black` `#000` | `--cn-paper` `#f5f5f7` | `--cn-muted` `#86868b` | `--cn-surface-dark` `#161617` + `--cn-ring-dark` |
| **Paper** | `--cn-paper` `#f5f5f7` / `--cn-paper-bright` `#fbfbfd` | `--cn-ink` `#1d1d1f` | `--cn-muted-ink` `#6e6e73` | `--cn-surface` `#fff` + `--cn-shadow-card` |

- Each section belongs to one world. Change worlds at a section boundary
  with a hard cut, or inside a pinned scene by scrubbing the section's own
  colour variables (a screen powering on, day turning to night). Never use
  a gradient between worlds.
- Greys don't cross worlds. **`--cn-muted` is Stage-only.** On Paper it
  measures 3.5:1 and fails small text. Use `--cn-muted-ink` on Paper.

### Accent

- `--cn-accent` (`#2997ff`) for links on Stage. `--cn-accent-ink`
  (`#0066cc`) for links on Paper and as the primary button fill.
- Hover goes **darker** (`--cn-accent-hover`, `#005bbf`), never lighter, so
  white button text stays at 6.5:1.
- The accent marks things you can act on. It is never used for headlines,
  large fills or decoration. One exception: a single product highlight per
  viewport, such as a power LED or the active save slot.
- `--cn-accent-wash` tints icon chips. That's its only use.

### Status

`--cn-live` (red), `--cn-warning` (orange) and `--cn-success` (green) carry
data meaning only. A status colour never stands alone: it always sits next
to a text label, because orange on white is only 2.1:1.

### White

`--cn-pure` appears only on imagery (video feeds, product shots) or on an
accent fill. Paper text is never pure white or pure black.

### Measured contrast (WCAG 2.x)

| Pair | Ratio | Use |
|---|---|---|
| ink on paper | 15.5 | All text |
| muted-ink on paper-bright | 4.9 | Secondary text on Paper |
| muted on black | 5.8 | Secondary text on Stage |
| muted on surface-dark | 5.0 | Secondary text in Stage cards |
| accent on black | 7.0 | Links on Stage |
| accent-ink on paper-bright | 5.4 | Links on Paper |
| white on accent-ink | 5.6 | Primary button |
| white on accent-hover | 6.5 | Primary button, hover |
| muted on paper-bright | 3.5 | ✕ Not allowed for text |

---

## 3. Typography

Typeface: **Inter Tight** (variable), bundled locally. One family, no
italics, no all-caps, no weights above 660.

| Role | Token | Size | Weight | Leading | Tracking |
|---|---|---|---|---|---|
| Display | `--cn-display-*` | 52 → 136px | 660 | 0.94 | −0.052em |
| H2 (section) | `--cn-h2-*` | 44 → 96px | 650 | 0.98 | −0.045em |
| H3 (sub-section) | `--cn-h3-*` | 32 → 56px | 640 | 1.02 | −0.04em |
| Card title | `--cn-title-*` | 22px | 640 | — | −0.03em |
| Eyebrow | `--cn-eyebrow-*` | 17 → 21px | 600 | — | −0.01em |
| Lede | `--cn-lede-*` | 18 → 22px | 500 | 1.38 | −0.016em |
| Control | `--cn-control-size` | 17px | 500 | — | body |
| Body | `--cn-body-*` | 16px | 400 | 1.42 | −0.011em |
| Meta | `--cn-meta-size` | 15px | 500 | — | tabular figures |
| Caption | `--cn-caption-size` | 12.5px | 500 | — | body |

Rules:

- **Display appears once per page**, in the hero. Section headlines use H2.
- Tracking tightens as size grows. Never track body text tighter than
  −0.011em, and never track anything positive.
- A section intro is always *eyebrow (optional) → H2 → lede → meta*,
  left-aligned. Only the hero is centred.
- Headlines run at most two lines on desktop. Break them by hand at the
  sense break (`Every pixel. / Exactly where you left it.`).
- Ledes cap at `--cn-lede-measure` (36ch) and use the world's secondary
  grey.
- Prices, times and counts use `font-variant-numeric: tabular-nums`.
- The display headline may use the top-lit metal gradient
  (`#fff → #a1a1a6`). Nothing else gets gradient text.

### Voice

Short declaratives. Sentence case. Headlines end with a full stop. No
exclamation marks, no "revolutionary", no "seamless". Say what the product
does in the reader's life: "Pick up where you left off.", not "Advanced
save-state functionality."

---

## 4. Space and layout

- Container: `--cn-container` (1180px) inside `--cn-gutter` (16 → 64px).
- **Section rhythm**
  - `--cn-space-section` above every section intro
  - `--cn-space-intro-after` between an intro and its content
  - `--cn-space-block` between blocks inside a section
- Component spacing uses the 4px scale `--cn-space-1…8`
  (4, 8, 12, 16, 24, 32, 48, 64).
- **Pinned stages** fill `100svh`. Their content starts below the nav
  (`--cn-nav-h` + 24–64px) or centres vertically. A stage must never read
  as empty while it scrolls in: reveal its heading before the pin begins.
- **Feature grids** use 6 columns. Three cards span 2 columns each, two
  cards span 3. On tablet, collapse to 2 columns with the odd card full
  width. On phones, use 1 column.
- **Cards in a row are equal height**, with the title and body anchored to
  the bottom so titles line up across the row.
- Text columns and media share the container's left edge. Don't indent
  one without the other.

---

## 5. Shape and elevation

| Token | Radius | For |
|---|---|---|
| `--cn-radius-pill` | 999px | Buttons, nav CTA, tags |
| `--cn-radius-sm` | 14px | Compact cards (mobile), icon chips (12px) |
| `--cn-radius-md` | 20px | List rows, notifications |
| `--cn-radius-lg` | 28px | Cards (tiles, plans) |
| `--cn-radius-xl` | 32px | Media frames |

- **Shadows exist only on Paper**: `--cn-shadow-card`, `-card-hover`,
  `-row`. On Stage, raise surfaces with tone (`--cn-surface-dark`) and a
  1px inner ring (`--cn-ring-dark`), never a shadow.
- **Glass** (`--cn-glass-dark` + `--cn-glass-blur`) is for the nav and for
  UI floating over imagery, such as notifications and video controls.
  Never use it on cards.

---

## 6. Components

| Component | Spec |
|---|---|
| **Primary button** `.ap-btn` | 44px tall, pill, 0 22px padding, `--cn-accent-ink` fill, 17/500 white. Hover darkens. Press `scale: .97` over 0.25s `--cn-ease-ui`. At most one per viewport. |
| **Link** `.ap-link` | Accent text, 17/500, chevron that nudges 3px right on hover, underline on hover. The secondary action next to a button. |
| **Nav** `.ap-nav` | 48px, sticky, dark glass, wordmark left, 12.5px links, pill "Buy" CTA. Links collapse below 720px. |
| **Section intro** | Eyebrow → `.ap-h2` → `.ap-lede` → `.ap-meta`. Lines rise through a mask on entry. |
| **Plan card** (Stage) | `--cn-surface-dark`, `--cn-ring-dark`, radius-lg. Name / includes / price (48px, tabular) / upfront note / "Choose" link. |
| **Feature tile** (Paper) | `--cn-surface`, `--cn-shadow-card`, radius-lg, min 248px tall. Icon in a 40px wash chip; title and body bottom-anchored. Hover lifts 4px with a pointer-tracked accent glow. |
| **Event row** | `--cn-surface`, `--cn-shadow-row`, radius-md. Status dot, then source · context (caption, muted-ink), then event (16/600), then time (tabular). |
| **Phone frame** `.phone` | Sized by `--phone-w`; every inner measure scales from it. Use it to show the app, not as decoration. |

---

## 7. Motion

### Curves

| Name | Definition | Use |
|---|---|---|
| `cine` | `cubic-bezier(0.16, 1, 0.3, 1)` | Every entrance and reveal |
| `cineInOut` | `cubic-bezier(0.65, 0, 0.35, 1)` | Scene changes, the direction curtain |
| `--cn-ease-ui` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Hover, press |
| `none` (linear) | — | Inside scrubbed timelines (scroll is the easing) |

**Never** use back, elastic or bounce curves, or overshoot of any kind. They
belong to the Playful direction.

### Timing (`tokens.js`)

| Token | Value | For |
|---|---|---|
| `DURATION.text` | 1.5s | Headline lines rising through a mask |
| `DURATION.support` | 1.2s | Eyebrow, lede, CTAs after a headline |
| `DURATION.object` | 2.4s | Product art arriving |
| `STAGGER.lines` | 0.1s | Between headline lines |
| `STAGGER.items` | 0.08s | Between sibling items |
| `SCRUB.local` / `.story` | 0.6 / 0.8 | Scroll smoothing |

Section intros trigger at `top 72%`, about a quarter of the way into
view. Small items (chips, tiles) trigger at `top 88–90%`, so they're
already arriving as they appear.

### Patterns

- **Text reveal:** split into lines (`LINE_SPLIT`); each line rises from
  `yPercent: 125` (`LINE_FROM`) through an overflow mask. The mask is
  padded 0.16em below (the parent of `.cn-line`, in `base.css`) so descenders aren't clipped at
  tight leading. Never reveal text through an unpadded mask. Never animate per character, never scale text,
  never blur text.
- **Image reveal:** the frame opens from a cropped inset
  (`clip-path: inset(12% 14% round 48px)`) to full while the product
  inside drifts the other way. Parallax applies to products only, never to
  text, and stays within ±15%.
- **Pinned story:** at most three acts, about one viewport of scroll per
  act plus a short hold (`PIN_PER_ACT`). Each act changes one idea and one
  line of copy. Show progress (the three-bar indicator) for multi-act
  scenes.
- **Counting:** numbers that are the point (1440p, 12 hours) count up
  within an act. Prices never animate.
- **Loops** (a screen's idle animation, status pings) run only while
  their scene is in view.
- **Boot sequences:** a device screen goes from off, to a logo with a
  progress bar, to content. Scrub it on a pinned hero; play it once when
  it arrives anywhere else.

### Engineering rules

- Animate only `transform`, `opacity` and `clip-path` (plus scrubbed
  colour variables for world changes).
- **Never put a CSS `transition` on `transform` for an element GSAP
  animates.** Use the individual `translate`, `scale` and `rotate`
  properties for hover and press. A transition on `transform` makes GSAP
  read a half-finished value as the resting state, and the element stays
  stuck out of alignment.
- Every component builds its timelines inside `useGSAP` with a scope, so
  unmounting reverts everything.

---

## 8. Accessibility

- **Reduced motion is a separate layout, not shorter animations.** With
  `prefers-reduced-motion` (or the dock's Still switch), every section
  renders a static layout in reading order. There is no pinning, no
  scrubbing, loops are paused, and every act's content is visible.
- Text contrast follows §2. Every pair in use meets WCAG AA (4.5:1 for text).
- Focus: 2px accent outline at 3px offset on every interactive element.
- Hit targets are at least `--cn-control-h` (44px).
- Decorative art is `aria-hidden`. Real content (steps, events, plans)
  stays in the DOM as text in reading order, even when the visuals
  animate it.

---

## 9. Don't

- Don't add a second accent colour, or tint whole sections with the accent.
- Don't use the Display size anywhere but the hero.
- Don't centre section intros.
- Don't put shadows on Stage, or glass on cards.
- Don't animate anything that isn't demonstrating the product.
- Don't use bounce, elastic, overshoot, or per-character text effects.
- Don't put `#86868b` text on Paper.
- Don't make a pinned scene longer than three acts.
- Don't animate prices.
