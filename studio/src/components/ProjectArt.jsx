// Generated placeholder artwork in the site's palette.
// Pass `image` on a project in content.js to use real imagery instead.

export default function ProjectArt({ art, image, title }) {
  if (image) return <img className="art art--img" src={image} alt={title} loading="lazy" />

  switch (art) {
    case 'orbit':
      return (
        <div className="art art--orbit" aria-hidden="true">
          <svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
            {[360, 290, 220, 150, 80].map((r) => (
              <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
            ))}
          </svg>
          <span className="art__orbiter" />
        </div>
      )
    case 'stack':
      return (
        <div className="art art--stack" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <span key={i} style={{ '--i': i }} />)}
        </div>
      )
    case 'grid':
      return (
        <div className="art art--grid" aria-hidden="true">
          {Array.from({ length: 48 }, (_, i) => <span key={i} className={i === 27 ? 'is-odd' : ''} />)}
        </div>
      )
    case 'creature':
    default:
      return (
        <div className="art art--creature" aria-hidden="true">
          <span className="art__creature">
            <i /><i />
          </span>
        </div>
      )
  }
}
