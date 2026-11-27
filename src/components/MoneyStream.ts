/**
 * "Money out": small glowing grains that stream from the swipe thumb toward the button's
 * right end and leave through it. Drag speed sets how many flow; confirming sends a burst.
 *
 * One small canvas inside the track. The loop runs only while grains are alive, and uses
 * requestAnimationFrame + performance.now, so it also films cleanly in the recorder.
 */
interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number; // 0..1, fades in then out
  tint: number; // 0 = white, 1 = pale blue
  ember?: boolean; // behind the thumb: slow, round, drifting backwards — the opposite of the stream
}

const MAX = 260;

export class MoneyStream {
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;
  private grains: Grain[] = [];
  private raf = 0;
  private last = 0;
  reduced = false;

  attach(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.resize(canvas);
  }

  resize(canvas: HTMLCanvasElement) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 4) * Math.max(0.5, r.width / (canvas.offsetWidth || r.width));
    // layout size (unscaled), so drawing stays in CSS pixels even inside a scaled frame
    this.w = canvas.offsetWidth || r.width;
    this.h = canvas.offsetHeight || r.height;
    canvas.width = Math.round(this.w * dpr);
    canvas.height = Math.round(this.h * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Emit `n` grains from just ahead of the thumb, carrying some of its speed. */
  emit(fromX: number, n: number, push = 0) {
    if (this.reduced || !this.ctx) return;
    for (let i = 0; i < n && this.grains.length < MAX; i++) {
      this.grains.push({
        x: fromX + Math.random() * 6,
        y: this.h / 2 + (Math.random() - 0.5) * this.h * 0.5,
        vx: 90 + Math.random() * 160 + push * 0.6,
        vy: (Math.random() - 0.5) * 30,
        r: 0.5 + Math.random() * 0.9,
        life: 0,
        tint: Math.random() < 0.35 ? 1 : 0,
      });
    }
    this.kick();
  }

  /**
   * The wake behind the thumb does the opposite of the front: instead of fast streaks
   * leaving to the right, soft round embers drift slowly backwards (left) and fade out.
   */
  wake(behindX: number, n: number) {
    if (this.reduced || !this.ctx) return;
    for (let i = 0; i < n && this.grains.length < MAX; i++) {
      this.grains.push({
        x: behindX - Math.random() * 8,
        y: this.h / 2 + (Math.random() - 0.5) * this.h * 0.62,
        vx: -(14 + Math.random() * 34),
        vy: (Math.random() - 0.5) * 10,
        r: 0.9 + Math.random() * 1.6,
        life: 1,
        tint: Math.random() < 0.5 ? 1 : 0,
        ember: true,
      });
    }
    this.kick();
  }

  /** The swipe landed: one last rush out of the door. */
  burst(fromX: number) {
    this.emit(fromX, 70, 260);
  }

  private kick() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const ctx = this.ctx!;
    ctx.clearRect(0, 0, this.w, this.h);
    const door = this.w - 6;
    const keep: Grain[] = [];
    for (const g of this.grains) {
      if (g.ember) {
        // embers slow down and fade away behind the thumb
        g.vx *= 1 - dt * 1.4;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.life -= dt * 1.1;
        if (g.life <= 0 || g.x < -6) continue;
        keep.push(g);
        const a = Math.sin(Math.min(1, g.life) * Math.PI * 0.5) * 0.55; // eased fade
        ctx.globalAlpha = a;
        ctx.fillStyle = g.tint ? '#cfe2ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r * (0.6 + 0.4 * g.life), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      g.vx *= 1 + dt * 0.9; // they accelerate toward the exit
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy *= 1 - dt * 3; // drift settles back to the centre line
      g.life = Math.min(1, g.life + dt * 6);
      if (g.x > this.w + 8) continue; // gone through the door
      keep.push(g);
      // fade in at birth, fade out over the last 30% of the track
      const exit = Math.min(1, Math.max(0, (g.x - door * 0.7) / (door * 0.3)));
      const a = g.life * (1 - exit * exit);
      if (a <= 0.02) continue;
      // a short streak in the direction of travel reads as speed
      const len = Math.min(14, 2 + g.vx * 0.03);
      ctx.globalAlpha = a;
      ctx.strokeStyle = g.tint ? '#dbe9ff' : '#ffffff';
      ctx.lineWidth = g.r * 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.x - len, g.y);
      ctx.lineTo(g.x, g.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.grains = keep;
    this.raf = this.grains.length ? requestAnimationFrame(this.loop) : 0;
  };

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.grains = [];
    this.ctx?.clearRect(0, 0, this.w, this.h);
  }
}
