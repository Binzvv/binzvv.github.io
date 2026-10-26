// A proportional stand-in for Sky Glass photography: coloured frame,
// thin black screen border, fabric speaker bar and foot.
export default function Glass({ finish = '#4a4c50', label, className = '', style, screenClass = '', children, stand = true, slot }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <div className={`glass ${className}`} style={{ '--finish': finish, ...style }} {...a11y} data-slot={slot}>
      <div className="glass-body">
        <div className={`glass-screen ${screenClass}`}>{children}</div>
        <div className="glass-bar" />
      </div>
      {stand && <div className="glass-stand" />}
    </div>
  );
}

// The Sky wordmark is not reproduced; this is a labelled text placeholder.
export function Wordmark({ className = '' }) {
  return (
    <span className={`relative inline-block font-headline text-[26px] font-semibold leading-none tracking-[-0.03em] ${className}`} data-slot="Sky logo">
      Sky
    </span>
  );
}
