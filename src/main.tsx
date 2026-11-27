import '@fontsource-variable/vazirmatn';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ?demo gives a clean phone frame for recording (no footer).
if (new URLSearchParams(location.search).has('demo')) document.documentElement.classList.add('demo');

// Footer theme switch: light ↔ dark, remembered, with a smooth colour cross-fade.
document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.classList.add('theme-anim');
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f4f7fb' : '#1b2028');
  setTimeout(() => root.classList.remove('theme-anim'), 400);
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
