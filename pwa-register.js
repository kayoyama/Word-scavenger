/* PWA enhancement only; does not touch gameplay or saved game data. */
(() => {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.warn('Word Scavenger offline support could not be enabled:', error);
      });
    });
  }
})();
