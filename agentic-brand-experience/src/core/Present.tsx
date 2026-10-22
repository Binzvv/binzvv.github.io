import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { SceneDef } from './types';
import type { Handoff } from './Explore';
import { SceneStage } from './SceneStage';
import { Chrome } from './Chrome';
import { beatTimes, prefersReducedMotion } from './motion';
import { POLICY_IDS, policyStore } from './policy';

interface Props {
  scenes: SceneDef[];
  start: Handoff;
  onExit: (at: Handoff) => void;
}

interface Pos {
  scene: number;
  step: number;
}

/**
 * Keyboard driver: the same scene timelines, advanced beat by beat inside a
 * letterboxed 16:9 frame. Entering a scene forward replays it from zero;
 * entering backward lands on its final composition.
 */
export function Present({ scenes, start, onExit }: Props) {
  const [reduced] = useState(prefersReducedMotion);
  const timelines = useRef<(gsap.core.Timeline | null)[]>([]);
  const roots = useRef<(HTMLElement | null)[]>([]);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef<Pos>({ scene: start.scene, step: 0 });
  const active = useRef<gsap.core.Animation[]>([]);
  const [view, setView] = useState<Pos>(pos.current);
  const [hint, setHint] = useState(true);
  const ready = useRef(false);

  const beatsOf = (i: number) => {
    const tl = timelines.current[i];
    return tl ? beatTimes(tl) : [];
  };
  const stepsOf = (i: number) => beatsOf(i).length + (scenes[i].extra?.count ?? 0);

  const finishActive = () => {
    active.current.forEach((a) => a.progress(1));
    active.current = [];
  };

  const setActiveScene = (i: number) => {
    roots.current.forEach((r, j) => r && (r.dataset.active = j === i ? '1' : '0'));
  };

  /** Moves a scene's timeline to a step. */
  const playStep = useCallback(
    (sceneIdx: number, step: number, opts: { instant?: boolean; delay?: number; back?: boolean } = {}) => {
      const tl = timelines.current[sceneIdx];
      if (!tl) return;
      const beats = beatTimes(tl);
      const extra = scenes[sceneIdx].extra;
      const beatIdx = Math.min(step, beats.length - 1);
      if (extra && step >= beats.length - 1) extra.apply(step - (beats.length - 1));
      const target = beats[beatIdx];
      if (opts.instant || reduced) {
        tl.seek(target, false);
        return;
      }
      if (Math.abs(tl.time() - target) < 0.001) return;
      const distance = Math.abs(tl.time() - target);
      const tween = tl.tweenFromTo(tl.time(), target, {
        duration: opts.back ? Math.min(distance, 0.9) : distance,
        ease: opts.back ? 'power2.inOut' : 'none',
        delay: opts.delay ?? 0,
      });
      active.current.push(tween);
    },
    [reduced, scenes],
  );

  const cut = useCallback(
    (from: number, to: number, dir: 1 | -1) => {
      const out = slots.current[from];
      const inn = slots.current[to];
      if (!out || !inn) return;
      const tl = timelines.current[to];
      const beats = beatsOf(to);
      if (dir > 0) tl?.seek(0, false);
      else tl?.seek(beats[beats.length - 1] ?? 0, false);
      setActiveScene(to);
      if (reduced) {
        gsap.set(out, { autoAlpha: 0 });
        gsap.set(inn, { autoAlpha: 1, scale: 1 });
        if (dir > 0) playStep(to, 0, { instant: true });
        return;
      }
      // A camera move rather than a slide swap: push through black.
      active.current.push(
        gsap.to(out, { autoAlpha: 0, scale: dir > 0 ? 1.04 : 0.97, duration: 0.6, ease: 'power2.in' }),
        gsap.fromTo(
          inn,
          { autoAlpha: 0, scale: dir > 0 ? 0.985 : 1.03 },
          { autoAlpha: 1, scale: 1, duration: 1.1, delay: 0.45, ease: 'expo.out' },
        ),
      );
      if (dir > 0) playStep(to, 0, { delay: 0.55 });
    },
    [playStep, reduced],
  );

  const go = useCallback(
    (delta: 1 | -1) => {
      finishActive();
      const { scene } = pos.current;
      let { step } = pos.current;
      // A policy may have been chosen by click; resume from it.
      const extra = scenes[scene].extra;
      const lastBeat = beatsOf(scene).length - 1;
      if (extra && step >= lastBeat) step = lastBeat + extra.current();

      const next = step + delta;
      if (next >= 0 && next < stepsOf(scene)) {
        pos.current = { scene, step: next };
        playStep(scene, next, { back: delta < 0 });
      } else if (next < 0 && scene > 0) {
        const to = scene - 1;
        pos.current = { scene: to, step: stepsOf(to) - 1 };
        cut(scene, to, -1);
        playStep(to, pos.current.step, { instant: true });
      } else if (next >= stepsOf(scene) && scene < scenes.length - 1) {
        const to = scene + 1;
        pos.current = { scene: to, step: 0 };
        cut(scene, to, 1);
      } else return;
      setView({ ...pos.current });
      setHint(false);
    },
    [cut, playStep, scenes],
  );

  const jump = useCallback(
    (to: number) => {
      finishActive();
      const from = pos.current.scene;
      if (to === from) return;
      pos.current = { scene: to, step: 0 };
      cut(from, to, 1);
      setView({ ...pos.current });
    },
    [cut],
  );

  const exited = useRef(false);
  const exit = useCallback(() => {
    // Esc can arrive both as a key and as a fullscreen change; exit once.
    if (exited.current) return;
    exited.current = true;
    const { scene } = pos.current;
    onExit({ scene, time: timelines.current[scene]?.time() ?? 0 });
  }, [onExit]);

  // Initial entry, once every stage has built its timeline.
  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    slots.current.forEach((s, i) => gsap.set(s, { autoAlpha: i === start.scene ? 1 : 0 }));
    timelines.current[start.scene]?.seek(0, false);
    setActiveScene(start.scene);
    playStep(start.scene, 0, { delay: 0.4 });
    const t = window.setTimeout(() => setHint(false), 4200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) {
        // Let focused policy buttons keep Space/Enter for themselves.
        if ((k === ' ' || k === 'Enter') && (e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        go(1);
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) {
        e.preventDefault();
        go(-1);
      } else if (k === 'Home') jump(0);
      else if (k === 'End') jump(scenes.length - 1);
      else if (k === 'Escape') exit();
      else {
        const i = ['1', '2', '3'].indexOf(k) >= 0 ? ['1', '2', '3'].indexOf(k) : ['a', 'b', 'c'].indexOf(k.toLowerCase());
        const s = pos.current.scene;
        if (i >= 0 && scenes[s].extra && pos.current.step >= beatsOf(s).length - 1) {
          policyStore.set(POLICY_IDS[i]);
          pos.current = { scene: s, step: beatsOf(s).length - 1 + i };
        }
      }
    };
    const onFs = () => {
      if (!document.fullscreenElement) exit();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [go, jump, exit, scenes]);

  const fills = scenes.map((_, i) => {
    if (i < view.scene) return 1;
    if (i > view.scene) return 0;
    const total = beatsOf(i).length || 1;
    return Math.min(1, (Math.min(view.step, total - 1) + 1) / total);
  });

  return (
    <div className="present" role="region" aria-label="Presentation" aria-roledescription="presentation">
      <div className="pr-frame">
        {scenes.map((def, i) => (
          <div
            className="pr-slot"
            key={def.id}
            ref={(el) => {
              slots.current[i] = el;
            }}
            aria-hidden={i !== view.scene}
          >
            <SceneStage
              def={def}
              mode="present"
              portrait={false}
              reduced={reduced}
              onTimeline={(tl, root) => {
                timelines.current[i] = tl;
                roots.current[i] = tl ? root : null;
              }}
            />
          </div>
        ))}
        <Chrome scenes={scenes} index={view.scene} fills={fills} mode="present" onJump={jump} onAction={exit} />
        <div className={`pr-hint ${hint ? 'is-on' : ''}`} aria-hidden="true">
          → / Space to advance · ← to go back · Esc to exit
        </div>
      </div>
    </div>
  );
}
