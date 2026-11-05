import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { byId, MODES, MODE_ORDER, STORIES, storiesFor } from './data/content'
import { RULES, useEngine } from './engine/engine'
import Aperture, { apertureGeometry } from './components/Aperture'
import Opening from './components/Opening'
import { EscapeWorld, PushWorld, WanderWorld } from './components/Worlds'
import StoryView from './components/StoryView'
import Gone from './components/Gone'
import Debug from './components/Debug'
import { Chrome, ConsentLine, Note, SuggestionLine } from './components/Ui'

function useViewport() {
  const get = () => ({ W: window.innerWidth, H: window.innerHeight })
  const [v, setV] = useState(get)
  useEffect(() => {
    const r = () => setV(get())
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])
  return v
}

const SKIP_WINDOW = { escape: 5000, push: 3500, wander: 4000 }
// The GO RUN sequence, in ms from the moment it's chosen.
const GO_TIMELINE = [0, 900, 2000, 4600, 6200, 7600, 12000] // stages 1..7
const GO_TIMELINE_REDUCED = [0, 300, 600, 900, 1200, 1500, 3500]

export default function App() {
  const engine = useEngine()
  const { memory, returning, offer, log, skip, resetSkips, openStory, toggleSave, setModeObserved, idle, consent, remember } = engine
  const reduced = useReducedMotion()
  const size = useViewport()
  const mobile = size.W < 768

  const [phase, setPhase] = useState('opening') // opening | world
  const [mode, setMode] = useState(null)
  const [hover, setHover] = useState(null)
  const [index, setIndex] = useState({ escape: 0, push: 0 })
  const [storyId, setStoryId] = useState(null)
  const [deeper, setDeeper] = useState({})
  const [goStage, setGoStage] = useState(0)
  const [debug, setDebug] = useState(false)
  const [note, setNote] = useState(null)
  const [askConsent, setAskConsent] = useState(false)
  const arrivedAt = useRef(Date.now())
  const storyOpenedAt = useRef(0)
  const goTimers = useRef([])

  const items = mode && mode !== 'wander' ? storiesFor(mode) : []
  const story = storyId ? byId(storyId) : null
  const seenWander = memory.seen.filter((id) => id.startsWith('w-') && id !== 'w-no-route').length

  // ── what the aperture shows
  const apertureStory = useMemo(() => {
    if (story) return story
    if (phase === 'opening' || !mode) {
      if (hover) return storiesFor(hover)[0]
      return STORIES[0]
    }
    if (mode === 'wander') return (memory.lastStory && byId(memory.lastStory)?.mode === 'wander' && byId(memory.lastStory)) || storiesFor('wander')[0]
    return items[index[mode]]
  }, [story, phase, mode, hover, items, index, memory.lastStory])

  const geomPhase = goStage > 0 ? 'gone' : phase
  const geom = apertureGeometry({ phase: geomPhase, mode, hover, mobile, goStage, ...size })
  const tempo = goStage >= 3 ? { duration: reduced ? 0.6 : 2.6, ease: [0.16, 1, 0.3, 1] } : phase === 'opening' ? { duration: hover === 'push' ? 0.55 : hover === 'escape' ? 1.8 : 1.2, ease: [0.22, 1, 0.36, 1] } : MODES[mode].tempo

  // ── theme: one identity, three behavioural temperatures
  const theme = goStage >= 3 ? (mode === 'push' ? MODES.push : { bg: '#E9E6DF', ink: '#121211' }) : phase === 'opening' ? (hover ? { bg: MODES[hover].bg, ink: MODES[hover].ink } : { bg: '#E9E6DF', ink: '#121211' }) : MODES[mode]
  useEffect(() => {
    document.body.style.background = theme.bg
    document.documentElement.style.setProperty('--ink', theme.ink)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme.bg)
  }, [theme.bg, theme.ink])

  const chromeTone = phase === 'world' && mode === 'escape' && !story ? '#fff' : story ? (story.mode === 'push' ? '#EDEBE5' : '#1B1D1C') : theme.ink

  // ── debug toggle
  useEffect(() => {
    const k = (e) => {
      if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) setDebug((d) => !d)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // ── choose an intention
  const choose = useCallback(
    (id, { storyToOpen } = {}) => {
      log('mode_select', MODES[id].word)
      setMode(id)
      setHover(null)
      setPhase('world')
      setModeObserved(id)
      resetSkips()
      arrivedAt.current = Date.now()
      if (storyToOpen) {
        const s = byId(storyToOpen)
        if (s && s.mode !== 'wander' && s.mode === id) setIndex((ix) => ({ ...ix, [id]: storiesFor(id).findIndex((x) => x.id === s.id) }))
        if (s) setTimeout(() => openRef.current(s), id === 'escape' ? 1600 : 500)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, setModeObserved, resetSkips],
  )

  // ask for memory permission once, after the first meaningful choice
  useEffect(() => {
    if (phase !== 'world' || consent !== null) return setAskConsent(false)
    const t = setTimeout(() => setAskConsent(true), 5000)
    return () => clearTimeout(t)
  }, [phase, consent])

  // ── returning visitor: offer continuation, never force it
  useEffect(() => {
    if (!returning || phase !== 'opening') return
    const t = setTimeout(() => {
      const last = returning.lastStory && byId(returning.lastStory)
      const where = [returning.lastMode && MODES[returning.lastMode].word, last?.title].filter(Boolean).join(' · ')
      offer(RULES.RETURN, {
        key: 'returning',
        bypassCooldown: true,
        text: 'Pick up where you left off?',
        basis: `Remembered on this device: ${where || 'your kept stories'}`,
        actions: [
          {
            label: 'Continue',
            value: 'continue',
            run: () => (returning.lastMode ? choose(returning.lastMode, { storyToOpen: returning.lastStory }) : null),
          },
          { label: 'Start fresh', value: 'fresh', run: () => log('start_fresh', 'kept memory, ignored it') },
        ],
      })
    }, 2200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── skipping (observable: advancing without dwelling)
  const otherDirections = (from) =>
    MODE_ORDER.filter((m) => m !== from).map((m) => ({ label: `Try ${MODES[m].word}`, value: m, run: () => choose(m) }))

  const registerSkip = useCallback(
    (detail) => {
      const n = skip(detail)
      if (n >= 3) {
        resetSkips()
        offer(RULES.SKIPS, {
          key: `skips-${mode}`,
          text: 'Not finding it? Try another direction.',
          basis: `Observed: ${n} skips in a row`,
          actions: otherDirections(mode),
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skip, resetSkips, offer, mode],
  )

  const step = useCallback(
    (dir) => {
      if (!mode || mode === 'wander') return
      const quick = Date.now() - arrivedAt.current < SKIP_WINDOW[mode]
      const list = storiesFor(mode)
      const cur = list[index[mode]]
      if (dir > 0 && quick) registerSkip(cur.title)
      else if (dir > 0) {
        log('advance', cur.title)
        resetSkips()
      }
      arrivedAt.current = Date.now()
      setIndex((ix) => ({ ...ix, [mode]: (ix[mode] + dir + list.length) % list.length }))
    },
    [mode, index, registerSkip, log, resetSkips],
  )

  // ── stories
  const openStoryNow = useCallback(
    (s) => {
      const revisit = openStory(s)
      setStoryId(s.id)
      storyOpenedAt.current = Date.now()
      if (revisit && !memory.saved.includes(s.id)) {
        offer(RULES.REVISIT, {
          key: `revisit-${s.id}`,
          text: `Back to ${s.title}. Keep it for later?`,
          basis: 'Observed: you have opened this story before',
          actions: [{ label: 'Keep it', value: 'keep', run: () => toggleSave(s) }],
        })
      }
    },
    [openStory, offer, toggleSave, memory.saved],
  )

  const openRef = useRef(openStoryNow)
  openRef.current = openStoryNow

  const closeStory = useCallback(() => {
    if (!story) return
    const quick = Date.now() - storyOpenedAt.current < SKIP_WINDOW.wander
    if (quick && story.mode === 'wander') registerSkip(`closed ${story.title} quickly`)
    else log('close', story.title)
    arrivedAt.current = Date.now()
    setStoryId(null)
  }, [story, registerSkip, log])

  const goDeeper = useCallback(
    (id) => {
      setDeeper((d) => ({ ...d, [id]: true }))
      log('go_deeper', byId(id)?.title)
    },
    [log],
  )

  const goHome = useCallback(() => {
    if (goStage) return
    log('change_direction', mode ? `left ${MODES[mode].word}` : '')
    setStoryId(null)
    setPhase('opening')
    setHover(null)
    setModeObserved(null)
  }, [goStage, log, mode, setModeObserved])

  // ── THE SIGNATURE: GO RUN
  const goRun = useCallback(() => {
    if (goStage) return
    log('go_run', mode ? MODES[mode].word : 'from the question')
    remember({ wentRunning: true, wentRunningAt: Date.now() })
    engine.dismiss()
    const tl = reduced ? GO_TIMELINE_REDUCED : GO_TIMELINE
    goTimers.current = tl.map((ms, i) => setTimeout(() => setGoStage(i + 1), ms))
    goTimers.current.push(
      setTimeout(() => {
        setStoryId(null)
      }, tl[2]),
    )
  }, [goStage, log, mode, remember, reduced, engine])

  useEffect(() => {
    const prev = document.title
    if (goStage >= 6) document.title = 'Gone running — we’ll be here.'
    return () => {
      document.title = prev.startsWith('Gone') ? 'Elsewhere — Experiment 02' : prev
    }
  }, [goStage])

  const returnFromRun = useCallback(() => {
    goTimers.current.forEach(clearTimeout)
    log('return', 'came back to the site')
    setGoStage(0)
    arrivedAt.current = Date.now()
    if (!mode) setPhase('opening')
    setNote('Welcome back.')
    setTimeout(() => setNote(null), 4000)
  }, [log, mode])

  const fading = goStage >= 1
  const calm = idle || goStage >= 4

  return (
    <MotionConfig reducedMotion="user">
      <div className={calm ? 'calm' : ''} style={{ color: theme.ink }}>
        <Aperture geom={geom} story={apertureStory} grade={geomPhase === 'opening' ? hover : mode} transition={tempo} settle={goStage >= 4} flatten={goStage >= 5} size={size} />

        <Chrome tone={chromeTone} mode={phase === 'world' ? mode : null} onHome={goHome} onOpenStory={(s) => (phase === 'world' && mode === s.mode ? openStoryNow(s) : choose(s.mode, { storyToOpen: s.id }))} hidden={goStage >= 2} />

        <AnimatePresence>
          {phase === 'opening' && goStage < 3 && <Opening hover={hover} setHover={setHover} onChoose={(id) => choose(id)} onGoRun={goRun} returning={returning} leaving={fading} />}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'world' && goStage < 3 && mode === 'escape' && <EscapeWorld key="escape" items={items} index={index.escape} onNext={() => step(1)} onOpen={openStoryNow} onGoRun={goRun} fading={fading} />}
          {phase === 'world' && goStage < 3 && mode === 'push' && <PushWorld key="push" items={items} index={index.push} onNext={() => step(1)} onPrev={() => step(-1)} onOpen={openStoryNow} onGoRun={goRun} fading={fading} />}
          {phase === 'world' && goStage < 3 && mode === 'wander' && <WanderWorld key="wander" items={storiesFor('wander')} onOpen={openStoryNow} onGoRun={goRun} fading={fading} seenWander={seenWander} mobile={mobile} />}
        </AnimatePresence>

        <AnimatePresence>
          {story && goStage < 3 && (
            <StoryView
              key={story.id}
              story={story}
              deeper={!!deeper[story.id]}
              onDeeper={() => goDeeper(story.id)}
              onClose={closeStory}
              onGoRun={goRun}
              onThread={(t) => {
                log('follow_thread', `${story.title} → ${t.title}`)
                openStoryNow(t)
              }}
              fading={fading}
            />
          )}
        </AnimatePresence>

        {goStage >= 3 && <Gone stage={goStage} mode={mode} onReturn={returnFromRun} reduced={reduced} />}

        <SuggestionLine tone={(story ? story.mode : mode) === 'push' && phase === 'world' ? 'light' : 'dark'} hidden={goStage > 0} />
        <ConsentLine show={askConsent && !goStage && consent === null} tone={story ? (story.mode === 'push' ? '#EDEBE5' : '#1B1D1C') : chromeTone} />
        <Note text={note} tone={chromeTone} />

        {debug && <Debug phase={goStage ? `go-run (stage ${goStage})` : phase} mode={mode} goStage={goStage} storyId={storyId} />}
      </div>
    </MotionConfig>
  )
}
