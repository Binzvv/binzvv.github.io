// Fit text into a box. Measures in place, synchronously, then restores inline styles.

export function fitText(el, w, h, { single = false, min = 6, max = 4000 } = {}) {
  if (w <= 2 || h <= 2) return min;
  const prev = { width: el.style.width, fontSize: el.style.fontSize, whiteSpace: el.style.whiteSpace };
  let size;
  if (single) {
    el.style.whiteSpace = 'nowrap';
    el.style.width = 'auto';
    el.style.fontSize = '100px';
    const nw = el.offsetWidth || 1;
    const nh = el.offsetHeight || 1;
    size = Math.min((w / nw) * 100, (h / nh) * 100);
  } else {
    el.style.width = `${w}px`;
    let lo = min;
    let hi = Math.min(max, h * 1.2);
    for (let i = 0; i < 11; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollHeight <= h && el.scrollWidth <= w + 1) lo = mid; else hi = mid;
    }
    size = lo;
  }
  Object.assign(el.style, prev);
  return Math.max(min, Math.min(max, size));
}

// Split text into words → chars so letters can move individually without breaking wrapping.
export function splitChars(el, text) {
  el.textContent = '';
  const chars = [];
  text.split(' ').forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.className = 'w';
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch;
      w.appendChild(c);
      chars.push(c);
    }
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}
