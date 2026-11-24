// ─────────────────────────────────────────────────────────────────────────────
// Simulated run: a believable runner, not a random number generator.
// Warm-up from a jog, a settled pace that drifts with terrain, occasional
// surges. Elapsed time is real wall-clock time (pause-aware).
// ─────────────────────────────────────────────────────────────────────────────

export class RunSim {
  constructor() { this.reset(); }

  reset() {
    this.elapsed = 0;        // s
    this.distance = 0;       // km
    this.pace = 430;         // s per km (smoothed, current)
    this.bpm = 92;
    this.intensity = 0;      // 0..1, drives the energy field
    this.running = false;
    this.paused = false;
    this.surge = 0;
    this.nextSurge = 45 + Math.random() * 40;
    this.seed = Math.random() * 100;
  }

  start() { this.running = true; this.paused = false; }
  stop() { this.running = false; }
  setPaused(p) { this.paused = p; }

  update(dt) {
    if (!this.running || this.paused) return;
    dt = Math.min(dt, 5);
    this.elapsed += dt;
    const t = this.elapsed + this.seed;

    // surges: 12–18 s efforts every 45–85 s
    if (this.elapsed > this.nextSurge) {
      this.surge = 1;
      this.nextSurge = this.elapsed + 45 + Math.random() * 40;
      this.surgeEnd = this.elapsed + 12 + Math.random() * 6;
    }
    const surgeTarget = this.surgeEnd && this.elapsed < this.surgeEnd ? 1 : 0;
    this.surge += (surgeTarget - this.surge) * Math.min(1, dt * 0.5);

    const warm = 1 - Math.pow(1 - Math.min(1, this.elapsed / 28), 3);
    let target = 322 + 16 * Math.sin(t / 37) + 9 * Math.sin(t / 11.3 + 1.7) + 4 * Math.sin(t / 3.1) - this.surge * 38;
    target = 430 + (target - 430) * warm;
    this.pace += (target - this.pace) * Math.min(1, dt * 0.7);
    this.distance += dt / this.pace;

    this.intensity = Math.max(0, Math.min(1, (392 - this.pace) / 100));
    const bpmTarget = 104 + warm * (36 + 30 * this.intensity) + 2 * Math.sin(t / 5.3);
    this.bpm += (bpmTarget - this.bpm) * Math.min(1, dt * 0.22);
  }

  get avgPace() { return this.distance > 0.01 ? this.elapsed / this.distance : null; }
  get showPace() { return this.elapsed > 6 && this.distance > 0.004; }
}

export const fmt = {
  km(d) { return (Math.floor(d * 100) / 100).toFixed(2); },
  time(s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  },
  pace(p) {
    if (!p || !isFinite(p) || p > 1800) return `-'--"`;
    const m = Math.floor(p / 60), s = Math.floor(p % 60);
    return `${m}'${String(s).padStart(2, '0')}"`;
  },
  runName(date = new Date()) {
    const day = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const h = date.getHours();
    const part = h < 5 ? 'Night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night';
    return `${day} ${part} Run`;
  },
};
