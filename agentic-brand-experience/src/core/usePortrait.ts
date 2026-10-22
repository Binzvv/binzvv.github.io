import { useEffect, useState } from 'react';

const query = '(max-aspect-ratio: 1/1)';

/** Explore mode follows the viewport; the presentation frame is always 16:9. */
export function usePortrait(enabled: boolean) {
  const get = () => enabled && window.matchMedia(query).matches;
  const [portrait, setPortrait] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setPortrait(enabled && mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [enabled]);
  return portrait;
}
