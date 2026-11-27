import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Recipient } from '../lib/data';
import { Avatar } from './Avatar';
import { IconCheck } from './Icons';
import { RollingNumber } from './RollingNumber';

export type IslandState =
  | { kind: 'idle' }
  | { kind: 'auth' }
  | { kind: 'progress' }
  | { kind: 'success' }
  | { kind: 'error' }
  | { kind: 'notify'; recipient: Recipient; amount: number };

interface IslandApi {
  state: IslandState;
  set: (s: IslandState) => void;
}

const Ctx = createContext<IslandApi | null>(null);
export const useIsland = () => useContext(Ctx)!;

export function IslandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IslandState>({ kind: 'idle' });
  const set = useCallback((s: IslandState) => setState(s), []);
  const api = useMemo(() => ({ state, set }), [state, set]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.9 };

/**
 * The status capsule at the top of the screen. In the desktop phone frame it rests as
 * the camera pill; on a real phone it only appears while it has something to say.
 */
export function Island({ framed }: { framed: boolean }) {
  const { state } = useIsland();
  const k = state.kind;
  const size =
    k === 'idle'
      ? { width: 122, height: 35, borderRadius: 18 }
      : k === 'notify'
        ? { width: 366, height: 150, borderRadius: 45 } // concentric with the 56px screen corner, 11px in
        : { width: 86, height: 86, borderRadius: 30 };
  const hidden = k === 'idle' && !framed;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-50 flex justify-center" style={{ top: framed ? 11 : 'calc(env(safe-area-inset-top) + 8px)' }}>
      <motion.div
        id="island"
        role="status"
        aria-live="polite"
        className="relative overflow-hidden"
        style={{ background: '#05070A', boxShadow: k === 'idle' ? 'none' : '0 12px 40px rgba(0,0,0,.45)', maxWidth: 'calc(100vw - 20px)' }}
        initial={false}
        animate={{ ...size, opacity: hidden ? 0 : 1, scale: hidden ? 0.6 : 1 }}
        transition={SPRING}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={k}
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.7, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {k === 'auth' && <FaceScan />}
            {k === 'progress' && <Spinner />}
            {k === 'success' && <Result ok />}
            {k === 'error' && <Result ok={false} />}
            {k === 'notify' && <Notify recipient={state.recipient} amount={state.amount} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function FaceScan() {
  const corner = 'M4 14V9a5 5 0 0 1 5-5h5';
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" aria-label="تایید هویت">
      {[0, 90, 180, 270].map((r) => (
        <motion.path key={r} d={corner} transform={`rotate(${r} 24 24)`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: r / 900 }} />
      ))}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <path d="M18 19v2.5M30 19v2.5M24 20v6h-2" />
        <path d="M18.5 31c3 2.5 8 2.5 11 0" />
      </motion.g>
      <motion.line x1="9" x2="39" stroke="var(--primary)" strokeOpacity=".7" strokeWidth="1.4" animate={{ y1: [12, 36, 12], y2: [12, 36, 12] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  );
}

function Spinner() {
  return (
    <motion.svg width="42" height="42" viewBox="0 0 44 44" aria-label="در حال انجام" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(114,171,243,.18)" strokeWidth="3.5" />
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="34 200" />
    </motion.svg>
  );
}

function Result({ ok }: { ok: boolean }) {
  const color = ok ? 'var(--success)' : 'var(--danger)';
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label={ok ? 'انجام شد' : 'ناموفق'}>
      <motion.circle cx="24" cy="24" r="19" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }} style={{ originX: '50%', originY: '50%' }} />
      {ok ? (
        <motion.path d="M15.5 24.5l6 6L33 18.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }} />
      ) : (
        <motion.path d="M18 18l12 12M30 18L18 30" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.35 }} />
      )}
    </svg>
  );
}

function Notify({ recipient, amount }: { recipient: Recipient; amount: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 px-6 pt-7 text-center">
      <Avatar recipient={recipient} size={34} />
      <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>انتقال به {recipient.name}</div>
      <div className="flex items-center gap-1.5 text-[24px] font-bold text-white">
        <RollingNumber value={amount} delay={0.25} />
        <span className="text-[14px] font-medium" style={{ color: 'var(--text-2)' }}>ریال</span>
      </div>
      <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--success)' }}>
        <IconCheck size={14} /> انجام شد
      </div>
    </div>
  );
}
