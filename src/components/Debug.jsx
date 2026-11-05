import { useEffect, useState } from 'react'
import { MODES, byId } from '../content.js'
import { THRESHOLDS, live } from '../engine.js'
import { describeAction } from '../machine.js'

// Behavioural debug overlay (press D). Shows exactly what the engine sees,
// which rule fired, what it offered and what the visitor did with it.
const RULES = [
  ['Skipping', `${THRESHOLDS.skips} skips in a row. Explore: project closed < ${THRESHOLDS.skipWindow / 1000}s after opening. Focus: next < ${THRESHOLDS.skipWindow / 1000}s without reading. Surprise: scene tapped away.`],
  ['Dwelling', `${THRESHOLDS.dwell / 1000}s of active time on one project (input in the last ${THRESHOLDS.activeWithin / 1000}s, tab visible).`],
  ['Returning', `Reload with memory, or tab hidden ≥ ${THRESHOLDS.away / 1000}s, with a remembered interaction.`],
  ['Inactivity', `No input for ${THRESHOLDS.idle / 1000}s → reduce motion and pause auto-advance. Content is not changed.`],
  ['Revisiting', `Same project opened ${THRESHOLDS.revisits} times (across visits).`],
]

const Row = ({ k, children }) => (
  <div className="grid grid-cols-[6.5rem_1fr] gap-2 py-1">
    <dt className="text-quiet">{k}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
)

export default function Debug({ state, onClose }) {
  const [, tick] = useState(0)
  const [rules, setRules] = useState(false)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(t)
  }, [])

  const { engine, memory, status } = state
  const idleFor = Math.floor((Date.now() - live.last) / 1000)
  const dw = live.dwell
  const a = engine.active
  const o = engine.outcome
  const time = (t) => new Date(t).toLocaleTimeString([], { hour12: false })

  return (
    <aside
      className="fixed right-3 top-16 z-[70] max-h-[calc(100vh-10rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-hair bg-white/90 p-4 text-[12px] leading-snug shadow-[0_8px_30px_rgba(13,13,16,0.08)] backdrop-blur-xl no-scrollbar sm:right-8"
      aria-label="Behaviour debug"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-medium">Behaviour debug</p>
        <button onClick={onClose} className="text-quiet hover:text-ink">
          Close · D
        </button>
      </div>
      <dl className="divide-y divide-hair">
        <Row k="Mode">{status === 'intro' ? 'Choosing (intro)' : MODES[status].word}</Row>
        <Row k="Observed">
          <span className="tnum block">
            Skips in a row: {engine.skipStreak}/{THRESHOLDS.skips}
          </span>
          <span className="tnum block">
            Dwell: {dw.id ? `${byId[dw.id].title} ${(dw.ms / 1000).toFixed(1)}s / ${THRESHOLDS.dwell / 1000}s` : 'nothing open'}
          </span>
          <span className="tnum block">
            Idle: {engine.idle ? 'yes, motion reduced' : `${idleFor}s / ${THRESHOLDS.idle / 1000}s`}
          </span>
          <span className="block">Last interaction: {describeAction(memory.lastAction) ?? 'none yet'}</span>
          <span className="block">
            Most opened:{' '}
            {Object.entries(memory.opened)
              .sort((x, y) => y[1] - x[1])
              .slice(0, 3)
              .map(([id, n]) => `${byId[id].title} ${n}×`)
              .join(', ') || 'none'}
          </span>
          <span className="block">Visit {memory.visits}{memory.kept.length ? ` · kept: ${memory.kept.map((k) => byId[k].title).join(', ')}` : ''}</span>
        </Row>
        <Row k="Triggered rule">{a ? `${a.key} — ${a.rule}` : o ? `${o.key} (last)` : 'none'}</Row>
        <Row k="Because">{a?.observed ?? '—'}</Row>
        <Row k="Suggested">{a ? `“${a.text}” → ${a.actions.map((x) => x.label).join(' / ')} / Not now` : '—'}</Row>
        <Row k="Response">
          {o ? (
            <span className={o.result === 'accepted' ? 'text-ultra' : ''}>
              {o.result}
              {o.choice ? `: ${o.choice}` : ''}
            </span>
          ) : (
            '—'
          )}
        </Row>
      </dl>

      <p className="mt-3 text-quiet">Log</p>
      <ol className="mt-1 space-y-1">
        {engine.log.map((l, i) => (
          <li key={l.at + '-' + i} className="grid grid-cols-[4rem_1fr] gap-2">
            <span className="tnum text-quiet">{time(l.at)}</span>
            <span className={l.kind === 'rule' ? 'text-ultra' : l.kind === 'outcome' ? 'font-medium' : ''}>{l.text}</span>
          </li>
        ))}
        {!engine.log.length && <li className="text-quiet">Nothing observed yet.</li>}
      </ol>

      <button onClick={() => setRules((r) => !r)} className="mt-3 text-quiet hover:text-ink">
        {rules ? 'Hide rules' : 'Show rules'}
      </button>
      {rules && (
        <dl className="mt-1 space-y-1.5">
          {RULES.map(([k, v]) => (
            <div key={k}>
              <dt className="font-medium">{k}</dt>
              <dd className="text-quiet">{v}</dd>
            </div>
          ))}
          <p className="pt-1 text-quiet">The site never switches mode, changes content or interrupts on its own. Every response needs a choice.</p>
        </dl>
      )}
    </aside>
  )
}
