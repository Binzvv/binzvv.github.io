import { useCallback, useState } from 'react';
import { scenes } from './scenes';
import { Explore, type Handoff } from './core/Explore';
import { Present } from './core/Present';

export function App() {
  const [mode, setMode] = useState<'explore' | 'present'>('explore');
  const [handoff, setHandoff] = useState<Handoff | null>(null);

  const present = useCallback((from: Handoff) => {
    setHandoff(from);
    setMode('present');
    document.body.classList.add('is-presenting');
    document.documentElement.requestFullscreen?.().catch(() => {
      /* windowed presentation still works */
    });
  }, []);

  const exit = useCallback((at: Handoff) => {
    setHandoff(at);
    setMode('explore');
    document.body.classList.remove('is-presenting');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  return mode === 'present' && handoff ? (
    <Present scenes={scenes} start={handoff} onExit={exit} />
  ) : (
    <Explore scenes={scenes} start={handoff} onPresent={present} />
  );
}
