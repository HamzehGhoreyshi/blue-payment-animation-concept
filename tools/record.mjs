// Films the demo frame by frame on a virtual clock, so every frame is exactly 1/60 s after
// the last and nothing ever drops. A soft touch dot plays the finger; the drags and the tap
// are real pointer events sent to Chrome, so the app reacts exactly as it would to a user.
//
// Story (~19 s, ends on the same screen it starts on, so it loops):
//   rest → half swipe and let go (the amount re-forms) → full swipe → island scan, spinner,
//   check, dust flies into it → success screen → tap «بازگشت» → island receipt drops down.
//
// Needs: Google Chrome, ffmpeg, and `npm i --no-save puppeteer-core`. Run `npm run build` first.
//   node tools/record.mjs <out.mp4> <css width> <css height> <device scale> [output width]
//   e.g. social 9:16 4K: node tools/record.mjs social-4k.mp4 540 960 4
//        README 16:9 4K: node tools/record.mjs readme-4k.mp4 1280 720 3
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const [out, width = '540', height = '960', scaleArg = '4', outWidth] = process.argv.slice(2);
if (!out) throw new Error('usage: node tools/record.mjs <out.mp4> [width] [height] [scale] [output width]');
const W = Number(width), H = Number(height), SCALE = Number(scaleArg);
const OW = Number(outWidth || W * SCALE), OH = Math.round((OW * H) / W / 2) * 2;
const DIST = path.resolve('dist');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 60;

// ---------- a tiny file server for dist/ ----------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer(async (req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(DIST, name === '/' ? 'index.html' : name);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
page.on('pageerror', (e) => console.error('page error:', e.message));

// ---------- the page's clock, driven from here ----------
await page.evaluateOnNewDocument(() => {
  const realFrame = window.requestAnimationFrame.bind(window);
  let now = 0;
  let frames = [];
  let timers = [];
  let id = 1;
  const seen = new WeakSet();
  performance.now = () => now;
  Date.now = () => 1700000000000 + now;
  window.requestAnimationFrame = (fn) => { frames.push({ id: ++id, fn }); return id; };
  window.cancelAnimationFrame = (handle) => { frames = frames.filter((f) => f.id !== handle); };
  window.setTimeout = (fn, delay = 0, ...args) => { timers.push({ id: ++id, at: now + delay, fn: () => fn(...args) }); return id; };
  window.clearTimeout = (handle) => { timers = timers.filter((t) => t.id !== handle); };
  window.__step = (ms) => {
    now += ms;
    // timers may schedule timers; run everything that is due, in order
    for (let guard = 0; guard < 50; guard++) {
      const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at);
      if (!due.length) break;
      timers = timers.filter((t) => t.at > now);
      for (const timer of due) timer.fn();
    }
    const batch = frames;
    frames = [];
    for (const frame of batch) frame.fn(now);
    for (const animation of document.getAnimations()) {
      if (!seen.has(animation)) { seen.add(animation); animation.pause(); animation.currentTime = 0; }
      else animation.currentTime = Number(animation.currentTime) + ms;
    }
    return new Promise((done) => realFrame(() => realFrame(done)));
  };
});

await page.goto(`${origin}/?demo`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

// The finger: a soft translucent touch dot, positioned by this script every frame.
await page.addStyleTag({
  content: `#touch { position: fixed; left: 0; top: 0; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
    background: rgba(255,255,255,.26); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.55), 0 4px 18px rgba(0,0,0,.35);
    z-index: 2147483647; pointer-events: none; opacity: 0; will-change: transform, opacity; }`,
});
await page.evaluate(() => {
  const d = document.createElement('div');
  d.id = 'touch';
  document.body.append(d);
});
const setTouch = (x, y, opacity, scale) =>
  page.evaluate((x, y, o, s) => {
    const d = document.getElementById('touch');
    d.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    d.style.opacity = String(o);
  }, x, y, opacity, scale);

const rectOf = (selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, right: r.right, w: r.width };
  }, selector);

const step = () => page.evaluate((ms) => window.__step(ms), 1000 / FPS);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- film ----------
const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', `scale=${OW}:${OH}:flags=lanczos`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const finished = new Promise((done) => ffmpeg.on('close', done));
const cdp = await page.createCDPSession();
let frame = 0;

async function shoot() {
  await step();
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: W, height: H, scale: SCALE } });
  if (!ffmpeg.stdin.write(Buffer.from(data, 'base64'))) await new Promise((done) => ffmpeg.stdin.once('drain', done));
  if (++frame % 120 === 0) console.log(`${out}: frame ${frame}`);
}
const hold = async (s) => { for (let i = 0, n = Math.round(s * FPS); i < n; i++) await shoot(); };

/** Finger fades in at (x, y), slightly large, then settles. */
async function appear(x, y, s = 0.28) {
  const n = Math.round(s * FPS);
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n);
    await setTouch(x, y, k, 1.25 - 0.25 * k);
    await shoot();
  }
}
/** Finger lifts away. */
async function lift(x, y, s = 0.3) {
  const n = Math.round(s * FPS);
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n);
    await setTouch(x, y, 1 - k, 1 + 0.3 * k);
    await shoot();
  }
}
/** Press, drag horizontally from x0 to x1 over s seconds, hold, release. */
async function drag(x0, x1, y, s, holdAfter = 0.12) {
  await page.mouse.move(x0, y);
  await page.mouse.down();
  for (let i = 0; i < 6; i++) { await setTouch(x0, y, 1, 1 - 0.12 * ((i + 1) / 6)); await shoot(); } // press in
  const n = Math.round(s * FPS);
  for (let i = 1; i <= n; i++) {
    const x = x0 + (x1 - x0) * ease(i / n);
    await page.mouse.move(x, y);
    await setTouch(x, y, 1, 0.88);
    await shoot();
  }
  await hold(holdAfter);
  await page.mouse.up();
  return x1;
}
/** A tap with a visible press. */
async function tap(x, y) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 7; i++) { await setTouch(x, y, 1, 1 - 0.14 * (i / 7)); await shoot(); }
  await page.mouse.up();
  for (let i = 1; i <= 7; i++) { await setTouch(x, y, 1, 0.86 + 0.14 * (i / 7)); await shoot(); }
}

const THUMB = '[role=button][aria-label*="بکشید"] button';

await hold(1.4); // entrance animations, then a beat on the review screen

// 1 — half swipe and let go: the amount crumbles, then re-forms
let t = await rectOf(THUMB);
const track = await rectOf('[role=button][aria-label*="بکشید"]');
await appear(t.x, t.y);
await hold(0.15);
const mid = t.x + (track.right - t.x) * 0.55;
await drag(t.x, mid, t.y, 0.95, 0.35);
await lift(mid, t.y);
await hold(1.25);

// 2 — full swipe
t = await rectOf(THUMB);
await appear(t.x, t.y);
await hold(0.12);
const end = track.right - (t.x - track.left);
await drag(t.x, end, t.y, 1.05, 0.08);
await lift(end, t.y, 0.35);

// processing on the island, dust flies in, success screen builds up
await hold(7.6);

// 3 — back: tap «بازگشت», the island drops the receipt
const back = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'بازگشت');
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
await appear(back.x, back.y, 0.25);
await hold(0.1);
await tap(back.x, back.y);
await lift(back.x, back.y, 0.25);
await hold(4.2);

ffmpeg.stdin.end();
await finished;
await browser.close();
server.close();
console.log(`${out}: done (${(frame / FPS).toFixed(1)} s, ${OW}x${OH})`);
