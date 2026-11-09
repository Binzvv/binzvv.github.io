// Nine gaze frames in reading order of the 3x3 grid (row = vertical, col = horizontal).
const base = import.meta.env.BASE_URL

export const FRAMES = [
  { name: 'Up left', file: '01-up-left.webp' },
  { name: 'Up', file: '02-up.webp' },
  { name: 'Up right', file: '03-up-right.webp' },
  { name: 'Left', file: '04-left.webp' },
  { name: 'Centre', file: '05-centre.webp' },
  { name: 'Right', file: '06-right.webp' },
  { name: 'Down left', file: '07-down-left.webp' },
  { name: 'Down', file: '08-down.webp' },
  { name: 'Down right', file: '09-down-right.webp' },
].map((f) => ({ ...f, src: `${base}frames/${f.file}` }))

export const CENTRE = 4

/** col/row in -1..1 → frame index */
export const frameIndex = (col, row) => (row + 1) * 3 + (col + 1)
