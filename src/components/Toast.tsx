import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const t = useRef<number>();
  const show = useCallback((text: string) => {
    clearTimeout(t.current);
    setMsg({ id: Date.now(), text });
    t.current = window.setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none absolute inset-x-0 z-[70] flex justify-center px-6" style={{ bottom: 'calc(var(--safe-bottom) + 96px)' }}>
        <AnimatePresence mode="popLayout">
          {msg && (
            <motion.div
              key={msg.id}
              role="status"
              className="rounded-full px-4 py-2.5 text-center text-[13px]"
              style={{ background: 'var(--toast-bg)', color: 'var(--toast-fg)', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
