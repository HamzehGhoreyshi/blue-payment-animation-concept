import type { Transition, Variants } from 'motion/react';

/** Motion tokens. One place for every duration and curve. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // content settling
export const EASE_IOS = [0.32, 0.72, 0, 1] as const; // screen push
export const SPRING_UI: Transition = { type: 'spring', stiffness: 420, damping: 36 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 30 };

/** RTL push: forward screens come in from the left, the old one parallaxes right. */
export const push: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '-100%' : '28%', opacity: dir > 0 ? 1 : 0.6 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.5, ease: EASE_IOS } },
  exit: (dir: number) => ({ x: dir > 0 ? '28%' : '-100%', opacity: dir > 0 ? 0.6 : 1, transition: { duration: 0.5, ease: EASE_IOS } }),
};

/** Step content inside the flow: rise + un-blur in, sink + blur out (no plain fades). */
export const stagger = (i: number, base = 0.05) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, delay: base + i * 0.05, ease: EASE_OUT } },
  exit: { opacity: 0, y: 10, filter: 'blur(6px)', transition: { duration: 0.22, ease: 'easeIn' as const } },
});
