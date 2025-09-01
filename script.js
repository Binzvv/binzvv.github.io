// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

const bounds = document.getElementById('bounds');
const cards  = Array.from(document.querySelectorAll('.drag'));
const dot    = document.getElementById('dot');

/**
 * Lay out cards in a "fan" around the center.
 * - Cards are positioned at 50%/50%.
 * - We rotate each by an angle across a spread and push them outward by a radius.
 * - Then counter-rotate so the images stay upright (looks like a fanned deck).
 */
function layoutFan(animate = true) {
  const b = bounds.getBoundingClientRect();

  // radius relative to viewport (smaller on phones)
  const radius = Math.max(80, Math.min(b.width, b.height) * 0.22);

  const n = cards.length;
  const spread = n > 1 ? 60 : 0;       // total angle spread in degrees (tweak)
  const start  = -spread / 2;          // starting angle
  const step   = n > 1 ? spread / (n - 1) : 0;

  cards.forEach((el, i) => {
    const angle = start + step * i;          // -30 .. +30 for 5 cards
    const rad   = angle * Math.PI / 180;

    // Build the target transform:
    // center, rotate by angle, move outwards, counter-rotate so image looks upright
    const target =
      `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px, 0) rotate(${-angle}deg)`;

    if (animate) {
      // nice intro animation from stacked center
      gsap.fromTo(el,
        { xPercent: -50, yPercent: -50, rotation: 0, scale: 0.7, x: 0, y: 0 },
        {
          duration: 0.55,
          ease: "power3.out",
          onUpdate() {
            // gsap is animating transforms numerically; for simplicity we just set final string at end
          },
          onComplete() {
            el.style.transform = target;
          }
        }
      );
      // Also set the final transform immediately so Draggable picks it up correctly after animation
      el.style.transform = target;
    } else {
      el.style.transform = target;
    }
  });
}

// Initial layout
layoutFan(true);

// Recalculate on resize (no animation so it feels snappy)
window.addEventListener('resize', () => layoutFan(false));

// Make them draggable
let z = 10;
cards.forEach((el) => {
  Draggable.create(el, {
    type: 'x,y',
    bounds: bounds,
    edgeResistance: 0.65,

    onPress() {
      this.target.style.zIndex = ++z;
      dot.classList.add('grab');
      dot.textContent = 'drag';
      // Fast pickup feel
      gsap.to(this.target, { scale: 1.2, duration: 0.1, overwrite: true });
    },

    onRelease() {
      dot.classList.remove('grab');
      dot.textContent = 'drag';
      // Quick settle
      gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power3.out" });
    }
  });

  el.addEventListener('mouseenter', () => dot.classList.add('hover'));
  el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
});

// Cursor follows mouse
window.addEventListener('mousemove', (e) => {
  gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.12, ease: 'power3.out' });
});
