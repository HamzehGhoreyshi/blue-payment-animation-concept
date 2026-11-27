import { AnimatePresence, animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { haptic } from '../lib/haptic';
import { IconArrowRight, IconCheck } from './Icons';
import { MoneyStream } from './MoneyStream';

// Original Blu size: 56 px track. Concentric corners: track 14, inset 4 → thumb 10.
const PAD = 4;
const THUMB = 48;

/**
 * Slide-to-confirm in Blu's primary-button style. The thumb travels left → right;
 * its progress drives the amount's dissolve, so letting go early re-forms the amount.
 * While it moves, "money" grains stream out ahead of it and leave through the right end.
 */
export function SwipeConfirm({ label, disabled, done, onProgress, onConfirm }: { label: string; disabled?: boolean; done?: boolean; onProgress: (p: number) => void; onConfirm: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(260);
  const x = useMotionValue(0);
  const p = useTransform(x, (v) => Math.min(1, Math.max(0, v / max)));
  // the label drifts a little with the thumb and softens away
  const labelOpacity = useTransform(p, [0, 0.5], [1, 0]);
  const labelX = useTransform(p, [0, 1], [0, 28]);
  const labelBlur = useTransform(p, [0, 0.5], [0, 4]);
  const labelFilter = useMotionTemplate`blur(${labelBlur}px)`;
  // trail behind the thumb: starts under its centre and is invisible at rest, so nothing frames the thumb
  const fill = useTransform(x, (v) => PAD + THUMB / 2 + v);
  const fillOpacity = useTransform(p, [0, 0.04], [0, 1]);
  // the exit at the right end brightens as the money gets closer to leaving
  const doorOpacity = useTransform(p, [0, 1], [0, 1]);
  const fired = useRef(false);
  const viaKeyboard = useRef(false);
  const [confirmed, setConfirmed] = useState(false);

  // money out: grains stream ahead of the thumb and leave through the right end
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MoneyStream | null>(null);
  const lastX = useRef(0);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const m = new MoneyStream();
    m.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    m.attach(c);
    stream.current = m;
    const ro = new ResizeObserver(() => m.resize(c));
    ro.observe(c);
    return () => {
      ro.disconnect();
      m.stop();
    };
  }, []);
  useMotionValueEvent(x, 'change', (v) => {
    const dx = v - lastX.current;
    lastX.current = v;
    if (dx <= 0 || disabled) return; // only while moving toward the exit
    // more grains the faster the drag; a few even for tiny moves
    const n = Math.floor(dx * 0.8) + (Math.random() < dx * 0.3 ? 1 : 0);
    if (n > 0) stream.current?.emit(PAD + THUMB + v - 4, n, dx * 40);
    // the opposite in the wake: a few slow embers drift back from behind the thumb
    const m = Math.floor(dx * 0.25) + (Math.random() < dx * 0.12 ? 1 : 0);
    if (m > 0) stream.current?.wake(PAD + v + 2, m);
  });

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMax(el.offsetWidth - THUMB - PAD * 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMotionValueEvent(p, 'change', (v) => onProgress(v));

  const complete = () => {
    if (fired.current) return;
    fired.current = true;
    setConfirmed(true);
    stream.current?.burst(PAD + THUMB + x.get() - 6);
    haptic([8, 40, 14]);
    animate(x, max, { type: 'spring', stiffness: 500, damping: 40 });
    onConfirm();
  };

  const release = () => {
    if (p.get() > 0.86) complete();
    else animate(x, 0, { type: 'spring', stiffness: 380, damping: 30 });
  };

  const nudge = () => {
    if (disabled || fired.current) return;
    animate(x, [0, max * 0.18, 0], { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
  };

  return (
    <motion.div
      ref={track}
      className="relative h-14 w-full overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ background: disabled ? 'var(--surface-2)' : 'var(--primary)' }}
      animate={done ? { opacity: 0, scale: 0.94, filter: 'blur(4px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.target === e.currentTarget && nudge()}
      // The track is the accessible control: Enter/Space slides the thumb for keyboard users.
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={`${label} — برای تایید بکشید یا کلید اینتر را بزنید`}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (disabled || viaKeyboard.current || fired.current) return;
        viaKeyboard.current = true;
        animate(x, max, { duration: 0.7, ease: [0.65, 0, 0.35, 1], onComplete: complete });
      }}
    >
      {/* the exit: a soft brightening at the right end */}
      <motion.div className="pointer-events-none absolute inset-y-0 right-0 w-28" style={{ opacity: doorOpacity, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.3))' }} />
      {/* progress fill behind the thumb */}
      <motion.div className="absolute inset-y-0 left-0" style={{ width: fill, opacity: fillOpacity, background: 'linear-gradient(90deg, rgba(16,24,34,0) 0%, rgba(16,24,34,.1) 55%, rgba(16,24,34,.2) 100%)' }} />
      {/* grains: out through the front, embers drifting back in the wake (above the wake shade) */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <motion.span
        className="shimmer pointer-events-none absolute inset-0 grid place-items-center pl-10 text-[16px] font-semibold"
        style={{ opacity: labelOpacity, x: labelX, filter: labelFilter, color: disabled ? 'var(--text-3)' : 'var(--on-primary)' }}
      >
        {label}
      </motion.span>
      <motion.button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        className="absolute grid cursor-grab touch-none place-items-center rounded-[10px] outline-none active:cursor-grabbing"
        style={{ top: PAD, left: PAD, width: THUMB, height: THUMB, x, background: disabled ? 'var(--line)' : 'var(--on-primary)', color: disabled ? 'var(--text-3)' : 'var(--primary)' }}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        whileDrag={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        onDragEnd={release}
        onTap={() => p.get() < 0.02 && nudge()}
      >
        {/* the arrow turns into a tick the moment the swipe lands */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={confirmed ? 'tick' : 'arrow'}
            className="grid place-items-center"
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
            transition={{ type: 'spring', stiffness: 520, damping: 30 }}
          >
            {confirmed ? <IconCheck size={22} /> : <IconArrowRight size={22} strokeWidth={2} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
