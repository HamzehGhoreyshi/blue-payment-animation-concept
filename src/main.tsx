import '@fontsource-variable/vazirmatn';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ?demo gives a clean phone frame for recording (no footer).
if (new URLSearchParams(location.search).has('demo')) document.documentElement.classList.add('demo');

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
