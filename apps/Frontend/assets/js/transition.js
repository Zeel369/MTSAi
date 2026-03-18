/* ============================================================
   MTSAi Page Transitions — IBM Carbon Edition
   Lightweight fade transition between pages.
   ============================================================ */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const style = document.createElement('style');
  style.textContent = `
    body { opacity: 1; transition: opacity 180ms ease; }
    body.page-leaving { opacity: 0; }
  `;
  document.head.appendChild(style);

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = href; }, 200);
  });

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
  });
})();
