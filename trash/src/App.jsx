import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Atmosphere from './components/Atmosphere';
import Prompt, { MAX_LENGTH } from './components/Prompt';
import SuggestionStrip from './components/SuggestionStrip';
import Keyboard from './components/Keyboard';
import Reframe from './components/Reframe';
import About from './components/About';
import Signature from './components/Signature';
import { predict } from './engine/predict';
import { respond } from './engine/brain';
import { useIsTouch } from './hooks/useMediaQuery';
import { usePressedKeys } from './hooks/usePressedKeys';
import { useKeyboardInset } from './hooks/useKeyboardInset';
import { prefersReducedMotion } from './lib/motion';

export default function App() {
  const [value, setValue] = useState('');
  const [phase, setPhase] = useState('compose'); // compose → leaving → reframe | about → compose
  const [result, setResult] = useState(null);
  const [layer, setLayer] = useState('alpha');
  const [shiftOnce, setShiftOnce] = useState(false);
  const [focused, setFocused] = useState(false);

  const isTouch = useIsTouch();
  const inset = useKeyboardInset(isTouch);
  const { pressed, shiftHeld } = usePressedKeys(!isTouch && phase === 'compose', layer);

  const inputRef = useRef(null);
  const promptRef = useRef(null);
  const hintRef = useRef(null);
  const dockRef = useRef(null);
  const pendingCaret = useRef(null);

  const suggestions = useMemo(() => predict(value), [value]);
  const autoCap = value.length === 0 || /[.?!]\s+$/.test(value);
  const upper = layer === 'alpha' && (shiftHeld || shiftOnce || autoCap);

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /* ---------- editing from virtual keys / suggestions ---------- */

  const replaceRange = useCallback(
    (text, from, to) => {
      const next = (value.slice(0, from) + text + value.slice(to)).slice(0, MAX_LENGTH);
      pendingCaret.current = Math.min(from + text.length, next.length);
      setValue(next);
    },
    [value],
  );

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && pendingCaret.current != null) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value]);

  const selection = () => {
    const el = inputRef.current;
    return el ? [el.selectionStart ?? value.length, el.selectionEnd ?? value.length] : [value.length, value.length];
  };

  /* ---------- submit: keyboard leaves, reframe arrives ---------- */

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || phase !== 'compose') return;
    setResult({ input: text, ...respond(text) });
    setPhase('leaving');
    inputRef.current?.blur();

    const reduce = prefersReducedMotion();
    const tl = gsap.timeline({ onComplete: () => setPhase('reframe') });
    if (reduce) {
      tl.to([dockRef.current, hintRef.current, promptRef.current], { autoAlpha: 0, duration: 0.35 });
    } else {
      tl.to(hintRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0)
        .to(
          dockRef.current,
          { yPercent: 115, scale: 0.94, autoAlpha: 0, duration: 0.85, ease: 'power3.in' },
          0,
        )
        .to(
          promptRef.current,
          { autoAlpha: 0, y: -18, scale: 0.97, filter: 'blur(10px)', duration: 0.75, ease: 'power2.in' },
          0.3,
        );
    }
  }, [value, phase]);

  /* ---------- about: the compose state recedes ---------- */

  const openAbout = useCallback(() => {
    if (phase !== 'compose') return;
    setPhase('leaving');
    inputRef.current?.blur();

    const reduce = prefersReducedMotion();
    const tl = gsap.timeline({ onComplete: () => setPhase('about') });
    if (reduce) {
      tl.to([dockRef.current, hintRef.current, promptRef.current], { autoAlpha: 0, duration: 0.35 });
    } else {
      tl.to(hintRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0)
        .to(dockRef.current, { yPercent: 60, scale: 0.96, autoAlpha: 0, duration: 0.9, ease: 'power3.in' }, 0)
        .to(
          promptRef.current,
          { autoAlpha: 0, scale: 0.96, filter: 'blur(6px)', duration: 0.8, ease: 'power2.in' },
          0.15,
        );
    }
  }, [phase]);

  const onKey = (key) => {
    if (phase !== 'compose') return;
    const [s, e] = selection();
    switch (key.type) {
      case 'char':
        replaceRange(key.value, s, e);
        setShiftOnce(false);
        break;
      case '#':
        replaceRange(key.value, s, e);
        break;
      case 'space':
        replaceRange(' ', s, e);
        if (layer === 'numeric') setLayer('alpha');
        break;
      case 'delete':
        if (s !== e) replaceRange('', s, e);
        else if (s > 0) replaceRange('', s - 1, s);
        break;
      case 'shift':
        setShiftOnce((v) => !v);
        break;
      case 'layer':
        setLayer((l) => (l === 'alpha' ? 'numeric' : 'alpha'));
        break;
      case 'return':
        submit();
        break;
      default:
        break;
    }
  };

  const onPick = (item) => {
    if (phase !== 'compose') return;
    pendingCaret.current = item.value.length;
    setValue(item.value.slice(0, MAX_LENGTH));
    if (isTouch) focusInput();
  };

  /* ---------- return from reframe ---------- */

  const onExitReframe = () => {
    setValue('');
    setLayer('alpha');
    setShiftOnce(false);
    setResult(null);
    setPhase('compose');
  };

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const isTouchRef = useRef(isTouch);
  isTouchRef.current = isTouch;

  // Entrance — on first load and every return from a reframe.
  useLayoutEffect(() => {
    if (phase !== 'compose') return undefined;
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (reduce) {
        tl.fromTo([promptRef.current, hintRef.current, dockRef.current], { opacity: 0 }, { opacity: 1, duration: 0.4 });
      } else {
        tl.fromTo(
          promptRef.current,
          // opacity, not autoAlpha: a visibility:hidden field can't take focus
          { opacity: 0, y: 14, scale: 0.985, filter: 'blur(10px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6 },
        )
          .fromTo(hintRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 0.5)
          .fromTo(
            dockRef.current,
            { yPercent: 40, scale: 0.97, autoAlpha: 0 },
            { yPercent: 0, scale: 1, autoAlpha: 1, duration: 1.3 },
            0.25,
          );
      }
    });
    if (!isTouchRef.current) focusInput();
    return () => ctx.kill();
  }, [phase, focusInput]);

  /* ---------- desktop: the field never loses focus ---------- */

  const onStagePointerDown = (e) => {
    if (phase !== 'compose') return;
    if (isTouch) return;
    if (e.target !== inputRef.current) {
      e.preventDefault();
      focusInput();
    }
  };

  const onFocusChange = (f) => {
    setFocused(f);
    if (!f && !isTouch && phaseRef.current === 'compose') {
      requestAnimationFrame(() => phaseRef.current === 'compose' && focusInput());
    }
  };

  const composeVisible = phase !== 'reframe' && phase !== 'about';
  const dockStyle = isTouch
    ? { bottom: inset ? `${inset + 10}px` : 'calc(14px + env(safe-area-inset-bottom, 0px))' }
    : undefined;

  return (
    <main
      className={`stage ${isTouch ? 'is-touch' : 'is-desktop'} phase-${phase}`}
      onPointerDown={onStagePointerDown}
      onClick={() => isTouch && phase === 'compose' && focusInput()}
      style={{ '--kb-inset': `${inset}px` }}
    >
      <Atmosphere />
      <Signature />

      {composeVisible && (
        <div className="compose">
          <div className="compose__center">
            <Prompt
              ref={promptRef}
              inputRef={inputRef}
              value={value}
              onChange={(v) => setValue(v.slice(0, MAX_LENGTH))}
              onSubmit={submit}
              readOnly={phase !== 'compose'}
              focused={focused}
              onFocusChange={onFocusChange}
            />
            <p ref={hintRef} className="hint">
              <span>Start anywhere.</span>
            </p>
          </div>

          <div ref={dockRef} className="dock" style={dockStyle}>
            <SuggestionStrip items={suggestions} onPick={onPick} />
            {!isTouch && (
              <Keyboard layer={layer} upper={upper} shiftLocked={shiftOnce} pressed={pressed} onKey={onKey} />
            )}
          </div>
        </div>
      )}

      {phase === 'compose' && (
        <button
          type="button"
          className="corner"
          onClick={(e) => {
            e.stopPropagation();
            openAbout();
          }}
        >
          About
        </button>
      )}

      {phase === 'reframe' && result && <Reframe input={result.input} lines={result.lines} note={result.note} register={result.register} onExit={onExitReframe} />}

      {phase === 'about' && <About onExit={() => setPhase('compose')} />}
    </main>
  );
}
