# Agentic Brand Experience: design and build notes

A cinematic web keynote built from `agentic_brand_experience.pptx`.
The deck is the source of truth for wording and the six-part argument. This
document covers Phases 1 and 2 of the brief (analysis and art direction) and
the technical architecture that the build follows.

---

## Phase 1: Analysis

### The narrative (from the deck, unchanged)

| # | Kicker | Argument |
|---|--------|----------|
| 01 | Agentic Brand Experience / 001 | *What happens to brand when the interface starts making decisions?* |
| 02 | Brand / Then | Brand → Visual identity → Interface → Experience. *We designed how a brand looked, sounded and felt.* **AI changes the final layer.** |
| 03 | Brand / Now | Person → Intent → Agent → **Decision** → Action. *If an agent increasingly decides what happens next, brand needs to influence the decision, not just decorate the response.* |
| 04 | (Recognition) | *Can a brand be recognised by what it decides?* Not its logo. Not its colour. Not its typography. Not even its name. **Its behaviour.** |
| 05 | Hypothesis | *Brand principles can function as decision-making rules.* Input (Feeling / Time / Need) → Intelligence (Same underlying capability) → Brand policy (Prioritise / Refuse / Intervene / Explain) → Decision (Different action). **Change the policy. Change the experience.** |
| 06 | Experiment | *Same person. Same intent. Same interface. Different behavioural policy.* A Performance / B Recovery / C Instinct. *Visual identity has been deliberately removed.* |

The argument runs: provocation, then the old model, then the new model, then a
redefinition of recognition, then a testable hypothesis, then a demonstration.
The web version keeps each part and makes the audience *see* the shift in the
last two scenes, rather than read about it.

### Reference: interaction principles (Apple launch pages)

apple.com could not be reached from the build environment, so these principles
come from the established Apple product-page grammar rather than a live
inspection of the Duo page:

1. **Pinned stages, scrubbed time.** A section pins to the viewport and scroll
   becomes a timeline. The page does not move; the composition does.
2. **One idea per frame.** Each beat resolves into a still composition before the
   next begins. Motion happens *between* ideas, never during reading.
3. **Typography as image.** Headlines are set at architectural scale, often
   cropped by the viewport, and revealed through masks rather than fades.
4. **Light, not colour.** Depth comes from soft radial light on black and from
   tone (white → 56% → 32%), not from hues.
5. **Camera language.** Scene changes push in, pull back or flatten 3D planes to
   2D, so it feels like a camera moving through one space rather than slides
   swapping.
6. **Restraint as contrast.** Most of the time almost nothing moves, so the few
   big moves (a scale jump, an inversion to white) land.

---

## Phase 2: Art direction

> **Revision 2.** The first pass leaned on editorial conventions: monospace
> folios, all-caps grotesk and hairline diagrams. Feedback was that it read as
> conservative and template-like. This revision aligns with the Apple iPhone Pro
> product page instead. That page could not be fetched from the build
> environment, so the language below comes from Apple's established Pro-page
> design system.

### Concept

**Absence as a design device**, staged like a product launch. The "product" is
brand behaviour. It gets the treatment Apple gives a chip or a camera: a hero
reveal, a chip render, a bento grid and a segmented control.

### Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#000` | canvas |
| `--fg` | `#f5f5f7` | primary type |
| `--grey` | `#86868b` | Apple's secondary grey: copy, captions |
| `--tile` | `#1d1d1f` | rounded tiles, capsules, the interface |
| `--light` | `#f5f5f7` | the light section at *Its behaviour.* |
| `--grad` | `#ffc27a → #ff8a3d → #ff5a2c → #f0386b` | the Pro "finish": used only on climaxes (*decisions?*, *the final layer.*, *Policy*, *behaviour.*, *experience.*) |
| `--blue` / `--link` | `#0071e3` / `#2997ff` | the Present pill and links, as on apple.com |
| `--brand-hue` | `#2f6bff` | the fictional brand in Scene 04 only |

Light comes from soft orange radial glows behind the subject, which act as
studio lighting.

### Typography

- **Inter Variable with optical sizing**, the closest open match to SF Pro
  Display. Display cuts are used at large sizes.
- **Sentence case** throughout, with tight tracking (−0.03 to −0.055em) and
  weights 600–700.
- **Eyebrows** are set in orange, 600 weight, at 1.45cqw.
- **Feature copy** is semibold grey with the point picked out in white,
  which is Apple's signature paragraph treatment.
- There is no monospace and no serif. The fictional brand's serif is the only
  exception, because it exists to be removed.

| Role | Size |
|---|---|
| Mega | `min(19cqw, 33cqh)` |
| Hero | `min(5.6cqw, 10cqh)` |
| Headline | `min(4.4cqw, 8cqh)` |
| Copy | `clamp(17px, 1.55cqw, 28px)` |

### Components

- **Local nav:** sticky and translucent (`blur(20px) saturate(180%)`), with the
  title on the left, scene links, and a blue **Present** pill.
- **Progress:** Apple's carousel dots. The current scene stretches into a pill
  that fills as you progress.
- **Tiles:** `#1d1d1f` with 30px radius, used for the bento grid in Scene 04
  and the interface in Scene 06.
- **Chip render:** Brand Policy is drawn as a silicon package with pins and a
  gradient die label.
- **Capsule nodes:** the Scene 03 flow. Decision is the white capsule.
- **Segmented control:** a white pill slides between Performance, Recovery and
  Instinct.
- **iMessage bubble:** the person's intent, in the interface.

### Motion

| Token | Curve | Use |
|---|---|---|
| fade-up | `power3.out`, 30–40px | Apple's default section entrance |
| settle | `expo.out` | hero words and objects settling out of the camera |
| camera | `power3.inOut` | plane flatten, chip rise |
| finish sweep | `power2.inOut` on `background-position` | light travelling across gradient type |

The rules are unchanged. Each composition resolves and holds. Only one thing
moves at a time unless elements respond to each other. Ambient loops run only
while their scene is on screen.

---

## Storyboard

**01 · The question.** A black stage. Three beats:
(1) *What happens to brand* rises from a mask. (2) *when the interface* joins
it and the first line dims. (3) *starts making* then **DECISIONS?** at
monumental scale, letter by letter, with one slow light sweep. Hold.
Exit (scroll): the small lines fall away and *DECISIONS* pushes toward the
camera and dissolves.

**02 · Brand / Then.** Three translucent planes drop into an isometric stack:
Visual identity, Interface, Experience, each with a leader line and label.
*We designed how a brand looked, sounded and felt.* The camera then pulls the
Experience plane out of the stack and flattens it face-on. Its static
outline becomes a live dot field: **AI changes the final layer.**
*Designed* is struck through and replaced by *Decided*.

**03 · Brand / Now.** One horizon line. Five nodes ignite in sequence as a
signal travels: Person → Intent. At the Agent, the signal fans into
several candidate paths (options considered), which converge on **Decision**.
Only one path survives, then Action fires. The body copy lands with *decorate
the response* dimming to ghost.

**04 · Recognition.** The question is set large. A fictional brand appears:
mark, colour field, type specimen, name. Each *Not its…* line removes one
element and leaves a hairline ghost where it was. The colour drains last
from the field. An empty frame of ghosts remains. Then the stage inverts to
paper and **ITS BEHAVIOUR.** fills the frame.

**05 · Hypothesis.** The hypothesis headline, then a four-stage system on the
horizon. *Brand policy* is drawn as a gate, and the camera pushes in on it.
The same input signal passes through the same intelligence. The policy gate
changes three times (A, B, C), and each time the output path bends to a
different decision. **Change the policy. Change the experience.**

**06 · The live experiment.** The four-line setup, with the first three lines
dimmed so the fourth carries the weight. Then the instrument: the constants
(Person, Intent, Intelligence) on the left, locked. The policy selector
(A / B / C) in the centre. On the right, one neutral interface. Switching
policy changes the decision headline (mask swap), reorders the
prioritisation (FLIP), rewrites the action and refusal, and fades in the
explanation word by word. Outputs are labelled as illustrative.

### Illustrative experiment content

These are conceptual examples, not research findings. The page labels them
that way.

- **Person:** a runner six weeks out from a half marathon. Slept 5 h 40 min,
  second short night in a row. Heart-rate variability is below baseline.
- **Intent:** *"I've got 40 minutes this evening. What should I do?"*
- **Intelligence:** the same model, data and capability in all three cases.

| | A · Performance | B · Recovery | C · Instinct |
|---|---|---|---|
| Principle | Progress toward the goal comes first. | Protect the body before the plan. | Trust the feeling over the numbers. |
| Decision | Run the session. | Don’t run tonight. | Go out. No plan. |
| Prioritisation | Goal progress → Consistency → Injury risk → Sleep & recovery → How it feels | Sleep & recovery → Injury risk → Consistency → Goal progress → How it feels | How it feels → Sleep & recovery → Consistency → Injury risk → Goal progress |
| Action | Intervals · 6 × 800 m · today 18:30 · 38 min · reminder at 18:00 | Mobility · 20 min · wind-down at 22:00 · intervals moved to Thursday | Easy run · river loop · open-ended, pace hidden · no targets tonight |
| Refuses | Skipping a key session | The interval session | Pace and targets |
| Explanation | *Six weeks out, a missed key session costs more than one hard evening.* | *Two short nights in a row. Training on this fatigue raises the risk and blunts the gain.* | *You’ve hit every target this month. Tonight, how it feels matters more than the plan.* |

The same five factors appear under every policy. Only their order and weight
change, so the audience watches the *same* items re-rank.

---|---|---|---|
| Decision | Run the session. | Don't run tonight. | Go out. No plan. |
| Priority | Goal → Consistency → Load → Sleep | Sleep → Injury risk → Load → Goal | Feeling → Enjoyment → Goal → Load |
| Action | Intervals 6 × 800 m · 18:30 · 38 min | 20 min mobility · wind-down 22:00 · session moved to Thu | Easy run · river loop · pace hidden |
| Refuses | Skipping a key session | The interval session | Pace and targets |
| Explanation | *Six weeks out, a missed key session costs more than one hard evening.* | *Two short nights in a row. Training on this fatigue raises risk and blunts the gain.* | *You've hit every target this month. Tonight, how it feels matters more than the plan.* |

---

## Technical architecture

**Stack:** React 19 + TypeScript + Vite, GSAP 3 + ScrollTrigger and Flip.
Fonts are self-hosted through Fontsource, so the piece works offline on a
presentation laptop. There is no Three.js: CSS 3D transforms give the plane
stack all the depth it needs, at a fraction of the cost.

### One choreography, two drivers

Each scene is a module that exports:

```ts
{ id, kicker, folio, length, Component, build(root, env) → gsap.Timeline }
```

`build` returns a **paused GSAP timeline** with `beat:N` labels for each
composition the presenter can stop on. An optional exit tail after the last beat
runs only on scroll.

- **Explore mode** drives the timeline with `ScrollTrigger` (`scrub`). Each
  scene is a tall section with a CSS `position: sticky` stage (no pin-spacer
  reflow). Its height is `length × 100svh`.
- **Presentation mode** drives the *same* timeline with `tweenFromTo(beat)`.
  The arrow keys, space, PageUp/PageDown (clickers) and Enter move beat by
  beat. Entering a scene forward replays it from zero. Entering it backward
  lands on its final beat. Esc exits.

Both modes render the same scene components inside a `.stage`, which is a
CSS size container (`container-type: size`). All type and layout use
`cqw`/`cqh`, so a composition is identical in the letterboxed 16:9 frame and
proportionally correct in the browser. Portrait layouts switch with
`@container` aspect-ratio queries, and diagram geometry is rebuilt per
orientation.

### Files

```
src/
  main.tsx              entry, fonts, GSAP plugin registration
  App.tsx               mode switch (explore ↔ present), shared scene index
  core/
    types.ts            SceneDef, BuildEnv
    motion.ts           easing tokens, helpers (mask reveal, split letters)
    useStageSize.ts     container orientation for diagram geometry
    policy.ts           tiny external store for the experiment's policy
    Explore.tsx         scroll driver
    Present.tsx         keyboard driver, letterbox, transitions, progress
    Chrome.tsx          folio, kicker, progress hairline
  scenes/
    s01-question.tsx … s06-experiment.tsx
    index.ts
  styles/
    tokens.css  base.css  scenes.css
```

### Performance

- Only `transform`, `opacity`, `clip-path` and SVG `stroke-dashoffset` are
  animated. There is no blur and no layout-affecting tween.
- Signals are CSS keyframe dash animations, gated by `[data-live]` and by the
  scene being on screen. They cost nothing when the scene is off screen.
- `will-change` is applied only to elements that move.
- Presentation mode mounts every scene once, and the inactive ones are
  `visibility: hidden`, so switching scenes never triggers a re-mount or
  re-layout.

### Accessibility and reduced motion

- With `prefers-reduced-motion: reduce`, scroll moves the scene to discrete
  beats, which cut instantly instead of scrubbing. Ambient signal loops stop.
  Presentation mode makes instant cuts.
- All text is real text in reading order. Diagrams have `aria-label`
  summaries. The policy selector is a radio group with keys 1/2/3 and A/B/C.
