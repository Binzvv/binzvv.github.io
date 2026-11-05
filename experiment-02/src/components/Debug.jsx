import { useEffect, useState } from 'react'
import { useEngine } from '../engine/engine'

const time = (t) => new Date(t).toLocaleTimeString([], { hour12: false })

/* Press D. For testing the behavioural engine — hidden by default. */
export default function Debug({ phase, mode, goStage, storyId }) {
  const e = useEngine()
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const counts = e.suggestionLog.reduce((a, s) => {
    const k = s.outcome.split(' ')[0]
    a[k] = (a[k] || 0) + 1
    return a
  }, {})

  return (
    <div className="fixed right-3 top-3 z-[80] max-h-[calc(100vh-24px)] w-[min(380px,calc(100vw-24px))] overflow-y-auto bg-[#121211f2] p-4 font-mono text-[10.5px] leading-[1.5] text-[#d9d6cf]">
      <div className="flex justify-between">
        <span className="tracking-[0.1em]">BEHAVIOURAL DEBUG</span>
        <span className="opacity-50">press D to hide</span>
      </div>
      <Section title="State">
        <Row k="phase" v={phase} />
        <Row k="mode" v={mode || '—'} />
        <Row k="open story" v={storyId || '—'} />
        <Row k="go-run stage" v={goStage} />
        <Row k="consecutive skips" v={e.skipCount} />
        <Row k="idle (motion reduced)" v={String(e.idle)} />
        <Row k="active s · escape/push/wander" v={`${e.activeByMode.current.escape} / ${e.activeByMode.current.push} / ${e.activeByMode.current.wander}`} />
        <Row k="memory consent" v={String(e.consent)} />
      </Section>
      <Section title={`Suggestions · ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none yet'}`}>
        {e.suggestionLog.slice(0, 8).map((s, i) => (
          <div key={i} className="opacity-80">
            {time(s.at)} <b className="font-medium">{s.outcome}</b> — {s.rule}
          </div>
        ))}
      </Section>
      <Section title="Triggered rules">
        {e.rules.slice(0, 8).map((r, i) => (
          <div key={i} className="opacity-80">
            {time(r.at)} <b className="font-medium">{r.rule}</b> {r.note && `— ${r.note}`}
          </div>
        ))}
      </Section>
      <Section title="Recent interactions">
        {e.events.slice(0, 12).map((ev, i) => (
          <div key={i} className="opacity-80">
            {time(ev.at)} <b className="font-medium">{ev.type}</b> {ev.detail}
          </div>
        ))}
      </Section>
      <Section title={`Saved memory ${e.consent ? '(localStorage)' : '(session only — not stored)'}`}>
        <pre className="whitespace-pre-wrap break-all opacity-80">{JSON.stringify(e.memory, null, 1)}</pre>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-3 border-t border-white/15 pt-2">
      <div className="mb-1 uppercase tracking-[0.08em] opacity-50">{title}</div>
      {children}
    </div>
  )
}
function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-60">{k}</span>
      <span>{v}</span>
    </div>
  )
}
