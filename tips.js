const tips = [
  {
    cat: 'vt', title: 'Wrap any DOM update',
    blurb: 'Same-document transitions are one call. The browser snapshots, you mutate, it crossfades.',
    code: `document.startViewTransition(() => {
  updateTheDOM();
});`,
    support: 'Chrome/Edge 111+, Safari 18+, Firefox 144+. Feature-detect and just run the update if missing.'
  },
  {
    cat: 'vt', title: 'Cross-page, zero JS',
    blurb: 'Opt both same-origin pages in and normal link navigations animate. The "Quick Tips" title morphed from the fan page this way.',
    code: `@view-transition {
  navigation: auto;
}`,
    support: 'Chrome/Edge 126+, Safari 18.2+. Unsupported browsers navigate normally.'
  },
  {
    cat: 'vt', title: 'Name it to morph it',
    blurb: 'Give an element in the old and new state the same view-transition-name and it animates position and size between them.',
    code: `.card.active { view-transition-name: tip-morph; }
dialog .panel { view-transition-name: tip-morph; }`,
    support: 'Names must be unique on the page at capture time.'
  },
  {
    cat: 'vt', title: 'match-element + classes',
    blurb: 'Skip hand-numbering every item. match-element gives each element a unique name, and view-transition-class styles them as a group.',
    code: `.tip {
  view-transition-name: match-element;
  view-transition-class: tip;
}
::view-transition-group(*.tip) {
  animation-duration: .35s;
}`,
    support: 'match-element: Chrome 137+, Safari 18.4+. This page falls back to JS-assigned names.'
  },
  {
    cat: 'vt', title: 'Transition types',
    blurb: 'Tag a transition so CSS can animate "filter" differently from "open" or "close".',
    code: `document.startViewTransition({
  update: applyFilter,
  types: ['filter'],
});

html:active-view-transition-type(filter)
  ::view-transition-group(*.tip) { animation-duration: .3s; }`,
    support: 'Chrome 125+, Safari 18.2+.'
  },
  {
    cat: 'vt', title: 'Respect reduced motion',
    blurb: 'Keep the state change, drop the movement.',
    code: `@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}`,
    support: 'Works everywhere view transitions do.'
  },
  {
    cat: 'interop', title: 'Anchor positioning',
    blurb: 'Tether a tooltip or popover to a button in pure CSS, with automatic flipping when it hits the edge.',
    code: `.btn { anchor-name: --pop; }
[popover] {
  position-anchor: --pop;
  position-area: top;
  position-try-fallbacks: flip-block;
}`,
    support: 'Chrome 125+, Safari 26+. Firefox in progress.'
  },
  {
    cat: 'interop', title: '@starting-style',
    blurb: 'Animate elements as they appear, including popovers and dialogs leaving display: none.',
    code: `[popover] {
  transition: opacity .2s,
    display .2s allow-discrete,
    overlay .2s allow-discrete;
}
@starting-style {
  [popover]:popover-open { opacity: 0; }
}`,
    support: 'Chrome 117+, Safari 17.5+, Firefox 129+.'
  },
  {
    cat: 'interop', title: 'Animate to height: auto',
    blurb: 'interpolate-size plus ::details-content gives a real accordion with no JavaScript.',
    code: `:root { interpolate-size: allow-keywords; }
details::details-content {
  block-size: 0; overflow: clip;
  transition: block-size .3s,
    content-visibility .3s allow-discrete;
}
details[open]::details-content { block-size: auto; }`,
    support: 'Chrome 129+. Others get an instant open, which is fine.'
  },
  {
    cat: 'interop', title: 'Scroll-driven animations',
    blurb: 'Tie keyframes to scroll position or element visibility. Runs off the main thread.',
    code: `.progress {
  animation: grow linear both;
  animation-timeline: scroll(root);
}
.card {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 60%;
}`,
    support: 'Chrome 115+, Safari 26+. Wrap in @supports.'
  }
];

const label = { vt: 'View Transitions', interop: 'Interop CSS' };
const deck = document.getElementById('deck');
const dialog = document.getElementById('detail');
const $ = (id) => document.getElementById(id);

const canVT = typeof document.startViewTransition === 'function';
const supportsMatchElement = window.CSS?.supports?.('view-transition-name', 'match-element');

// Run an update inside a view transition when supported, otherwise just run it.
function transition(update, types = []) {
  if (!canVT) { update(); return null; }
  try {
    return document.startViewTransition({ update, types });
  } catch {
    // Older Chromium only accepts a callback (no types).
    return document.startViewTransition(update);
  }
}

// Build the deck
tips.forEach((tip, i) => {
  const li = document.createElement('li');
  li.dataset.cat = tip.cat;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tip';
  if (!supportsMatchElement) btn.style.viewTransitionName = `tip-${i}`;
  btn.innerHTML = `<span class="tag ${tip.cat}"></span><h3></h3><p></p>`;
  btn.querySelector('.tag').textContent = label[tip.cat];
  btn.querySelector('h3').textContent = tip.title;
  btn.querySelector('p').textContent = tip.blurb;
  btn.addEventListener('click', () => openTip(tip, btn));
  li.append(btn);
  deck.append(li);
});

// Filtering: cards that stay slide to new spots, removed ones fade out
document.querySelectorAll('[data-filter]').forEach((b) => {
  b.addEventListener('click', () => {
    const f = b.dataset.filter;
    transition(() => {
      document.querySelectorAll('[data-filter]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x === b)));
      deck.querySelectorAll('li').forEach((li) => {
        li.hidden = f !== 'all' && li.dataset.cat !== f;
      });
    }, ['filter']);
  });
});

// Card -> dialog morph. The panel always carries `tip-morph`; while the dialog
// is closed it isn't rendered, so the clicked card borrows the name instead.
let activeCard = null;
let restoreName = '';

function fill(tip) {
  const tag = $('detail-tag');
  tag.className = `tag ${tip.cat}`;
  tag.textContent = label[tip.cat];
  $('detail-title').textContent = tip.title;
  $('detail-body').textContent = tip.blurb;
  $('detail-code').textContent = tip.code;
  $('detail-support').textContent = tip.support;
}

function openTip(tip, card) {
  activeCard = card;
  restoreName = card.style.viewTransitionName;
  card.style.viewTransitionName = 'tip-morph';
  transition(() => {
    card.style.viewTransitionName = restoreName;
    fill(tip);
    dialog.showModal();
  }, ['open']);
}

function closeTip() {
  if (!dialog.open) return;
  const card = activeCard;
  const vt = transition(() => {
    dialog.close();
    if (card) card.style.viewTransitionName = 'tip-morph';
  }, ['close']);
  const reset = () => { if (card) card.style.viewTransitionName = restoreName; card?.focus(); };
  vt ? vt.finished.finally(reset) : reset();
}

$('detail-close').addEventListener('click', closeTip);
dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeTip(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) closeTip(); });
