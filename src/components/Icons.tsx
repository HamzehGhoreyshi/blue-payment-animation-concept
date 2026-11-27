import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 24, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const IconHelp = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9.2" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6" /><circle cx="12" cy="16.9" r=".4" fill="currentColor" /></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M4 12h16M14 6l6 6-6 6" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)} strokeWidth={2.2}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="M5 9l7 7 7-7" /></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
);
export const IconNote = (p: P) => (
  <svg {...base(p)}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
);
export const IconReceipt = (p: P) => (
  <svg {...base(p)}><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><circle cx="12" cy="16.5" r=".5" fill="currentColor" /></svg>
);

/** The «b» mark, drawn for this prototype (concept use). */
export const BluMark = ({ size = 24, bg = 'var(--primary)', fg = 'var(--bg)' }: { size?: number; bg?: string; fg?: string }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <circle cx="20" cy="20" r="20" fill={bg} />
    <path d="M14.2 11.5c0 4 .1 8 .1 12.4A6.2 6.2 0 1 0 20.6 17.6c-2.4 0-4.4 1.4-5.6 3.3" fill="none" stroke={fg} strokeWidth="3.6" strokeLinecap="round" />
    <circle cx="21.6" cy="10.6" r="2.1" fill={fg} />
  </svg>
);

/** Bare «b» glyph (no disc) for list rows like «بلو به بلو». */