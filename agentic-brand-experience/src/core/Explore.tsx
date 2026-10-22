import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SceneDef } from './types';
import { SceneStage } from './SceneStage';
import { Chrome } from './Chrome';
import { beatTimes, prefersReducedMotion } from './motion';
import { usePortrait } from './usePortrait';

export interface Handoff {
  scene: number;
  /** Timeline time to land on. */
  time: number;
}

interface Props {
  scenes: SceneDef[];
  start: Handoff | null;
  onPresent: (from: Handoff) => void;
}

/** Scroll driver: each scene is a tall section with a sticky stage whose timeline is scrubbed. */
export function Explore({ scenes, start, onPresent }: Props) {
  const portrait = usePortrait(true);
  const [reduced] = useState(prefersReducedMotion);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const triggers = useRef<(ScrollTrigger | null)[]>([]);
  const timelines = useRef<(gsap.core.Timeline | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [fills, setFills] = useState<number[]>(() => scenes.map(() => 0));
  const indexRef = useRef(0);

  const attach = useCallback(
    (i: number, tl: gsap.core.Timeline | null, root: HTMLElement) => {
      triggers.current[i]?.kill();
      triggers.current[i] = null;
      timelines.current[i] = tl;
      if (!tl) return;
      // Refs on ancestors attach after child layout effects, so resolve from the stage.
      const section = root.closest<HTMLElement>('.ex-section')!;
      const beats = beatTimes(tl);
      const last = beats[beats.length - 1] ?? tl.duration();
      let shown = -1;

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        animation: reduced ? undefined : tl,
        scrub: reduced ? false : 0.9,
        onToggle(self) {
          root.dataset.active = self.isActive ? '1' : '0';
          if (self.isActive) {
            indexRef.current = i;
            setIndex(i);
          }
        },
        onUpdate(self) {
          const p = self.progress;
          setFills((f) => {
            const fill = Math.min(1, (p * tl.duration()) / last);
            if (Math.abs(f[i] - fill) < 0.004) return f;
            const next = f.slice();
            next[i] = fill;
            return next;
          });
          if (reduced) {
            // Discrete beats instead of continuous motion; the last beat is
            // reached at 85% so it holds for the rest of the section.
            const t = Math.min(1, p / 0.85) * last;
            let target = 0;
            for (const b of beats) if (b <= t + 0.001) target = b;
            if (target !== shown) {
              shown = target;
              tl.seek(target, false);
            }
          }
        },
      });
      if (reduced) tl.seek(0);
      triggers.current[i] = st;
    },
    [reduced],
  );

  // Return to where the presenter left off.
  useLayoutEffect(() => {
    if (!start) return;
    const section = sections.current[start.scene];
    const tl = timelines.current[start.scene];
    if (!section || !tl) return;
    ScrollTrigger.refresh();
    const scrollable = section.offsetHeight - window.innerHeight;
    const y = section.offsetTop + scrollable * Math.min(1, start.time / tl.duration());
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    return () => {
      triggers.current.forEach((t) => t?.kill());
    };
  }, []);

  const present = useCallback(() => {
    const i = indexRef.current;
    const tl = timelines.current[i];
    onPresent({ scene: i, time: tl ? tl.time() : 0 });
  }, [onPresent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'p' || e.key === 'P') present();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [present]);

  return (
    <main className="explore">
      <Chrome scenes={scenes} index={index} fills={fills} action={{ label: 'Present ▸', onClick: present, hint: 'Presentation mode (P)' }} />
      {scenes.map((def, i) => (
        <section
          key={def.id}
          className={`ex-section ex-${def.id}`}
          style={{ height: `${def.length * 100}svh` }}
          ref={(el) => {
            sections.current[i] = el;
          }}
          aria-label={def.title}
        >
          <div className="ex-sticky">
            <SceneStage def={def} mode="explore" portrait={portrait} reduced={reduced} onTimeline={(tl, root) => attach(i, tl, root)} />
          </div>
        </section>
      ))}
      <footer className="ex-end">
        <p className="mono">Agentic Brand Experience / 001 — End</p>
        <div className="ex-end-actions">
          <button className="mono" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to the question ↑
          </button>
          <button className="mono" onClick={() => onPresent({ scene: 0, time: 0 })}>
            Present from the start ▸
          </button>
        </div>
      </footer>
    </main>
  );
}
