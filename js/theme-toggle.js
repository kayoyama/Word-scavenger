/*
 * Word Scavenger theme switch.
 * Original style is the default. Style 2 preference is saved locally.
 * This only toggles a body class; it does not touch gameplay state.
 */
(() => {
  'use strict';

  const THEME_KEY = 'wordScavengerTheme';
  const STYLE2_CLASS = 'theme-style2';

  function applyTheme(useStyle2) {
    document.body.classList.toggle(STYLE2_CLASS, useStyle2);
    const button = document.getElementById('word-scavenger-theme-toggle');
    if (button) {
      button.textContent = useStyle2 ? 'Style 2: Electric Blue + Gold' : 'Style 1: Original';
      button.setAttribute('aria-pressed', String(useStyle2));
      button.setAttribute('aria-label', useStyle2
        ? 'Switch to original Word Scavenger theme'
        : 'Switch to Style 2 Electric Blue and Gold theme');
    }
    try {
      localStorage.setItem(THEME_KEY, useStyle2 ? 'style2' : 'original');
    } catch (_) {
      // The theme still works for the current page if storage is unavailable.
    }
  }

  function initializeThemeSwitch() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/style2.css';
    document.head.appendChild(link);

    const button = document.createElement('button');
    button.id = 'word-scavenger-theme-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      applyTheme(!document.body.classList.contains(STYLE2_CLASS));
    });
    document.body.appendChild(button);

    let savedTheme = 'original';
    try {
      savedTheme = localStorage.getItem(THEME_KEY) || 'original';
    } catch (_) {
      // Keep the original style when local storage is unavailable.
    }
    applyTheme(savedTheme === 'style2');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeSwitch, { once: true });
  } else {
    initializeThemeSwitch();
  }
})();
