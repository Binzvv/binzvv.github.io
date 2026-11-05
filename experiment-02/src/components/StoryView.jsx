import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { byId, MODES } from '../data/content'
import { RULES, useEngine } from '../engine/engine'
import { Plate } from './Plate'
import { GoRunButton } from './Ui'

const THEMES = {
  escape: { bg: '#E4E5E1', ink: '#1B1D1C', t: { duration: 1.6, ease: [0.22, 1, 0.36, 1] }, wdth: 125, wght: 240 },
  push: { bg: '#0E0E0C', ink: '#EDEBE5', t: { duration: 0.4, ease: [0.7, 0, 0.2, 1] }, wdth: 62, wght: 860 },
  wander: { bg: '#DCD3C4', ink: '#24211C', t: { type: 'spring', stiffness: 80, damping: 20 }, wdth: 100, wght: 540 },
}

export default function StoryView({ story, deeper, onDeeper, onClose, onGoRun, onThread, fading }) {
  const { isActive, offer, toggleSave, memory } = useEngine()
  const th = THEMES[story.mode]
  const scroller = useRef(null)
  const deeperRef = useRef(null)
  const [reachedEnd, setReachedEnd] = useState(false)
  const seconds = useRef(0)
  const kept = memory.saved.includes(story.id)

  // Meaningful engagement = sustained active reading, or reaching the end.
  useEffect(() => {
    seconds.current = 0
    setReachedEnd(false)
    scroller.current?.scrollTo({ top: 0 })
    const t = setInterval(() => {
      if (isActive()) seconds.current += 1
      if (!deeper && (seconds.current >= 20 || reachedEndRef.current)) {
        offer(RULES.DEEPER, {
          key: `deeper-${story.id}`,
          text: 'Want to go deeper?',
          basis: reachedEndRef.current ? 'Observed: you read to the end' : `Observed: ${seconds.current}s actively reading`,
          actions: [{ label: 'Go deeper', value: 'deeper', run: onDeeper }],
        })
      }
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id, deeper])

  const reachedEndRef = useRef(false)
  useEffect(() => {
    reachedEndRef.current = reachedEnd
  }, [reachedEnd])

  useEffect(() => {
    if (deeper) setTimeout(() => deeperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
  }, [deeper])

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const onScroll = (e) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setReachedEnd(true)
  }

  const push = story.mode === 'push'
  const wander = story.mode === 'wander'

  return (
    <motion.article
      className="fixed inset-0 z-40"
      style={{ background: th.bg, color: th.ink }}
      initial={push ? { clipPath: 'inset(0 0 0 100%)' } : { opacity: 0 }}
      animate={push ? { clipPath: 'inset(0 0 0 0%)', opacity: fading ? 0 : 1 } : { opacity: fading ? 0 : 1 }}
      exit={push ? { clipPath: 'inset(0 100% 0 0)' } : { opacity: 0 }}
      transition={fading ? { duration: 1.2 } : th.t}
      aria-label={story.title}
    >
      <div ref={scroller} onScroll={onScroll} className="no-scrollbar h-full overflow-y-auto">
        <div className={`grid min-h-full gap-8 px-5 pb-28 pt-24 sm:px-10 sm:pt-28 ${push || wander ? 'lg:grid-cols-[1fr_1fr] lg:gap-16' : ''}`}>
          {/* image */}
          <motion.div
            className={`relative overflow-hidden ${push ? 'h-[46vh] lg:sticky lg:top-28 lg:h-[calc(100vh-10rem)]' : wander ? 'morph h-[48vh] lg:sticky lg:top-28 lg:h-[70vh]' : 'h-[62vh] w-full'}`}
            initial={{ opacity: 0, scale: push ? 1.04 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...th.t, delay: push ? 0.1 : 0.3 }}
          >
            <Plate story={story} grade={story.mode} label />
          </motion.div>

          {/* text */}
          <div className={push || wander ? '' : 'mx-auto w-full max-w-xl'}>
            <p className="label opacity-50">
              {MODES[story.mode].word} — {story.place}
            </p>
            <h2 className="vt mt-3 leading-[0.88]" style={{ fontSize: push ? 'clamp(48px, 7vw, 120px)' : 'clamp(38px, 5vw, 84px)', '--wdth': th.wdth, '--wght': th.wght, textTransform: push ? 'uppercase' : 'none' }}>
              {story.title}
            </h2>
            <p className="mt-5 text-[18px] leading-snug opacity-80">{story.line}</p>

            {story.specs && (
              <dl className="mt-8 border-t border-current/20">
                {story.specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-current/20 py-2.5 text-[14px]">
                    <dt className="label pt-0.5 opacity-50">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 space-y-5 text-[16px] leading-relaxed sm:text-[17px]">
              {story.body.map((p, i) => (
                <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...th.t, delay: 0.4 + i * 0.15 }}>
                  {p}
                </motion.p>
              ))}
            </div>

            <AnimatePresence>
              {deeper ? (
                <motion.div ref={deeperRef} key="deep" className="mt-10 border-l border-current/40 pl-5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                  <p className="label opacity-50">Deeper</p>
                  <p className="vt mt-2 text-[20px] leading-snug sm:text-[22px]" style={{ '--wdth': th.wdth > 100 ? 110 : th.wdth, '--wght': 460 }}>
                    {story.deeper}
                  </p>
                </motion.div>
              ) : (
                <button key="deep-btn" className="label underline-grow mt-10 opacity-60" onClick={onDeeper}>
                  Go deeper
                </button>
              )}
            </AnimatePresence>

            {wander && story.threads?.length > 0 && (
              <div className="mt-12">
                <p className="label opacity-50">Follow a thread</p>
                <ul className="mt-3 space-y-3">
                  {story.threads.map(byId).map((t) => (
                    <li key={t.id}>
                      <button className="group flex w-full items-baseline justify-between gap-4 border-b border-current/20 pb-3 text-left" onClick={() => onThread(t)}>
                        <span className="vt text-[22px]" style={{ '--wdth': 100, '--wght': 540 }}>
                          {t.title}
                        </span>
                        <span className="label opacity-50 transition-transform duration-500 group-hover:translate-x-1">{t.place} →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      <motion.div
        className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-4 px-5 pb-5 pt-10 sm:px-10 sm:pb-8"
        style={{ background: `linear-gradient(180deg, ${th.bg}00, ${th.bg} 55%)` }}
        animate={{ opacity: fading ? 0 : 1, y: fading ? 20 : 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex gap-6">
          <button className="label underline-grow" onClick={onClose}>
            ← Back
          </button>
          <button className="label underline-grow" onClick={() => toggleSave(story)} aria-pressed={kept}>
            {kept ? 'Kept' : 'Keep for later'}
          </button>
        </div>
        <GoRunButton mode={story.mode === 'escape' ? 'wander' : story.mode} onClick={onGoRun} />
      </motion.div>
    </motion.article>
  )
}
