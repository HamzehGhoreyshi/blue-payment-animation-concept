import '@fontsource-variable/vazirmatn';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ?demo gives a clean phone frame for recording (no footer).
if (new URLSearchParams(location.search).has('demo')) document.documentElement.classList.add('demo');

// Day/night switch at the top: night = dark theme, day = light theme. Remembered.
import './theme-toggle.css';
const dn = document.querySelector<HTMLButtonElement>('.dn.toggle');
const syncSwitch = () => {
  const night = document.documentElement.dataset.theme !== 'light';
  dn?.setAttribute('aria-checked', String(night));
  dn?.setAttribute('aria-label', night ? 'Dark mode' : 'Light mode');
};
syncSwitch();
// enable the switch's transitions only after the first paint
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('dn-preload')));
dn?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.classList.add('theme-anim');
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  syncSwitch();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f4f7fb' : '#1b2028');
  setTimeout(() => root.classList.remove('theme-anim'), 400);
  // squash-and-stretch on the knob while it travels (from the original toggle)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dn.querySelector('.knob')?.animate(
      [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.14, .88)', offset: 0.25 },
        { transform: 'scale(.94, 1.06)', offset: 0.55 },
        { transform: 'scale(1.02, .98)', offset: 0.75 },
        { transform: 'scale(1, 1)' },
      ],
      { duration: 800, easing: 'ease-out' },
    );
  }
});

// Live GitHub star count in the footer.
fetch('https://api.github.com/repos/HamzehGhoreyshi/blue-payment-animation-concept')
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    const el = document.querySelector('.star-count');
    if (el && d && typeof d.stargazers_count === 'number') el.textContent = String(d.stargazers_count);
  })
  .catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
