// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

const bounds = document.getElementById('bounds');
const cards  = Array.from(document.querySelectorAll('.drag'));
const dot    = document.getElementById('dot');

function random(min, max) { return Math.random() * (max - min) + min; }

// Layout cards roughly around edges
function layout() {
  const b = bounds.getBoundingClientRect();
  const pad = 40;

  cards.forEach((el) => {
    const w = el.getBoundingClientRect().width;
    const h = w * 3/4;

    const edge = Math.random();
    let x, y;

    if (edge < 0.25) { x = random(pad, b.width - w - pad); y = pad; }
    else if (edge < 0.5) { x = random(pad, b.width - w - pad); y = b.height - h - pad; }
    else if (edge < 0.75) { x = pad; y = random(pad, b.height - h - pad); }
    else { x = b.width - w - pad; y = random(pad, b.height - h - pad); }

    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.transform = 'rotate(' + random(-8, 8).toFixed(1) + 'deg)';
  });
}

layout();
window.addEventListener('resize', layout);

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
    // Faster pickup
    gsap.to(this.target, { scale: 1.2, duration: 0.1, overwrite: true });
  },
  onRelease() {
    dot.classList.remove('grab');
    dot.textContent = 'drag';
    // Faster release
    gsap.to(this.target, { scale: 1, duration: 0.2, ease: "power3.out" });
  }
});


  el.addEventListener('mouseenter', () => dot.classList.add('hover'));
  el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
});

// Cursor follows mouse
window.addEventListener('mousemove', (e) => {
  gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power3.out' });
});