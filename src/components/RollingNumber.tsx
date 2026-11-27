import { motion, useReducedMotion } from 'motion/react';
import { money } from '../lib/format';

const DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * Odometer-style number: each digit is a vertical strip that rolls to its value
 * with a short motion blur, settling left → right (as in the reference video).
 */
export function RollingNumber({ value, from, className, delay = 0, duration = 1.1 }: { value: number; from?: number; className?: string; delay?: number; duration?: number }) {
  const reduce = useReducedMotion();
  const text = money(value);
  const start = from === undefined ? null : money(from).padStart(text.length, '۰');
  const chars = [...text];
  const digitCount = chars.filter((c) => DIGITS.includes(c)).length;
  let di = 0;
  return (
    <span dir="ltr" className={`inline-flex overflow-hidden leading-none tabular-nums ${className ?? ''}`} aria-label={text}>
      {chars.map((c, i) => {
        if (!DIGITS.includes(c)) return <span key={`s${chars.length - i}`} aria-hidden>{c}</span>;
        const idx = di++;
        const target = DIGITS.indexOf(c);
        const startDigit = start ? Math.max(0, DIGITS.indexOf(start[i] ?? '۰')) : 0;
        // extra full turns make the count-up feel alive; leading columns spin less
        const turns = reduce ? 0 : 1;
        const fromY = -startDigit;
        const toY = -(target + turns * 10);
        const d = delay + (idx / Math.max(1, digitCount)) * 0.35;
        return (
          <span key={`d${chars.length - i}`} className="relative inline-block h-[1em] overflow-hidden" aria-hidden style={{ width: '0.62em' }}>
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col items-center"
              initial={{ y: `${fromY}em`, filter: 'blur(0px)' }}
              animate={{ y: `${toY}em`, filter: reduce ? 'blur(0px)' : ['blur(0px)', 'blur(2.5px)', 'blur(0px)'] }}
              transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : d, ease: [0.22, 1, 0.36, 1] }}
            >
              {Array.from({ length: 20 + 10 }, (_, k) => (
                <span key={k} className="block h-[1em] leading-none">{DIGITS[k % 10]}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
