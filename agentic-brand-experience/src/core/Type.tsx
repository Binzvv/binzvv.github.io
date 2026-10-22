import type { ReactNode } from 'react';

/** A masked line: the inner span rises out of an overflow-hidden wrapper. */
export function Line({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`line ${className}`}>
      <span className="line-in">{children}</span>
    </span>
  );
}

/** Splits a word into individually animatable letters, keeping it readable to assistive tech. */
export function Letters({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`letters ${className}`} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span className="ch" aria-hidden="true" key={i}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
