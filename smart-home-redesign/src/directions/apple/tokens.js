// Cinematic motion tokens (GSAP side). CSS mirrors the UI curves in
// tokens.css. Rules for using them: docs/cinematic-design-system.md.

export const EASE = {
  // Long, soft deceleration. Every entrance and reveal.
  cine: 'M0,0 C0.16,1 0.3,1 1,1',
  // Symmetric. Scene changes and the direction curtain.
  cineInOut: 'M0,0 C0.65,0 0.35,1 1,1',
  // Hover and press. CSS twin: --cn-ease-ui.
  ui: 'M0,0 C0.2,0.8 0.2,1 1,1',
};

export const DURATION = {
  text: 1.5, // Headline lines rising through a mask
  support: 1.2, // Eyebrows, ledes, CTAs following a headline
  object: 2.4, // Product art arriving on stage
};

export const STAGGER = {
  lines: 0.1, // Between headline lines
  items: 0.08, // Between siblings (CTAs, tiles, chips)
};

// Line reveals. Masks are padded below (the parent of .cn-line in base.css) so
// descenders survive tight leading; lines start far enough down to clear
// that padding.
export const LINE_SPLIT = { type: 'lines', mask: 'lines', linesClass: 'cn-line' };
export const LINE_FROM = 125; // yPercent

// Scrub smoothing for scroll-linked timelines. 0.6 for short, local
// scenes; 0.8 for long pinned stories.
export const SCRUB = { local: 0.6, story: 0.8 };

// Pinned scene length, as a share of viewport height per act. A scene
// should run roughly one viewport per act, plus a short hold.
export const PIN_PER_ACT = 100;
