# PERSPECTIVE — behavioural brand prototype

A single-page creative studio site that changes how it behaves depending on what you came for,
and remembers you next time. React + CSS + GSAP, no backend.

- **Live build:** `/perspective/` (committed output, served by GitHub Pages)
- **Source:** this folder

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # writes the static site to ../perspective
```

## What happens

1. **First visit:** a cinematic opening asks *What are you here to explore?* — Sound, Film or Culture.
   Hovering a choice previews that lens's typographic voice.
2. **Choosing a lens** reshapes the whole studio, not just its colours:

   | | Sound | Film | Culture |
   |---|---|---|---|
   | Metaphor | A record | A screening | A magazine |
   | Layout | Tracklist, liner notes, EQ faders | One letterboxed scene at a time | Editorial grid, index, pull quote |
   | Navigation | Transport bar (prev / play / next, chapters A1–A4) | Scene timeline + ← → keys, "Screen all" | Contents + filters (GSAP Flip) |
   | Motion | On the beat (92 BPM), live waveform | Slow dissolves, grain, timecode | Pasted-up collage, stamps, ticker |
   | Type | Archivo, expanded | Instrument Serif | Fraunces |

   Play in Sound starts a quiet generative pad via the Web Audio API.
3. **Return visit:** the opening is replaced by a greeting in the remembered lens's voice, a discovery
   that is new since last time (never the same one twice), and options to continue, change direction or
   reset. Inside the lens, the same discovery reappears in that lens's idiom — a bonus track, a coming
   attraction, a note from the editor.

## Test mode

Open with the **Test mode** button (or `?test` in the URL). It can simulate a visitor who chose any lens
four days ago, reset to a first-time visitor, replay the opening, and shows the stored localStorage
record and a behaviour log.

## Accessibility

Real buttons and links throughout, visible focus, skip link, `aria-pressed`/`aria-expanded`/`aria-current`
state, live-region announcements on lens change, number keys 1–3 on the opening, and full
`prefers-reduced-motion` support plus an in-page **Reduce motion** toggle that is remembered.

All names, projects and copy are original placeholders.
