// Pointer state, damped springs and the custom cursor.
// Nothing reads raw mouse coordinates directly: every consumer pulls from
// its own spring so heavier things lag and overshoot differently.

export class Spring {
  // stiffness k (1/s^2), damping ratio z (1 = critical)
  constructor(k = 40, z = 1, v = 0) {
    this.k = k; this.c = 2 * Math.sqrt(k) * z;
    this.x = v; this.v = 0;
  }
  step(target, dt) {
    // Semi-implicit Euler, sub-stepped so big frames stay stable.
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = this.k * (target - this.x) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  kick(dv) { this.v += dv; }
}

export class Pointer {
  constructor({ fine }) {
    this.fine = fine;
    this.x = innerWidth / 2; this.y = innerHeight / 2;
    this.nx = 0; this.ny = 0;          // -1..1, y up
    this.vx = 0; this.vy = 0;          // px/s, smoothed
    this.speed = 0;
    this.seen = false;                 // has a real pointer been observed
    this.down = false;
    this.touching = false;
    this.lastMove = -10;
    this._px = this.x; this._py = this.y;
    this.listeners = { down: [], up: [] };

    const move = (x, y, t) => {
      this.x = x; this.y = y;
      this.seen = true;
      this.lastMove = t;
    };
    addEventListener('pointermove', (e) => move(e.clientX, e.clientY, performance.now() / 1000), { passive: true });
    addEventListener('pointerdown', (e) => {
      move(e.clientX, e.clientY, performance.now() / 1000);
      this.touching = e.pointerType !== 'mouse';
      this.down = true;
      this._px = this.x; this._py = this.y;
      this.listeners.down.forEach((f) => f(e));
    });
    const up = (e) => {
      this.down = false;
      this.listeners.up.forEach((f) => f(e));
      if (e.pointerType !== 'mouse') this.touching = false;
    };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    document.addEventListener('pointerleave', () => { this.lastMove = -10; });
  }
  on(type, fn) { this.listeners[type].push(fn); }

  update(dt, t) {
    const ivx = (this.x - this._px) / Math.max(dt, 1e-3);
    const ivy = (this.y - this._py) / Math.max(dt, 1e-3);
    this._px = this.x; this._py = this.y;
    const a = 1 - Math.exp(-dt * 14);
    this.vx += (ivx - this.vx) * a;
    this.vy += (ivy - this.vy) * a;
    this.speed = Math.hypot(this.vx, this.vy);
    this.nx = (this.x / innerWidth) * 2 - 1;
    this.ny = -((this.y / innerHeight) * 2 - 1);
    this.idle = t - this.lastMove;
  }
}

// Minimal cursor: a dot that is almost attached, a ring that only exists
// near things you can touch. Near the sphere the ring is pulled toward its
// centre and wraps it; while dragging it flattens along the drag.
export class Cursor {
  constructor(el) {
    this.el = el;
    this.dot = el.querySelector('.dot');
    this.ring = el.querySelector('.ring');
    this.dx = new Spring(900, 1, innerWidth / 2); this.dy = new Spring(900, 1, innerHeight / 2);
    this.rx = new Spring(140, 0.8, innerWidth / 2); this.ry = new Spring(140, 0.8, innerHeight / 2);
    this.rs = new Spring(160, 0.7, 0.4);
    this.ro = new Spring(120, 1, 0);
    this.ds = new Spring(260, 0.6, 1);
    this.stretch = new Spring(200, 0.7, 0);
    this.heat = 0;
  }
  update(dt, p, s) {
    const prox = s.prox;
    const mag = s.dragging ? 0 : 0.22 * prox * prox;
    const tx = p.x + (s.sx - p.x) * mag;
    const ty = p.y + (s.sy - p.y) * mag;
    const x = this.dx.step(tx, dt), y = this.dy.step(ty, dt);
    const rx = this.rx.step(s.dragging ? p.x : tx, dt), ry = this.ry.step(s.dragging ? p.y : ty, dt);

    const near = Math.max(prox, s.dragging ? 1 : 0);
    const scale = this.rs.step(s.dragging ? 0.55 : 0.4 + near * 0.85, dt);
    const op = this.ro.step(near > 0.08 ? Math.min(1, near * 1.6) : 0, dt);
    const ds = this.ds.step(s.dragging ? 0 : 1 - near * 0.5, dt);
    const st = this.stretch.step(s.dragging ? Math.min(p.speed / 1600, 0.9) : 0, dt);
    const ang = Math.atan2(p.vy, p.vx);

    this.dot.style.transform = `translate3d(${x}px,${y}px,0) scale(${ds})`;
    this.ring.style.transform =
      `translate3d(${rx}px,${ry}px,0) rotate(${ang}rad) scale(${scale * (1 + st)},${scale * (1 - st * 0.6)}) rotate(${-ang}rad)`;
    this.ring.style.opacity = op.toFixed(3);
  }
}
