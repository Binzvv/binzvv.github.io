import { useRef } from 'react';
import DiscoverySite from '../sites/DiscoverySite.jsx';
import ProductSite from '../sites/ProductSite.jsx';

export const SITES = {
  discovery: { title: 'Discovery', Component: DiscoverySite },
  product: { title: 'Product', Component: ProductSite },
};

/**
 * One browser frame, rendered identically as a thumbnail (`mini`) and fullscreen.
 * Controls marked `chrome-aux` are hidden in the thumbnail and faded in on expand.
 */
export default function BrowserWindow({ site, mini = false, onBack, scrollerRef }) {
  const { title, Component } = SITES[site];
  const thumbRef = useRef(null);

  const onScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const ratio = clientHeight / scrollHeight;
    const travel = clientHeight * (1 - ratio);
    const progress = scrollTop / Math.max(1, scrollHeight - clientHeight);
    thumbRef.current.style.height = `${ratio * 100}%`;
    thumbRef.current.style.transform = `translateY(${progress * travel}px)`;
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      <div className="flex h-[56px] shrink-0 items-center border-b border-black/[0.07] bg-[#FAFAF9] px-5">
        <div className="flex w-[280px] items-center gap-5">
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-black/[0.12]" />
            <span className="h-3 w-3 rounded-full bg-black/[0.12]" />
            <span className="h-3 w-3 rounded-full bg-black/[0.12]" />
          </div>
          {mini ? (
            <span className="chrome-aux text-[14px] opacity-0" aria-hidden="true">
              ← Back
            </span>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="chrome-aux group flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] font-medium text-ink transition-colors hover:bg-black/[0.05]"
            >
              <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">
                ←
              </span>
              Back to presentation
            </button>
          )}
        </div>
        <div className="mx-auto flex h-8 w-[420px] items-center justify-center rounded-lg bg-black/[0.045] text-[13px] text-black/45">
          {title} — placeholder site
        </div>
        <div
          className={`chrome-aux flex w-[280px] justify-end text-[12px] text-black/40 ${mini ? 'opacity-0' : ''}`}
          aria-hidden="true"
        >
          <span className="rounded border border-black/15 px-1.5 py-0.5 font-medium">Esc</span>
          <span className="ml-2 py-0.5">to close</span>
        </div>
      </div>
      <div
        ref={scrollerRef}
        tabIndex={mini ? -1 : 0}
        aria-label={mini ? undefined : `${title} placeholder website`}
        onScroll={mini ? undefined : onScroll}
        className={`site-scroll min-h-0 flex-1 outline-none ${mini ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <Component />
      </div>
      {!mini && (
        <div className="chrome-aux pointer-events-none absolute bottom-2 right-1.5 top-[64px] w-[3px]" aria-hidden="true">
          <div ref={thumbRef} className="w-full rounded-full bg-black/25" style={{ height: '0%' }} />
        </div>
      )}
    </div>
  );
}
