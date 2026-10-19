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
- Awards 2 seconds for each valid word, plus extra time for bonus tiles used: +1 second for 2× letter, +2 seconds for 3× letter or 2× word, and +3 seconds for 3× word.
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
- Word Amplifier: 3–4 letters ×1.0, 5–6 letters ×1.5, 7+ letters ×2.0.
- Chrono Combo: second valid word +100 score and +3 seconds to the combo countdown; third +300 score and +4 seconds to the combo countdown; fourth and subsequent +500 score and +5 seconds to the combo countdown. The main round timer is not increased by combo rewards.
- Each valid word refreshes the five-second combo window, then adds the earned combo seconds to that combo countdown.
- Existing files, original source, dictionary, and unrelated game behavior are retained.

## Chrono Combo timer correction

- The first valid word starts a 5-second combo countdown.
- A consecutive second word adds 3 seconds to the *remaining* combo countdown; the third adds 4 seconds; the fourth and later consecutive words add 5 seconds each.
- The combo countdown is capped at 10 seconds. It is not reset to 5 seconds before adding a reward.
- If the combo expires, the next valid word starts a new 5-second window.
- Chrono Combo rewards never add time to the main round timer.
