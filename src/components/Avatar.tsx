import { motion } from 'motion/react';
import { useId } from 'react';
import type { Recipient } from '../lib/data';
import { BluMark } from './Icons';

/** Illustrated person avatar with a bank badge, matching Blu's destination list. */
export function Avatar({ recipient, size = 44, layoutId, badge = true }: { recipient: Pick<Recipient, 'gender' | 'bank'>; size?: number; layoutId?: string; badge?: boolean }) {
  const id = useId();
  const blu = recipient.bank === 'blu';
  const [c1, c2] = blu ? ['#8DC0FA', '#4C8BDA'] : ['#D5DAE0', '#8E97A1'];
  const b = Math.round(size * 0.42);
  return (
    <motion.div layoutId={layoutId} className="relative shrink-0" style={{ width: size, height: size }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="rounded-full" style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 0 0 0.5px var(--ring)' }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
          <clipPath id={`c${id}`}><circle cx="24" cy="24" r="24" /></clipPath>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <path d="M8 50c1-9 7.5-13.5 16-13.5S39 41 40 50z" fill={`url(#g${id})`} opacity=".9" />
          {recipient.gender === 'f' ? (
            <>
              <path d="M12.5 26c0-9 4.5-15 11.5-15s11.5 6 11.5 15c0 4-1 7-2.6 9H15.1c-1.6-2-2.6-5-2.6-9z" fill={c2} />
              <ellipse cx="24" cy="23.5" rx="8" ry="9" fill={`url(#g${id})`} />
              <path d="M15.5 21c1.5-5 5-7.5 8.5-7.5 4 0 7.5 3 8.5 7.5-4.5-.5-9-2.5-11-5-1.5 2.5-3.5 4.3-6 5z" fill={c2} />
            </>
          ) : (
            <>
              <ellipse cx="24" cy="24" rx="8" ry="9.2" fill={`url(#g${id})`} />
              <path d="M15.6 22.5c-.4-6 3.4-9.8 8.4-9.8s8.8 3.8 8.4 9.8c-1.2-2.4-3-3.6-5.2-4-2.6 1.6-6.8 1.8-10 1.2-.8.8-1.3 1.7-1.6 2.8z" fill={c2} />
            </>
          )}
          <path d="M21.2 28.6c1.6 1 4 1 5.6 0" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
      {badge && (
        <span className="absolute -bottom-0.5 -left-0.5 grid place-items-center rounded-full" style={{ width: b, height: b, background: 'var(--bg)', padding: 2 }}>
          <BluMark size={b - 4} />
        </span>
      )}
    </motion.div>
  );
}
