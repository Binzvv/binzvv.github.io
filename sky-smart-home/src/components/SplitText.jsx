import { Fragment } from 'react';

/** Renders text as masked words (and optionally characters) for reveal animations. */
export default function SplitText({ text, by = 'char', className = '' }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={i}>
            <span className="split-mask">
              {by === 'char' ? (
                [...word].map((c, j) => (
                  <span key={j} className="split-char">
                    {c}
                  </span>
                ))
              ) : (
                <span className="split-word">{word}</span>
              )}
            </span>
            {i < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
