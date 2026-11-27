import { useIsPresent } from 'motion/react';
import type { ReactNode } from 'react';

/** A screen that is animating out must not take taps meant for the screen coming in. */
export function InertWhenLeaving({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  return (
    <div className="h-full w-full" style={{ pointerEvents: present ? 'auto' : 'none' }} aria-hidden={!present || undefined} {...(!present ? { inert: '' } : {})}>
      {children}
    </div>
  );
}
