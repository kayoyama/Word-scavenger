/* Word Scavenger theme selection. Keeps the established theme key and body class. */
(() => {
  'use strict';
  const THEME_KEY = 'wordScavengerTheme';
  const STYLE2_CLASS = 'theme-style2';
  function applyTheme(useStyle2) {
    document.body.classList.toggle(STYLE2_CLASS, useStyle2);
    const classic = document.getElementById('theme-classic-choice');
    const style2 = document.getElementById('theme-style2-choice');
    if (classic) { classic.setAttribute('aria-pressed', String(!useStyle2)); classic.classList.toggle('selected-theme', !useStyle2); }
    if (style2) { style2.setAttribute('aria-pressed', String(useStyle2)); style2.classList.toggle('selected-theme', useStyle2); }
    try { localStorage.setItem(THEME_KEY, useStyle2 ? 'style2' : 'original'); } catch (_) {}
  }
  function initializeThemeSwitch() {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'css/style2.css'; document.head.appendChild(link);
    const classic = document.getElementById('theme-classic-choice');
    const style2 = document.getElementById('theme-style2-choice');
    if (classic) classic.addEventListener('click', () => applyTheme(false));
    if (style2) style2.addEventListener('click', () => applyTheme(true));
    let savedTheme = 'original';
    try { savedTheme = localStorage.getItem(THEME_KEY) || 'original'; } catch (_) {}
    applyTheme(savedTheme === 'style2');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeThemeSwitch, { once: true });
  else initializeThemeSwitch();
})();
