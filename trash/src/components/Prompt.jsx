import { forwardRef, useLayoutEffect } from 'react';

export const PLACEHOLDER = 'What’s on your mind?';
export const MAX_LENGTH = 160;

const sizeFor = (len) => (len < 30 ? 'xl' : len < 64 ? 'l' : len < 110 ? 'm' : 's');

/**
 * The headline *is* the input. A real <textarea> sits under the
 * placeholder headline; as soon as there is text the headline
 * dissolves and the user's words take its place.
 */
const Prompt = forwardRef(function Prompt(
  { value, onChange, onSubmit, readOnly, focused, onFocusChange, inputRef },
  ref,
) {
  const empty = value.length === 0;
  const size = sizeFor(empty ? PLACEHOLDER.length : value.length);

  // Auto-grow the textarea to its content.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, size, inputRef]);

  return (
    <div ref={ref} className={`prompt prompt--${size} ${empty ? 'is-empty' : 'has-text'}`}>
      <h1 className="prompt__headline" aria-hidden={!empty}>
        <span className="prompt__headline-text">{PLACEHOLDER}</span>
        <span className={`prompt__caret ${focused ? 'is-visible' : ''}`} aria-hidden="true" />
      </h1>
      <textarea
        ref={inputRef}
        className="prompt__input"
        value={value}
        rows={1}
        maxLength={MAX_LENGTH}
        readOnly={readOnly}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        enterKeyHint="go"
        aria-label={PLACEHOLDER}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
      />
    </div>
  );
});

export default Prompt;
