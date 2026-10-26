# Word Scavenger — Samsung Android PWA testing

## Important
A Progressive Web App must be served from **HTTPS** (or `localhost` for local development). Opening `index.html` directly from a ZIP, file manager, or `file://` URL will not enable installation or the service worker. Acode's local preview may work for gameplay but often uses a local address that is not available to Chrome as an installable site.

## Recommended test procedure
1. Extract the updated ZIP on a computer.
2. Upload the extracted project folder to an HTTPS static host you control (for example, a private test deployment on GitHub Pages or another static host). Publish the folder contents so `index.html` is at the site root. Do not rename or move the asset folders.
3. On the Samsung phone, open the HTTPS URL in **Chrome**. Load the game once while online and wait for it to finish loading; this downloads the app shell and bundled dictionary for offline use.
4. In Chrome, open the three-dot menu and choose **Install app** or **Add to Home screen** (the wording depends on Chrome version). Confirm installation.
5. Launch **Word Scavenger** from the new home-screen icon. The `standalone` display setting opens it without the normal browser address bar when the browser/launcher supports it.
6. Test airplane mode by closing the app, enabling airplane mode, then reopening it. The game shell and bundled word list should load offline. Disable airplane mode afterward.

## Data and testing notes
- Existing game logic and local-storage key names were not changed by the PWA additions. Browser local storage is scoped to the site origin; installing the PWA from a different hostname or protocol creates a separate storage area. For testing, use the same HTTPS origin each time.
- The service worker caches the app shell, styles, scripts, bundled dictionary, manifest, and icons. New releases should bump `CACHE_NAME` in `service-worker.js` so clients receive a fresh cache.
- Service workers cannot reliably install from a raw ZIP or ordinary `file://` path. Use HTTPS for the real installation test.
- The service worker is intentionally limited to same-origin GET requests. It does not intercept or modify game state, scoring, powers, animations, themes, or statistics.

## Quick validation checklist
- [ ] Open the HTTPS site once online; no missing asset requests in Chrome DevTools / remote debugging.
- [ ] Chrome reports the manifest and icons without errors.
- [ ] Home-screen launch opens in standalone/full-screen-like mode.
- [ ] Start a round, use powers, switch themes, and confirm normal gameplay remains intact.
- [ ] Confirm saved statistics remain present when reopening from the same origin.
- [ ] Load once online, then verify it opens in airplane mode.
