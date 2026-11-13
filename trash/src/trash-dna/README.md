# trash-dna

The editable personality of TRASH. The engine (`src/engine/brain.js`) only applies what lives here.

| File | What it holds |
| --- | --- |
| `personality.js` | Identity, voice, principles, allowed moves, rules, banned phrases, and `toSystemPrompt()` for a future model |
| `curated.js` | Recognised inputs and their responses (`say` = one or two lines, optional `note`) |
| `sensitive.js` | Checked first. Calm, non-flippant responses for personal or crisis topics |
| `fallbacks.js` | Restrained answers for anything unrecognised, plus the strategic-question signal |

Rules for adding a curated entry:

- Match an entity plus intent. Never a lone common word.
- One line is the default. Add a second only for a real second beat.
- Only add a `note` if it is worth discovering. Every reference must be real.
- Run `node scripts/check-brain.mjs` afterwards; it runs every `example` and catches overlaps.
