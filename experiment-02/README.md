# Experiment 02 — The brand that knows when to disappear

**ELSEWHERE** is a speculative running brand. Its identity comes from how it behaves more than from how it looks. It was inspired by independent running culture and fluid identity systems. It does not reuse any third-party logos, assets or graphics.

```bash
npm install
npm run dev      # local
npm run build    # outputs ./dist (relative paths, works from any sub-folder)
```

## The system

- **One mark: the aperture.** A window onto a landscape that stays still while the window changes shape. It is a vertical ellipse at rest, a wide horizon for ESCAPE, a hard slit for PUSH and an organic blob for WANDER. One element, three behaviours.
- **One typeface with behaviour.** Archivo's width and weight axes change with intention: wide and light (ESCAPE), condensed and heavy (PUSH), neutral (WANDER).
- **Tempo is identity.** ESCAPE transitions take about 2.4s. PUSH wipes take 0.45s. WANDER uses springs.

| Mode   | Behaviour |
| ------ | --------- |
| ESCAPE | Full-bleed landscapes. The interface removes elements the longer you stay (`progressive-quiet`) and invites you to step away. "Bring everything back" overrides this. |
| PUSH   | Sequential technical "efforts" with fast wipes, specs and arrow-key navigation. No metrics, streaks or gamification. |
| WANDER | A draggable spatial field. Stories connect through curated **threads**. A hidden story appears after you have opened three. |

## Behavioural engine (`src/engine`)

It responds only to observable behaviour, and every suggestion says what it observed.

| Rule | Trigger | Response |
| ---- | ------- | -------- |
| `three-skips` | 3 quick advances (or quick closes in WANDER) | "Not finding it? Try another direction." |
| `engaged` | ≥ 20s of active reading, or reaching the end | "Want to go deeper?" |
| `revisit` | Opening a story seen before | Offer to keep it |
| `returning` | Stored memory on arrival | "Pick up where you left off?" (never forced) |
| `inactivity` | 25s with no input | Ambient motion pauses silently |

Only one suggestion shows at a time. There is a 30s cooldown, and each suggestion appears at most once per session. Suggestions withdraw by themselves if ignored.

**Memory.** Nothing is stored until the visitor says yes. The panel at the top right shows exactly what is remembered and has a button to forget it. Stored: last mode, last story, kept stories, seen stories, whether they chose to go running, and visit count.

**GO RUN.** Secondary content fades, then controls recede, then the photograph fills the screen, motion slows, the image flattens, and the message appears: "GO RUN. WE'LL BE HERE." After that comes a quiet way back. Reduced-motion users get a compressed crossfade.

**Debug.** Press **D**.

## Imagery

All images are procedural **placeholder plates** and are labelled as such inside stories. To use real photography, add `src: './images/file.jpg'` to an item in `src/data/content.js`. The page falls back to the plate if the image fails to load.
