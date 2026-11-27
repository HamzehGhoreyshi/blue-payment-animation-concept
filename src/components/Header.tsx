import { AnimatePresence, motion } from 'motion/react';
import { IconHelp } from './Icons';

/** Navigation bar: title centred, help on the left. */
export function Header({ title, onHelp }: { title: string; onHelp: () => void }) {
  return (
    <div className="relative flex h-12 shrink-0 items-center justify-between px-3">
      <span className="w-10" />
      <div className="pointer-events-none absolute inset-x-16 grid place-items-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h1
            key={title}
            className="text-[15px] font-semibold"
            style={{ color: 'var(--text-2)' }}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>
      </div>
      <motion.button whileTap={{ scale: 0.88 }} aria-label="راهنما" onClick={onHelp} className="grid h-10 w-10 place-items-center rounded-full" style={{ color: 'var(--primary)' }}>
        <IconHelp size={26} />
      </motion.button>
    </div>
  );
}

/** Blu's primary button. */
export function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      animate={{ backgroundColor: disabled ? '#2c3340' : '#72abf3', color: disabled ? '#5f6b78' : '#15202c' }}
      transition={{ duration: 0.25 }}
      className="h-14 w-full rounded-[14px] text-[16px] font-semibold"
    >
      {children}
    </motion.button>
  );
}
