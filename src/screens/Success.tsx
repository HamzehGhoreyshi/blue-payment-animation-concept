import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/Header';
import { IconCopy, IconReceipt } from '../components/Icons';
import { RollingNumber } from '../components/RollingNumber';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { BANKS } from '../lib/data';
import { fa, money } from '../lib/format';
import { EASE_OUT } from '../lib/motion';
import { useStore } from '../store';
import { accountLine } from './Flow';

const rise = (d: number) => ({
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  transition: { duration: 0.6, delay: d, ease: EASE_OUT },
});

export function Success() {
  const s = useStore();
  const toast = useToast();
  const [details, setDetails] = useState(false);
  const rc = s.receipt!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rc.tracking);
    } catch {
      /* clipboard can be blocked; the toast still confirms the intent */
    }
    toast('شماره پیگیری کپی شد');
  };

  const title = 'انتقال با موفقیت انجام شد';

  return (
    <div className="flex h-full flex-col" style={{ paddingTop: 'calc(var(--safe-top) + 24px)' }}>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4">
        <div className="flex flex-col items-center pt-6 text-center">
          <SuccessBadge />
          <h1 className="mt-6 text-[19px] font-bold" aria-label={title}>
            {title.split(' ').map((w, i) => (
              <motion.span key={i} className="inline-block" initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ delay: 0.55 + i * 0.07, duration: 0.5, ease: EASE_OUT }}>
                {w}&nbsp;
              </motion.span>
            ))}
          </h1>
          <motion.div {...rise(0.8)} className="mt-4 flex items-center gap-2">
            <RollingNumber value={rc.amount} className="text-[34px] font-bold" delay={0.85} duration={1.3} />
            <span className="text-[18px] font-medium" style={{ color: 'var(--text-2)' }}>ریال</span>
          </motion.div>
        </div>

        <motion.div {...rise(1.05)} className="card mt-8 rounded-[16px] p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <Avatar recipient={rc.recipient} size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{rc.recipient.name}</div>
              <div dir="ltr" className="mt-0.5 text-right text-[12.5px] tracking-wide" style={{ color: 'var(--text-2)' }}>{accountLine(rc.recipient)}</div>
            </div>
          </div>
          <div className="hairline-top mt-4 flex items-center justify-between pt-3.5 text-[14px]">
            <span style={{ color: 'var(--text-2)' }}>شماره پیگیری</span>
            <button onClick={copy} className="link flex items-center gap-1.5 font-medium" aria-label={`کپی شماره پیگیری ${fa(rc.tracking)}`}>
              <span dir="ltr" className="tracking-wider">{fa(rc.tracking)}</span>
              <IconCopy size={17} style={{ color: 'var(--primary)' }} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--text-2)' }}>تاریخ و ساعت</span>
            <span className="font-medium">{rc.date} · {rc.time}</span>
          </div>
        </motion.div>

        <motion.p {...rise(1.2)} className="mt-4 text-center text-[12px] leading-5" style={{ color: 'var(--text-3)' }}>
          نمونه نمایشی است؛ وجهی واقعاً منتقل نشده است.
        </motion.p>
      </div>

      <motion.div {...rise(1.25)} className="space-y-2.5 px-4 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDetails(true)} className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-semibold" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
          <IconReceipt size={20} />
          جزئیات تراکنش
        </motion.button>
        <PrimaryButton onClick={s.finish}>بازگشت</PrimaryButton>
      </motion.div>

      <Sheet open={details} onClose={() => setDetails(false)} title="جزئیات تراکنش">
        <dl className="rows rounded-[14px] px-4 text-[14px]" style={{ background: 'var(--surface-2)' }}>
          {(
            [
              ['وضعیت', <span style={{ color: 'var(--success)' }}>موفق</span>],
              ['مبلغ', `${money(rc.amount)} ریال`],
              ['کارمزد', rc.fee ? `${money(rc.fee)} ریال` : 'رایگان'],
              ['گیرنده', rc.recipient.name],
              ['بانک مقصد', BANKS[rc.recipient.bank].name],
              ['مقصد', <span dir="ltr">{accountLine(rc.recipient)}</span>],
              ['انتقال از', rc.accountName],
              ['روش انتقال', rc.methodTitle],
              ['توضیحات', rc.note || '—'],
              ['تاریخ و ساعت', `${rc.date} · ${rc.time}`],
              ['شماره پیگیری', <span dir="ltr">{fa(rc.tracking)}</span>],
            ] as [string, React.ReactNode][]
          ).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt style={{ color: 'var(--text-2)' }}>{k}</dt>
              <dd className="truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <PrimaryButton onClick={copy}>کپی شماره پیگیری</PrimaryButton>
        </div>
      </Sheet>
    </div>
  );
}

/** Ring draws, check draws, a soft halo and a ring of dust settle around it. */
function SuccessBadge() {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2);
  return (
    <div className="relative grid h-[96px] w-[96px] place-items-center" aria-hidden>
      {!reduce && (
        <>
          <motion.span className="absolute inset-0 rounded-full" style={{ border: '1.5px solid var(--success)' }} initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.1, delay: 0.45, ease: 'easeOut' }} />
          {dots.map((a, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{ background: i % 3 ? 'var(--dust)' : 'var(--primary)', left: '50%', top: '50%', marginLeft: -2, marginTop: -2 }}
              initial={{ x: Math.cos(a) * 160, y: Math.sin(a) * 160 - 120, opacity: 0, scale: 0.6 }}
              animate={{ x: [Math.cos(a) * 160, Math.cos(a) * 52, Math.cos(a) * 64], y: [Math.sin(a) * 160 - 120, Math.sin(a) * 52, Math.sin(a) * 64], opacity: [0, 1, 0], scale: [0.6, 1, 0.4] }}
              transition={{ duration: 1.2, delay: i * 0.015, times: [0, 0.5, 1], ease: EASE_OUT }}
            />
          ))}
        </>
      )}
      <motion.div className="grid h-[88px] w-[88px] place-items-center rounded-full" style={{ background: 'rgba(95,211,154,.1)' }} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" stroke="var(--success)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <motion.circle cx="24" cy="24" r="20" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.65, 0, 0.35, 1] }} transform="rotate(-90 24 24)" />
          <motion.path d="M15 24.5l6.2 6.2L33.5 18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }} />
        </svg>
      </motion.div>
    </div>
  );
}
