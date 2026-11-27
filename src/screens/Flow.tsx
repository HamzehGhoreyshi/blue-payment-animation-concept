import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Header, PrimaryButton } from '../components/Header';
import { BluMark, IconAlert, IconCheck, IconChevronDown, IconNote } from '../components/Icons';
import { useIsland } from '../components/Island';
import { useParticles } from '../components/Particles';
import { Sheet } from '../components/Sheet';
import { SwipeConfirm } from '../components/SwipeConfirm';
import { METHOD, type Recipient } from '../lib/data';
import { fa, group4, money } from '../lib/format';
import { EASE_OUT, stagger } from '../lib/motion';
import { useStore } from '../store';

export const accountLine = (r: Recipient) => group4(r.number);

/** The review / confirm screen. Processing runs on this screen, then the result screen follows. */
export function Review() {
  const s = useStore();
  return (
    <div className="flex h-full flex-col" style={{ paddingTop: 'var(--safe-top)' }}>
      <Header title="تایید انتقال" onHelp={() => s.setHelpOpen(true)} />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ReviewStep />
      </div>
    </div>
  );
}

const Bottom = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 pt-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}>
    {children}
  </div>
);

function RecipientHead({ r, size }: { r: Recipient; size: number }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Avatar recipient={r} size={size} />
      <div>
        <div className="text-[17px] font-semibold">{r.name}</div>
        <div dir="ltr" className="mt-1 text-[13px] tracking-wide" style={{ color: 'var(--text-2)' }}>
          {accountLine(r)}
        </div>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="relative h-7 w-12 rounded-full transition-colors" style={{ background: checked ? 'var(--primary)' : 'var(--line-strong)' }}>
      <motion.span className="absolute top-0.5 h-6 w-6 rounded-full bg-white" animate={{ right: checked ? 22 : 2 }} transition={{ type: 'spring', stiffness: 600, damping: 34 }} />
    </button>
  );
}

type Phase = 'idle' | 'sending' | 'failed';

function ReviewStep() {
  const s = useStore();
  const engine = useParticles();
  const island = useIsland();
  const r = s.draft.recipient;
  const method = METHOD;
  const total = s.draft.amount + method.fee;
  const short = total > s.account.balance;
  const [phase, setPhase] = useState<Phase>('idle');
  const [sheet, setSheet] = useState<'account' | 'note' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [note, setNote] = useState(s.draft.note);
  const numRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const captured = useRef(false);

  useEffect(() => () => engine.clear(), [engine]);

  // Coming back from a finished transfer: drop the island receipt, like the reference video.
  useEffect(() => {
    const n = s.pendingNotice;
    if (!n) return;
    s.setPendingNotice(null);
    const t1 = setTimeout(() => island.set({ kind: 'notify', recipient: n.recipient, amount: n.amount }), 650);
    const t2 = setTimeout(() => island.set({ kind: 'idle' }), 3900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProgress = (p: number) => {
    if (phase === 'sending') return;
    if (p > 0 && !captured.current && numRef.current && unitRef.current) {
      engine.capture([numRef.current, unitRef.current]);
      captured.current = true;
    }
    if (captured.current) engine.setProgress(p);
    if (p === 0 && captured.current) {
      engine.clear();
      captured.current = false;
    }
  };

  const run = async () => {
    setPhase('sending');
    if (!captured.current && numRef.current && unitRef.current) {
      engine.capture([numRef.current, unitRef.current]);
      captured.current = true;
    }
    engine.dissolveAll();
    island.set({ kind: 'auth' });
    await wait(1100);
    island.set({ kind: 'progress' });
    const ok = await s.submit();
    if (ok) {
      island.set({ kind: 'success' });
      const el = document.getElementById('island');
      const host = engine.canvas?.getBoundingClientRect();
      if (el && host) {
        const b = el.getBoundingClientRect();
        const scale = host.width / (engine.canvas?.offsetWidth || host.width);
        // aim at where the island's centre will be once open (86 px tall), not where it is mid-spring
        engine.setTarget((b.left + b.width / 2 - host.left) / scale, (b.top - host.top) / scale + 43);
      }
      await engine.converge(); // let every grain land before the result screen
      await wait(120);
      s.showSuccess();
      await wait(500);
      island.set({ kind: 'idle' });
    } else {
      island.set({ kind: 'error' });
      await engine.reform();
      engine.clear();
      captured.current = false;
      setPhase('failed');
      setAttempt((a) => a + 1);
      await wait(900);
      island.set({ kind: 'idle' });
    }
  };

  const hide = phase === 'sending';
  const rows: [string, React.ReactNode][] = [
    ['روش انتقال', method.title],
    ['کارمزد', method.fee ? `${money(method.fee)} ریال` : 'رایگان'],
    ['زمان واریز', method.eta],
  ];
  if (method.fee) rows.push(['مجموع کسر از حساب', `${money(total)} ریال`]);

  return (
    <>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="px-4 pb-5 pt-1">
          <RecipientHead r={r} size={68} />
          <div className="mt-5 flex flex-col items-center">
            <motion.div layoutId="amount" className="flex items-baseline gap-2" transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              <span ref={numRef} dir="ltr" className="text-[32px] font-bold leading-tight">{money(s.draft.amount)}</span>
              <span ref={unitRef} className="text-[26px] font-bold leading-tight">ریال</span>
            </motion.div>
            <motion.div className="mt-2 text-[15px]" style={{ color: 'var(--text-2)' }} initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: hide ? 0 : 1, filter: hide ? 'blur(4px)' : 'blur(0px)' }} transition={{ duration: 0.45, delay: hide ? 0 : 0.1, ease: EASE_OUT }}>
              مبلغ انتقال
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {!hide && (
            <motion.div key="details" exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.35, ease: 'easeIn' as const } }}>
              <motion.div className="h-px" style={{ background: 'var(--line)' }} {...stagger(2)} />
              <div className="px-4 pb-5 pt-5">
                <motion.div {...stagger(3)} className="mb-3 text-[15px] font-semibold">انتقال از</motion.div>
                <motion.button {...stagger(4)} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} onClick={() => setSheet('account')} aria-haspopup="dialog" className="press flex w-full items-center gap-4 rounded-[14px] p-4 text-right" style={{ background: 'var(--surface-2)' }}>
                  <BluMark size={52} />
                  <span className="flex-1">
                    <span className="block text-[16px] font-semibold">{s.account.name}</span>
                    <span className="mt-1 block text-[13px]" style={{ color: short ? 'var(--danger)' : 'var(--text-2)' }}>
                      قابل برداشت: {money(s.account.balance)} ریال
                    </span>
                  </span>
                  <IconChevronDown size={24} style={{ color: 'var(--primary)' }} />
                </motion.button>
                {short && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[12.5px]" style={{ color: 'var(--danger)' }}>
                    موجودی این حساب برای این انتقال کافی نیست.
                  </motion.p>
                )}

                <motion.dl {...stagger(5)} className="rows mt-5 rounded-[14px] px-4" style={{ background: 'var(--surface)' }}>
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-[13px] text-[14px]" >
                      <dt style={{ color: 'var(--text-2)' }}>{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-[13px] text-[14px]" >
                    <dt style={{ color: 'var(--text-2)' }}>توضیحات</dt>
                    <dd>
                      <button onClick={() => setSheet('note')} className="link flex max-w-[180px] items-center gap-1.5 truncate font-medium" style={{ color: s.draft.note ? 'var(--text)' : 'var(--primary)' }}>
                        {!s.draft.note && <IconNote size={16} />}
                        <span className="truncate">{s.draft.note || 'افزودن'}</span>
                      </button>
                    </dd>
                  </div>
                </motion.dl>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* processing caption, words blur in one by one */}
        <AnimatePresence>
          {hide && (
            <motion.p key="sending" className="absolute inset-x-0 top-[58%] px-8 text-center text-[15px]" style={{ color: 'var(--text-2)' }} exit={{ opacity: 0, filter: 'blur(6px)' }}>
              {`در حال انتقال به ${r.name}`.split(' ').map((w, i) => (
                <motion.span key={i} className="inline-block" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.5 + i * 0.09, duration: 0.5, ease: EASE_OUT }}>
                  {w}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Bottom>
        <AnimatePresence>
          {phase === 'failed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3 flex items-start gap-2.5 rounded-xl p-3.5 text-[13px] leading-6" style={{ background: 'rgba(242,116,116,.1)' }} role="alert">
              <IconAlert size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />
              <span>
                <b className="block font-semibold" style={{ color: 'var(--danger)' }}>انتقال انجام نشد</b>
                <span style={{ color: 'var(--text-2)' }}>ارتباط با بانک برقرار نشد. مبلغی از حساب شما کسر نشده است؛ دوباره تلاش کنید.</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div {...stagger(6)}>
          <SwipeConfirm key={attempt} label={phase === 'failed' ? 'تلاش دوباره' : 'تایید و انتقال'} disabled={short} done={hide} onProgress={onProgress} onConfirm={run} />
        </motion.div>
      </Bottom>

      <Sheet open={sheet === 'account'} onClose={() => setSheet(null)} title="انتقال از">
        <div className="space-y-2.5">
          {s.accounts.map((a) => {
            const active = a.id === s.draft.accountId;
            return (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  s.patch({ accountId: a.id });
                  setTimeout(() => setSheet(null), 160);
                }}
                className="relative flex w-full items-center gap-3.5 rounded-[14px] p-3.5 text-right"
                style={{ background: 'var(--surface-2)' }}
                aria-pressed={active}
              >
                {active && <motion.span layoutId="acc-ring" className="absolute inset-0 rounded-[14px] border-[1.5px]" style={{ borderColor: 'var(--primary)' }} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <BluMark size={42} />
                <span className="flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold">{a.name}</span>
                    <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{a.caption}</span>
                  </span>
                  <span className="mt-1 block text-[12.5px]" style={{ color: 'var(--text-2)' }}>
                    قابل برداشت: {money(a.balance)} ریال
                  </span>
                </span>
                {active && <IconCheck size={20} style={{ color: 'var(--primary)' }} />}
              </motion.button>
            );
          })}
        </div>
      </Sheet>

      <Sheet open={sheet === 'note'} onClose={() => setSheet(null)} title="توضیحات انتقال">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 60))}
          rows={3}
          autoFocus
          placeholder="مثلاً: سهم شام"
          aria-label="توضیحات انتقال"
          className="field w-full resize-none rounded-xl p-3.5 text-[15px] outline-none placeholder:text-[color:var(--text-3)]"
          style={{ background: 'var(--surface-2)' }}
        />
        <div className="mb-4 mt-1 text-left text-[12px]" style={{ color: 'var(--text-3)' }}>{fa(note.length)}/{fa(60)}</div>
        <PrimaryButton
          onClick={() => {
            s.patch({ note: note.trim() });
            setSheet(null);
          }}
        >
          ثبت توضیحات
        </PrimaryButton>
      </Sheet>
    </>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
