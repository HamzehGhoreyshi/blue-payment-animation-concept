import { AnimatePresence, MotionConfig, motion, type Variants } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { InertWhenLeaving } from './components/Inert';
import { Island, IslandProvider } from './components/Island';
import { ParticleCanvas, ParticleEngine, ParticleProvider } from './components/Particles';
import { Sheet } from './components/Sheet';
import { ToastProvider } from './components/Toast';
import { fa } from './lib/format';
import { EASE_OUT, push } from './lib/motion';
import { Review, Toggle } from './screens/Flow';
import { Success } from './screens/Success';
import { StoreProvider, useStore } from './store';

const W = 390;
const H = 844;

/** Desktop shows the app inside a phone frame; real phones get the app full-screen. */
function useFrame() {
  const calc = () => {
    const demo = document.documentElement.classList.contains('demo');
    const narrow = window.innerWidth < 600;
    const footer = demo ? 0 : narrow ? 44 : 52;
    // The phone mockup shows everywhere, phones included, scaled to fit with a margin.
    const framed = true;
    const [mx, my] = narrow ? [28, 36] : [48, 64];
    // in the browser the phone sits a little smaller than life size, with room around it
    const cap = demo ? 1 : 0.86;
    const scale = Math.min(cap, (window.innerHeight - footer - my) / H, (window.innerWidth - mx) / W);
    return { framed, scale };
  };
  const [f, setF] = useState(calc);
  useEffect(() => {
    const on = () => setF(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return f;
}

export default function App() {
  const engine = useMemo(() => new ParticleEngine(), []);
  const { framed, scale } = useFrame();
  return (
    // The phone frame is CSS-scaled on smaller windows; map pointer positions into its space
    // so a drag moves the thumb exactly as far as the pointer (only deltas matter here).
    <MotionConfig reducedMotion="user" transformPagePoint={scale === 1 ? undefined : (pt) => ({ x: pt.x / scale, y: pt.y / scale })}>
      <StoreProvider>
        <IslandProvider>
          <ParticleProvider engine={engine}>
            {/* flex (not grid) so the scaled phone centres on the visible area, not its unscaled height */}
            <div className="flex w-full items-center justify-center overflow-hidden" style={{ height: 'calc(100% - var(--footer-h))' }}>
              <div
                id="frame"
                className={`relative shrink-0 overflow-hidden ${framed ? '' : 'app-mobile h-full w-full'}`}
                style={
                  framed
                    ? { width: W, height: H, borderRadius: 56, background: 'var(--bg)', transform: `scale(${scale})`, boxShadow: '0 0 0 11px #05070a, 0 0 0 12.5px #2a2f36, 0 40px 90px rgba(0,0,0,.6)' }
                    : { background: 'var(--bg)', height: 'calc(100dvh - var(--footer-h))' }
                }
              >
                <ToastProvider>
                  {framed && <StatusBar />}
                  <Screens />
                  <HelpSheet />
                  <ParticleCanvas engine={engine} />
                  <Island framed={framed} />
                  {framed && <span className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80" />}
                </ToastProvider>
              </div>
            </div>
          </ParticleProvider>
        </IslandProvider>
      </StoreProvider>
    </MotionConfig>
  );
}

function Screens() {
  const s = useStore();
  // flow → success is a reveal (the dust already carried the amount away), not a push
  const c = { dir: s.dir, reveal: s.view === 'success' };
  return (
    <AnimatePresence initial={false} custom={c}>
      <motion.div key={s.view} custom={c} variants={views} initial="enter" animate="center" exit="exit" className="absolute inset-0">
        <InertWhenLeaving>
          {s.view === 'review' && <Review />}
          {s.view === 'success' && s.receipt && <Success />}
        </InertWhenLeaving>
      </motion.div>
    </AnimatePresence>
  );
}

type C = { dir: number; reveal: boolean };
const pv = push as unknown as Record<'enter' | 'center' | 'exit', ((d: number) => object) | object>;
const call = (v: ((d: number) => object) | object, d: number) => (typeof v === 'function' ? v(d) : v);
const views: Variants = {
  enter: (c: C) => (c.reveal ? { opacity: 0, scale: 0.98, x: 0 } : call(pv.enter, c.dir)),
  center: (c: C) => (c.reveal ? { opacity: 1, scale: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } } : call(pv.center, c.dir)),
  exit: (c: C) => (c.reveal ? { opacity: 0, transition: { duration: 0.3 } } : call(pv.exit, c.dir)),
};

function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  const time = `${fa(now.getHours())}:${fa(String(now.getMinutes()).padStart(2, '0'))}`;
  return (
    <div dir="ltr" className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-[54px] items-center justify-between px-9 pt-1 text-[16px] font-semibold text-white" aria-hidden>
      <span className="w-16 text-center">{time}</span>
      <span className="flex w-16 items-center justify-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 7a6 6 0 0 1 8 0" /><circle cx="8" cy="10" r="1.2" fill="#fff" stroke="none" /></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x=".5" y=".5" width="22" height="12" rx="3.5" stroke="#fff" strokeOpacity=".5" /><rect x="2.5" y="2.5" width="14" height="8" rx="2" fill="#fff" /><path d="M24.5 4.5v4" stroke="#fff" strokeOpacity=".5" strokeLinecap="round" /></svg>
      </span>
    </div>
  );
}

function HelpSheet() {
  const s = useStore();
  return (
    <Sheet open={s.helpOpen} onClose={() => s.setHelpOpen(false)} title="راهنمای انتقال">
      <p className="text-[14px] leading-7" style={{ color: 'var(--text-2)' }}>
        جزئیات انتقال را بررسی کنید و برای تایید، دکمه را به سمت راست بکشید. اگر پیش از پایان رها کنید، انتقال انجام نمی‌شود.
      </p>
      <div className="mt-5 flex items-center justify-between rounded-xl p-3.5 text-[14px]" style={{ background: 'var(--surface-2)' }}>
        <span>
          شبیه‌سازی خطا در انتقال بعدی
          <span className="mt-0.5 block text-[12px]" style={{ color: 'var(--text-3)' }}>برای دیدن حالت ناموفق در این نمونه نمایشی</span>
        </span>
        <Toggle checked={s.simulateError} onChange={s.setSimulateError} label="شبیه‌سازی خطا در انتقال بعدی" />
      </div>
      <p className="mt-4 text-[12px] leading-5" style={{ color: 'var(--text-3)' }}>
        نام و شماره‌ها نمونه (لورم ایپسوم) هستند و هیچ تراکنش واقعی انجام نمی‌شود.
      </p>
    </Sheet>
  );
}
