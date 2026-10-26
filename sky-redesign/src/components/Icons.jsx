// Linear icons, drawn in currentColor so they always match their label.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Chevron = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 16 16" className={`chev ${className}`} {...base}><path d="M6 3.5 10.5 8 6 12.5" /></svg>
);
export const ChevronDown = ({ className = 'h-3 w-3' }) => (
  <svg viewBox="0 0 16 16" className={className} {...base}><path d="M3.5 6 8 10.5 12.5 6" /></svg>
);
export const Search = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
);
export const User = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></svg>
);
export const Arrow = ({ className = 'h-5 w-5', dir = 'right' }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }} {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
