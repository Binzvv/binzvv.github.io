import type { FC } from 'react';

export type Mode = 'explore' | 'present';

export interface BuildEnv {
  root: HTMLElement;
  /** Selector scoped to this scene's stage. */
  q: (selector: string) => HTMLElement[];
  mode: Mode;
  portrait: boolean;
  reduced: boolean;
}

export interface SceneProps {
  portrait: boolean;
  mode: Mode;
}

/** Extra presenter beats after a scene's final timeline beat (e.g. policy A → B → C). */
export interface ExtraSteps {
  count: number;
  current: () => number;
  apply: (index: number) => void;
}

export interface SceneDef {
  id: string;
  kicker: string;
  title: string;
  /** Scroll length in Explore mode, in viewport heights. */
  length: number;
  Component: FC<SceneProps>;
  /**
   * Returns a paused timeline. Labels named `beat:N` mark the compositions a
   * presenter can stop on; anything after the last beat is a scroll-only exit.
   */
  build: (env: BuildEnv) => gsap.core.Timeline;
  extra?: ExtraSteps;
}
