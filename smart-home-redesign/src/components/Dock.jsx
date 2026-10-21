// Floating comparison dock. Sits outside both directions, so it keeps a
// neutral voice and only borrows each direction's colour tokens.
export default function Dock({ direction, directions, onChange, reduced, onToggleMotion }) {
  const keys = Object.keys(directions);
  return (
    <div className="dock" role="region" aria-label="Prototype controls">
      <div className="dock__seg" role="radiogroup" aria-label="Creative direction" data-active={direction}>
        <span className="dock__thumb" aria-hidden="true" />
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={direction === key}
            className="dock__opt"
            onClick={() => onChange(key)}
          >
            <span className="dock__label">{directions[key].label}</span>
            <span className="dock__ref">{directions[key].ref}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="dock__motion"
        aria-pressed={!reduced}
        onClick={onToggleMotion}
        title={reduced ? 'Turn motion on' : 'Reduce motion'}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          {reduced ? (
            <path d="M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          ) : (
            <path
              d="M2.5 10c2-4 3.5-4 5 0s3 4 5 0 3.5-4 5 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
        <span className="sr-only">Motion</span>
        <span className="dock__motionText" aria-hidden="true">
          {reduced ? 'Still' : 'Motion'}
        </span>
      </button>
    </div>
  );
}
