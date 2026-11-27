import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { IconArrowRight } from './Icons';

const PAD = 4;
const THUMB = 48;

/**
 * Slide-to-confirm in Blu's primary-button style. The thumb travels left → right;
 * its progress drives the amount's dissolve, so letting go early re-forms the amount.
 */
export function SwipeConfirm({ label, disabled, done, onProgress, onConfirm }: { label: string; disabled?: boolean; done?: boolean; onProgress: (p: number) => void; onConfirm: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(260);
  const x = useMotionValue(0);
  const p = useTransform(x, (v) => Math.min(1, Math.max(0, v / max)));
  const labelOpacity = useTransform(p, [0, 0.55], [1, 0]);
  // trail behind the thumb: starts under its centre and is invisible at rest, so nothing frames the thumb
  const fill = useTransform(x, (v) => PAD + THUMB / 2 + v);
  const fillOpacity = useTransform(p, [0, 0.04], [0, 1]);
  const fired = useRef(false);
  const viaKeyboard = useRef(false);

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
    navigator.vibrate?.([8, 40, 14]);
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
      {/* progress fill behind the thumb */}
      <motion.div className="absolute inset-y-0 left-0" style={{ width: fill, opacity: fillOpacity, background: 'rgba(16,24,34,.16)' }} />
      <motion.span
        className="shimmer pointer-events-none absolute inset-0 grid place-items-center pl-10 text-[16px] font-semibold"
        style={{ opacity: labelOpacity, color: disabled ? 'var(--text-3)' : 'var(--on-primary)' }}
      >
        {label}
      </motion.span>
      <motion.button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        className="absolute top-1 grid cursor-grab touch-none place-items-center rounded-[11px] outline-none active:cursor-grabbing"
        style={{ left: PAD, width: THUMB, height: THUMB, x, background: disabled ? 'var(--line)' : 'var(--on-primary)', color: disabled ? 'var(--text-3)' : 'var(--primary)' }}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={release}
        onTap={() => p.get() < 0.02 && nudge()}
      >
        <IconArrowRight size={22} strokeWidth={2} />
      </motion.button>
    </motion.div>
  );
}
