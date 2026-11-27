import { animate } from 'motion';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

/**
 * Text-to-dust particle engine (the “swipe dissolves the amount” effect).
 *
 * Every particle position is a pure function of four numbers, so any phase can be
 * reversed smoothly:
 *   dissolve p (0→1)   right-to-left release driven by the swipe thumb
 *   float    a (0→1)   amplitude of an idle drift while the transfer is processing
 *   converge g (0→1)   particles stream into the island (success)
 *   time     τ         seconds, feeds the idle drift
 */

interface Particle {
  x: number;
  y: number;
  th: number; // release threshold
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  size: number;
  blue: boolean;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class ParticleEngine {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  particles: Particle[] = [];
  p = 0;
  a = 0;
  g = 0;
  t0 = performance.now();
  target = { x: 0, y: 0 };
  /** Elements being dissolved; we fade them with a mask that follows p. */
  masked: HTMLElement[] = [];
  bounds = { left: 0, width: 1 };
  /** Each masked element's right edge and width, in canvas units. */
  rects: { left: number; width: number }[] = [];
  raf = 0;
  running = false;
  reduced = false;
  /** dust colours follow the theme; read once per capture */
  colors: [string, string] = ['#e9edf2', '#8ebdf7'];

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
  }

  resize() {
    const c = this.canvas;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Samples the rendered text of the given elements into particles. */
  capture(els: HTMLElement[]) {
    if (!this.canvas) return;
    this.resize();
    const root = getComputedStyle(document.documentElement);
    this.colors = [root.getPropertyValue('--dust').trim() || '#e9edf2', root.getPropertyValue('--dust-accent').trim() || '#8ebdf7'];
    const host = this.canvas.getBoundingClientRect();
    const scale = host.width / this.canvas.offsetWidth || 1; // phone frame may be scaled
    const out: Particle[] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    this.rects = [];
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      const l = (rect.left - host.left) / scale;
      const rw = rect.width / scale;
      this.rects.push({ left: l, width: rw });
      minX = Math.min(minX, l);
      maxX = Math.max(maxX, l + rw);
      const w = Math.ceil(rect.width / scale) + 8;
      const h = Math.ceil(rect.height / scale) + 8;
      const off = document.createElement('canvas');
      const k = 2; // supersample
      off.width = w * k;
      off.height = h * k;
      const o = off.getContext('2d', { willReadFrequently: true })!;
      const cs = getComputedStyle(el);
      o.scale(k, k);
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      o.fillStyle = '#fff';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.direction = (el.getAttribute('dir') as CanvasDirection) || 'rtl';
      o.fillText(el.textContent || '', w / 2, h / 2 + 1);
      const data = o.getImageData(0, 0, w * k, h * k).data;
      const ox = (rect.left - host.left) / scale - 4;
      const oy = (rect.top - host.top) / scale - 4;
      const step = 1.6;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (Math.floor(y * k) * w * k + Math.floor(x * k)) * 4 + 3;
          if (data[i] > 110) {
            const px = ox + x + (Math.random() - 0.5) * 0.6;
            out.push({ x: px, y: oy + y, th: 0, r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random(), size: 1.1 + Math.random() * 0.9, blue: Math.random() < 0.22 });
          }
        }
      }
    }
    const width = Math.max(1, maxX - minX);
    // The left edge goes first, following the thumb travelling left → right.
    for (const q of out) q.th = ((q.x - minX) / width) * 0.8 + q.r4 * 0.2;
    this.particles = out;
    this.bounds = { left: minX, width };
    this.masked = els;
    this.p = this.a = this.g = 0;
  }

  setTarget(x: number, y: number) {
    this.target = { x, y };
  }

  /** Dissolve progress from the swipe control (0..1). */
  setProgress(p: number) {
    this.p = clamp(p);
    this.applyMask();
    this.kick();
  }

  applyMask() {
    // The DOM text stays crisp; we hide the part that has already turned to dust.
    // One shared edge sweeps left → right across all elements («ریال» + number).
    const cut = clamp((this.p * 1.25 - 0.08) / 0.8);
    const edge = this.bounds.left + cut * (this.bounds.width + 24);
    this.masked.forEach((el, i) => {
      const r = this.rects[i];
      const gone = r ? edge - r.left : 0; // px hidden from this element's left side
      const m = this.p <= 0 ? '' : `linear-gradient(to right, transparent ${gone}px, #000 ${gone + 18}px)`;
      el.style.maskImage = m;
      el.style.webkitMaskImage = m;
    });
  }

  tween(key: 'p' | 'a' | 'g', to: number, duration: number, ease: (t: number) => number = inOut) {
    const from = this[key];
    return new Promise<void>((resolve) => {
      if (this.reduced) duration = Math.min(duration, 0.15);
      animate(0, 1, {
        duration,
        ease: 'linear',
        onUpdate: (t) => {
          this[key] = from + (to - from) * ease(t);
          if (key === 'p') this.applyMask();
          this.kick();
        },
        onComplete: () => resolve(),
      });
    });
  }

  dissolveAll() {
    return Promise.all([this.tween('p', 1, 0.7), this.tween('a', 1, 1.2)]).then(() => undefined);
  }

  reform() {
    return Promise.all([this.tween('p', 0, 0.9), this.tween('a', 0, 0.9)]).then(() => undefined);
  }

  converge() {
    return this.tween('g', 1, 1.25, (t) => t);
  }

  clear() {
    this.particles = [];
    for (const el of this.masked) {
      el.style.maskImage = '';
      el.style.webkitMaskImage = '';
    }
    this.masked = [];
    this.p = this.a = this.g = 0;
    this.draw();
  }

  kick() {
    if (!this.running) {
      this.running = true;
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  loop = () => {
    this.draw();
    // keep animating while the dust is floating
    if (this.particles.length && (this.a > 0.001 || this.p > 0.001) && this.g < 1) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.running = false;
    }
  };

  draw() {
    const ctx = this.ctx;
    const c = this.canvas;
    if (!ctx || !c) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!this.particles.length || (this.p <= 0 && this.a <= 0)) return;
    const τ = (performance.now() - this.t0) / 1000;
    const { p, a, g } = this;
    const tx = this.target.x;
    const ty = this.target.y;
    for (const q of this.particles) {
      const f = clamp((p * 1.25 - q.th) / 0.25);
      if (f <= 0 && a <= 0.001) continue;
      const e = smooth(f);
      // dissolve: drift ahead of the thumb (rightwards), lift and scatter
      let x = q.x + (20 + q.r1 * 110) * e;
      let y = q.y + ((q.r2 - 0.5) * 110 - 14) * e + Math.sin(e * 4 + q.r3 * 6) * 10 * e;
      // idle float: the dust spreads into a slow cloud around the screen centre
      const cx = this.bounds.left + this.bounds.width / 2;
      x += a * ((cx - q.x) * 0.6 - (20 + q.r1 * 110) + (q.r2 - 0.5) * 300 + Math.sin(τ * (0.5 + q.r1) + q.r3 * 6.3) * 14);
      y += a * ((q.r3 - 0.5) * 300 + 40 + Math.cos(τ * (0.4 + q.r2) + q.r1 * 6.3) * 14);
      let alpha = (1 - 0.45 * e) * (f > 0 ? 1 : a);
      // converge: every grain accelerates straight into the island's centre, with only a
      // slight sideways bow that is zero at both ends, and fades just as it arrives
      let shrink = 1;
      if (g > 0) {
        const l = clamp((g - q.r4 * 0.35) / 0.65);
        const k = l * l * l; // ease-in: leaves gently, lands fast
        const dx = tx - x;
        const dy = ty - y;
        const len = Math.hypot(dx, dy) || 1;
        const bow = Math.sin(l * Math.PI) * (q.r1 - 0.5) * 24; // perpendicular to the path
        x = x + dx * k + (-dy / len) * bow;
        y = y + dy * k + (dx / len) * bow;
        alpha *= 1 - smooth(clamp((l - 0.86) / 0.14));
        shrink = 1 - 0.5 * k;
      }
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = q.blue ? this.colors[1] : this.colors[0];
      const s = q.size * (1 - 0.25 * e) * shrink;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }
}

const Ctx = createContext<ParticleEngine | null>(null);
export const useParticles = () => useContext(Ctx)!;

export function ParticleProvider({ children, engine }: { children: ReactNode; engine: ParticleEngine }) {
  return <Ctx.Provider value={engine}>{children}</Ctx.Provider>;
}

export function ParticleCanvas({ engine }: { engine: ParticleEngine }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    engine.attach(ref.current);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    engine.reduced = mq.matches;
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [engine]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-40 h-full w-full" aria-hidden />;
}
