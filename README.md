# Word Scavenger — Browser Rebuild

This is a browser-compatible rebuild of the recovered Word Scavenger HTML5 game. It keeps the original gameplay structure and rules as closely as practical while replacing Android-only APIs with browser functionality.

## Run it

1. Extract the ZIP file.
2. Open `index.html` in a modern browser.
3. Select **New Game** and drag across the letter tiles to form words.

If your browser restricts local files, run a simple local web server from this folder and open the local address it provides.

## Preserved from the original

- 5×5 letter grid
- Original weighted letter distribution from `loadcharset2()`
- Two-minute round timer
- Original bundled dictionary (350,634 entries)
- Original letter point values from `letters.js`
- Double-letter, triple-letter, double-word, and triple-word bonus tiles
- Replacement of tiles used to submit a valid word
- Blue background and original bonus-tile color family
- Original core loop: select a word, validate it, score it, and refill used tiles

## Browser compatibility changes

- Replaced Android and native database bridge calls with browser behavior.
- Uses pointer input for mouse and touch screens.
- Uses a `Set` for faster dictionary membership checks.
- Stops scoring when the timer reaches zero.
- Uses the current authoritative scoring and timer rules in `SCORING-RULES.md`: +2 seconds per accepted word, +2/+3 seconds for 2LS/3LS and +2/+3 seconds for 2WS/3WS, with no Word Amplifier time reward, subject to the existing per-word caps and a 180-second overall cap.
- Shows an animated time-bonus indicator and timer pulse after a valid word.
- Shows end-of-round words found, longest word, highest-scoring word, average points per word, and a comparison against the previous personal best.
- Shows the personal-best score and best-word details on the start screen.
- Shows a first-visit, skippable tutorial and a 3-2-1-GO countdown before the timer begins.
- Adds immediate `+points` feedback beside the score, animates the total score, and briefly highlights bonus tiles used by a successful word.
- Shows the time bonus immediately; invalid words get a brief, unobtrusive message that is not immediately overwritten.
- Adds a personal statistics page with average game score, most words in one round, longest word, highest-scoring word, recent completed games, and the existing most-used-words list.
- Saves best score, games played, total words found, word-use counts, personal-best word records, tutorial status, and the 20 most recent round summaries in browser local storage.
- Added a visible menu path for browser navigation.

## Scoring and storage

The score for the active round exists only in JavaScript memory while the game is running. When a valid word is submitted, its score is added to the current round total. At the end of the round, the result is saved in browser `localStorage` under the key `wordScavengerBrowserStats`.

Saved data includes the personal-best score, games played, lifetime words found, word-use counts, best longest word, best single-word score, most words in a round, accumulated score totals for average-game-score tracking, whether the first-visit tutorial was seen, and up to 20 recent round summaries (score, word stats, time bonus, duration, completion timestamp, and whether it set a new personal best). The current round score is not a global online leaderboard.

`localStorage` is specific to the browser profile and origin (for example, the file URL versus a hosted website). It generally survives closing and reopening the browser, but it can be cleared by browser data cleanup and does not automatically transfer between devices or hosting domains. It is suitable for personal progress in this prototype, not for secure competitive rankings. A future published version can keep local personal-best storage or add a server-backed system if online accounts/leaderboards become a requirement.

## Project files

- `index.html` — browser game UI
- `css/style.css` — responsive styling
- `js/game.js` — browser gameplay implementation
- `js/wordlist.js` — original bundled dictionary
- `original-source/` — selected original source files recovered from the APK, kept for comparison

## Notes

The original letter-point values are preserved exactly, including values that differ from standard Scrabble scoring. The browser rebuild JavaScript has been syntax-checked, HTML IDs and script paths were checked, and ZIP integrity was verified. Full interactive gameplay testing in a graphical browser remains to be done. The bundled dictionary was verified to contain 350,634 entries, including `SCAVENGER` and `CAT`. The timer-bonus, results-screen, start-screen personal-best, tutorial/countdown, and feedback updates are included. Full end-to-end gameplay testing in a graphical browser remains to be done.


## Phase A — Sequential tile-flip animation

- A valid word is scored and its existing time reward is applied once, before refill animation begins.
- Only the consumed tiles are replaced; unaffected tiles remain in place.
- Replacement flips begin 80 milliseconds apart. Each tile turns edge-on, reveals its new letter and bonus type, then returns to its normal position.
- New selections are blocked while the grid is refilling.
- If the round ends while tiles are flipping, the refill can finish safely behind the results overlay. Starting a new round cancels any prior refill timers before resetting the board.
- Word Amplifier and Chrono Combo are not included in Phase A.

Validation performed: JavaScript syntax check, required DOM-ID/script-path checks, and ZIP integrity check. Interactive browser testing is still required.


## Phase A interaction update — selectable stationary tiles

Replacement tiles now flip in a staggered sequence (55 ms between flip starts; 180 ms per flip). Only tiles consumed by an accepted word are locked, including while their bonus feedback/refill is pending. Other stationary tiles remain selectable during the animation. If another valid word is submitted during a refill, its consumed tiles are locked and their own refill animation runs without repeating score or time rewards.


## Phase 3.2 corrections

- Restored the complete Phase A selectable flip animation CSS and JS from `word_scavenger_phase_a_selectable.zip`. Tiles flip sequentially; currently flipping tiles are unselectable, while stationary tiles remain selectable.
- Word Amplifier: 3 letters ×1.0, 4 letters ×1.25, 5 letters ×1.5, 6 letters ×1.75, 7+ letters ×2.0. Timer rewards are additive: +0/+5/+10/+15/+20 seconds for 3/4/5/6/7+ letters.
- Chrono Combo: second valid word +100 score and +3 seconds to the combo countdown; third +300 score and +4 seconds to the combo countdown; fourth and subsequent +500 score and +5 seconds to the combo countdown. The main round timer is not increased by combo rewards.
- Each valid word refreshes the five-second combo window, then adds the earned combo seconds to that combo countdown.
- Existing files, original source, dictionary, and unrelated game behavior are retained.

## Chrono Combo timer correction

- The first valid word starts a 7-second combo countdown.
- A consecutive second word adds 3 seconds to the *remaining* combo countdown; the third adds 4 seconds; the fourth and later consecutive words add 5 seconds each.
- The combo countdown is capped at 20 seconds. It is not reset before adding a reward.
- If the combo expires, the next valid word starts a new 7-second window.
- Chrono Combo rewards never add time to the main round timer.


## Rebalancing — 2026-10-20

- Restored the main timer cap to 180 seconds; round start remains 120 seconds.
- Updated used-tile main timer rewards to 2LS +2s, 3LS +3s, 2WS +2s, and 3WS +3s.
- Added Word Amplifier time rewards of +0/+5/+10/+15/+20 seconds for 3/4/5/6/7+ letter words, additive to the base valid-word and used bonus-tile rewards.
- Set Chrono Combo to a 7-second initial countdown and 20-second cap.
- Set the fixed 500-entry bonus distribution to NO 350, 2LS 50, 3LS 40, 2WS 35, and 3WS 25.
- Increased stored charge caps to 10 Rotate and 5 Randomize. Randomize now consumes one stored charge per use and can recharge up to its cap after every five valid words.

## Progressive Web App (PWA) testing

This build includes `manifest.webmanifest`, `service-worker.js`, launcher icons in `icons/`, and `js/pwa-register.js` for installable standalone-mode testing and offline app-shell caching. See [`PWA-INSTALL.md`](PWA-INSTALL.md) for Samsung Android / Chrome installation steps. Serve the project from HTTPS; opening `index.html` directly from a file manager or ZIP does not support PWA installation. Keep using the same site origin to retain that origin's local-storage statistics.


## Authoritative scoring and timer rules

`SCORING-RULES.md` is the canonical specification for word scoring, Word Amplifier, Chrono Combo, main-timer rewards/caps, saved time-earned metrics, and long-word Bomb/Swap charge eligibility. The game and deterministic tests use the shared pure calculation module `js/scoring-rules.js`. Run `node tests/scoring-rules.test.js` from the project root to verify its deterministic calculations.


### Phase 1B power-charge milestone rule

Words of 6 or more letters do not count toward the Bomb or Swap regular milestones. Bomb can award an immediate charge at 6+ letters; Swap can award one at 7+ letters. Such words preserve regular milestone progress. See `SCORING-RULES.md`.


### Deterministic regression tests

From the project root, run:

- `node tests/scoring-rules.test.js` — scoring, timer rewards, combo transitions, charge thresholds, and source guards.
- `node tests/game-logic.test.js` — clockwise rotation and four-turn identity, tile-preserving swap, Bomb gravity/refill invariants, and round-summary arithmetic.

These tests validate pure logic and source-level invariants. They do not substitute for live browser testing of animations, pointer targeting, localStorage, or PWA installation/offline behavior.


### Chain Protect Round Power (Phase 3)

- Choose either Wild Letter or Chain Protect before the round; they are mutually exclusive. The None option is currently removed. Wild Letter choices already used in the current round are disabled and cannot be reused; availability resets when a new round starts.
- Chain Protect has one non-refillable charge. Activate it, then drag across any connected sequence of 2–5 tiles; it does not need to spell a valid word and setup does not score or consume tiles.
- Chain Protect is intended to protect a short tile sequence while waiting for letters such as S, ER, or ING to extend a word. The pre-round selector describes each power and shows its charge count.
- Chain Protect tiles retain their identities through Rotate and are individually protected from Randomize, Swap, and Bomb. Bombs still destroy unprotected tiles in the normal blast area. During the cascade, unchained tiles fall through available unchained positions while chained tiles stay fixed; new letters spawn only in top vacancies left after available tiles have moved.
- Chain Protect tiles used in a later valid word are consumed and replaced normally; the replacement tiles are not anchored.
- The middle power button reflects the selected Round Power (Wild Letter or Chain).

### Wild Letter touch and letter uniqueness (v0.2.3)

- The center Round Power button uses a wildcard star SVG for Wild Letter and the link icon for Chain Protect. Its label, icon, and charge count reflect the selected power.
- Letters successfully assigned to Wild Letter tiles cannot be selected again during that round, even if the tile is later consumed or destroyed. The available-letter set resets at the start of each new round.
- On touch devices, Wild Letter targeting requires a completed tap on the same tile with movement under 12 CSS pixels. A short activation guard prevents a button gesture from bleeding into tile targeting.
- Responsive styles center the middle power label and icon when the name wraps on narrow screens.


## v3.02 balancing updates
- Added a soft maximum of four copies of any ordinary letter on the projected board; Wild Letters do not count toward this cap.
- Removed Word Amplifier time rewards while preserving its score multipliers; main timer cap is 180 seconds.
- Expanded the pause-screen read-only Board & Marble Bag preview with board composition, remaining-bag counts, and per-entry probabilities.
