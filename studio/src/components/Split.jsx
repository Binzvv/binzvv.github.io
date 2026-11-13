// Accessible text splitting: screen readers get the plain string,
// sighted users get individually animatable spans.

export function SplitChars({ text, className = '', charClass = 'char' }) {
  return (
    <span className={`split ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="split__inner">
        {[...text].map((c, i) => (
          <span className={charClass} key={i}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </span>
  )
}

export function SplitWords({ text, className = '', wordClass = 'word' }) {
  const words = text.split(' ')
  return words.map((w, i) => (
    <span className={`${wordClass} ${className}`} key={i}>
      {w}
      {i < words.length - 1 ? ' ' : ''}
    </span>
  ))
}
