First read ~/Desktop/AI/ai-os/AGENTS.md

# AGENTS.md — blue-payment-animation-concept

## First
This project belongs to Hamzeh's AI OS.
Read `~/Desktop/AI/ai-os/AGENTS.md` and follow its session routine.
If you cannot reach that path, ask Hamzeh to also connect the `ai-os` folder.
Project summary lives in: `~/Desktop/AI/ai-os/10_context/projects/blue-payment-animation-concept.md`

## This project
- What it is: an animated, fully Persian (RTL) transfer-confirm prototype in Blu Bank's dark UI — only two screens: review + swipe-to-confirm (left → right), then success. «بازگشت» returns to review for another run. Motion is modelled on a reference video: swipe dissolves the amount into dust from the left, a status island does scan → spinner → check, digits roll with blur. Simulated only: no real banking calls.
- Tech stack: Vite + React 18 + TypeScript + Tailwind v4 + Motion (`motion/react`). Particles on one `<canvas>`. Font: Vazirmatn (bundled, OFL).
- How to run it: `npm install`, then `npm run dev -- --port 5191` (also in `.claude/launch.json` as `blue-payment`).
- How to deploy it: not deployed yet. If deployed: Vercel, after adding the portfolio link below.
- Files:
  - `src/store.tsx` — app state (view, draft, accounts, receipt) and the simulated `submit()`.
  - `src/lib/data.ts` — placeholder data: name «لورم ایپسوم», numbers in the 1234 pattern.
  - `src/lib/format.ts` — Persian digits, ٬ money format, Jalali date.
  - `src/lib/motion.ts` — motion tokens (easings, springs, RTL push, stagger).
  - `src/components/Particles.tsx` — text-to-dust engine; every particle position is a pure function of (dissolve, float, converge), so any phase reverses cleanly.
  - `src/components/Island.tsx`, `SwipeConfirm.tsx`, `RollingNumber.tsx`, `Sheet.tsx`, `Inert.tsx`.
  - `src/screens/Flow.tsx` (review screen), `Success.tsx`.
- Rules specific to this project:
  - All visible text Persian with Persian digits.
  - Hamzeh's rule (2026-11-27): no real-looking names — only «لورم ایپسوم»; all numbers use the 123412341234 pattern. No other Blu screens (copyright risk).
  - Leaving screens are wrapped in `InertWhenLeaving` so taps can't hit a screen that is animating out — keep that for any new screen.
  - Portfolio link (Hamzeh's own public projects, not client sites): the published page must show a visible link to `https://hamzeh.framer.ai/?utm_source=blue-payment-animation-concept&utm_medium=referral`. Check it is there before every deploy.
  - Blu name, «b» mark and look belong to Blu/Saman — concept use only.

## Session end (in addition to the AI OS routine)
- Commit (and push once a remote exists) this project's changes.
- Update the project page in ai-os/10_context/projects/blue-payment-animation-concept.md directly: state, decisions, next actions.
