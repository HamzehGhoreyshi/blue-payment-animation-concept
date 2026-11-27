import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Bottom sheet: slides up with a spring, drag down or tap the backdrop to close. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const drag = useDragControls();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  const host = document.getElementById('frame');
  const ui = (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[60]">
          <motion.button
            aria-label="بستن"
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: 'rgba(5,8,12,.45)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass-sheet absolute inset-x-0 bottom-0 rounded-t-[28px] px-5 pt-2"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => (i.offset.y > 90 || i.velocity.y > 500) && onClose()}
          >
            <div className="flex cursor-grab touch-none justify-center pb-3 pt-1" onPointerDown={(e) => drag.start(e)}>
              <span className="h-[5px] w-9 rounded-full" style={{ background: 'rgba(255,255,255,.22)' }} />
            </div>
            <h2 className="mb-5 text-center text-[17px] font-semibold">{title}</h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  return host ? createPortal(ui, host) : ui;
}
