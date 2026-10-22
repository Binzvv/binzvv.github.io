import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Mode, SceneDef } from './types';
import { makeQ } from './motion';

interface Props {
  def: SceneDef;
  mode: Mode;
  portrait: boolean;
  reduced: boolean;
  /** Receives the scene's timeline once built, and null before it is torn down. */
  onTimeline: (tl: gsap.core.Timeline | null, root: HTMLElement) => void;
}

/** Renders one scene inside a size-container stage and owns its timeline. */
export function SceneStage({ def, mode, portrait, reduced, onTimeline }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onTimeline);
  cb.current = onTimeline;

  useLayoutEffect(() => {
    const root = ref.current!;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = def.build({ root, q: makeQ(root), mode, portrait, reduced });
    }, root);
    cb.current(tl, root);
    return () => {
      cb.current(null, root);
      ctx.revert();
    };
  }, [def, mode, portrait, reduced]);

  const { Component } = def;
  return (
    <div className="stage" ref={ref} data-scene={def.id} data-active="0">
      <Component portrait={portrait} mode={mode} />
    </div>
  );
}
