## 2026-10-21 — HUD layout correction (follow-up)

### Changed
- Reordered gameplay UI to match the approved reference: Score and Time in the top bar; current word immediately below; compact reward feedback directly below the word panel; Chrono Combo in a reserved row immediately above the board.
- Moved score and time reward elements out of the top header into a fixed-height feedback row so reward text and animation cannot change header height.
- Moved the Chrono Combo indicator into its dedicated fixed-height slot instead of appending it inside the board stage, preventing it from affecting board layout.
- Simplified the current-word subline to a short acceptance message after a valid word; score, amplifier, combo and time details are presented in the separate reward row.
- Reduced excess vertical spacing and lowered the maximum board size on short mobile viewports to avoid unnecessary scrolling and vertical movement.
- Kept Style 1 Classic dark blue + gold and Style 2 Electric Blue + Gold. Combo active/expired feedback uses blue/gold/neutral colors rather than teal/red redesign colors.
- Preserved in-tile letter-value subscripts, bonus superscripts, user-supplied letter values and distribution, scoring, powers, statistics, and existing theme persistence.

### Validation
- Source syntax checks and automated tests must be run against this follow-up build.
- Browser visual and interaction verification is not claimed until exercised in Live Server.

# Word Scavenger — Project Changelog

**Coverage:** APK/source recovery through the Word Scavenger work documented on 20 October 2026.

This changelog records the development history that can be substantiated from the available project files and conversations. It distinguishes implementation reports from agreed specifications and work that still needs verification. A feature mentioned here is not automatically considered fully tested.

## 2026-10-20 — Rotate and Randomize controls

### Changes recorded for the Rotate/Randomize build
- Added a **Rotate** action for the 5×5 board, intended to rotate the board 90 degrees clockwise.
- Added a **Randomize** action.
- Reused the existing staggered tile-flip animation in batches of five rather than introducing a long, separate animation.
- The intended behavior is to move complete tile data, including each tile's letter, color, and bonus metadata, rather than changing only the displayed letters.
- The recorded ZIP name is `word_scavenger_browser_actions_rotate_randomize.zip`.
- Basic checks were reported for JavaScript syntax, the rotation mapping, and ZIP integrity. These checks do not establish that the full game was regression-tested.

### Follow-up requirements from the discussion
- Disable **Rotate** and **Randomize** while ordinary tile-refill animations lock the board.
- Disable both actions while the **Long Word Bonus** animation locks tiles.
- Stop the main game timer while the Rotate animation is running.
- Keep the animation short; the existing flip animation should be evaluated as a way to communicate clockwise rotation without adding a lengthy new animation.
- For Randomize, determine whether a sequence of three flips gives sufficient visual feedback instead of creating a separate animation.
- Verify that buttons become available again after all relevant animations finish.
- Verify that the visual animation actually reads as clockwise rotation, not merely a sequence of unrelated tile flips.
- Confirm that neither action causes duplicate scoring, timer rewards, tile refills, or other gameplay side effects.

### Status
The controls and animation approach were recorded as implemented in a build, but the follow-up locking and timer requirements were still open in the latest discussion. Do not mark the feature complete until the behavior has been tested in the current source.

## 2026-10-20 — Rules review and project-state reconciliation

- Reviewed the current browser game against the Classic Mode and added-power rules.
- Reaffirmed that the project is an enhancement of the existing game, not a redesign. Preserve the original gameplay, 5×5 grid, scoring, bonus tiles, dictionary validation, timer, and existing tile-flip animation unless a change is explicitly required.
- The reviewed source was reported to include Word Amplifier, Chrono Combo, Long Word Bonus-related behavior, game statistics/UI, achievements, selectable staggered tile flips, and theme support. Each item still needs to be verified in the exact release build.
- The reviewed JavaScript included constants indicating a 120-second round, 180-second cap, five-second Chrono Combo window, Word Amplifier minimum length of five, ×1.5 multiplier, and a higher ×2 tier beginning at seven letters. This does not match the earlier written agreement that only words of six or more letters receive ×1.5. Resolve the rules discrepancy before release.
- A source review also reported combo score bonuses of +100 / +300 / +500. These need to be checked against the final agreed rules and the current implementation.
- The latest action ZIP is recorded as the Rotate/Randomize baseline, but the exact contents of that ZIP have not been verified against every earlier project version.
- A previous full-project ZIP was referred to as `Word_Scavenger_Classic_Phase_3_2_Full_Project_Chrono_Combo_...`; the complete filename is not available in the current record.

## 2026-10-20 — Android setup using Acode

- The goal was to run the existing Word Scavenger HTML project on a Samsung Android device using Acode **without modifying the game code**.
- The user initially could not access the Experiments folder and could not find Acode's storage permission.
- The project was then imported through a ZIP, and the files appeared in Acode.
- The remaining issue reported was that the preview was not available / would not open.
- This is a development-environment setup issue, not a game-code change. The available record does not establish that preview was successfully fixed.
- Keep the Android troubleshooting steps separate from browser-source changes; do not alter game code merely to compensate for a file-access or preview configuration issue without first identifying the actual cause.

## 2026-10-19 — Classic Mode rules and powers specification

### Core Classic Mode requirements
- Preserve the 5×5 letter grid.
- Start each round with 120 seconds.
- Cap the timer at 180 seconds.
- Award +2 seconds for each valid word.
- Apply tile time rewards as follows:
  - `2LS`: +1 second
  - `3LS`: +2 seconds
  - `2WS`: +2 seconds
  - `3WS`: +3 seconds
- Preserve the existing custom A–Z letter values, weighted letter bags, score calculation, bonus tiles, dictionary validation, and replacement-letter generation.
- Keep score rewards and time rewards separate.
- Preserve existing controls, layout, statistics, end-of-game behavior, and local-storage records unless a change is specifically required.
- Do not add unrelated modes, progression systems, currencies, inventories, or upgrade-selection screens.

### Sequential tile-refill animation
The enhancement specification calls for restoring the original-style sequential tile flip when tiles used in a valid word are replaced.

- Score and accept the valid word exactly once before or during the refill process, using the existing scoring logic.
- Identify the consumed tiles and replace only those tiles.
- Animate replacement tiles individually in sequence, with approximately 80 milliseconds between successive tile animations.
- Use a recognizable brief flip, preferably a 3D horizontal-axis rotation or equivalent CSS transform.
- Reveal each replacement letter during its flip.
- Keep unaffected tiles stationary and preserve the grid dimensions and spacing.
- Lock selection/submission while the board is in an inconsistent animation state, then restore interaction when refill finishes.
- Prevent overlapping animation sequences from corrupting the grid.
- Handle timer expiration/game-over safely during a refill.
- Ensure animation callbacks cannot cause duplicate scoring, word acceptance, or timer rewards.

The later Rotate/Randomize work also relies on the existing flip animation. Test these animations together rather than assuming that separate features will always run independently.

### Word Amplifier — specification and discrepancy
The written Classic Mode enhancement specification says:

- Valid words with fewer than six letters receive no Word Amplifier bonus.
- Valid words with six or more letters receive a ×1.5 word-score multiplier.
- Apply the multiplier after the existing letter and word bonus calculations.
- Apply the amplifier once per word and provide visible feedback.
- Preserve original letter values and bonus-tile rules.

**Discrepancy to resolve:** the reviewed JavaScript uses a minimum length of five, a ×1.5 multiplier, and a ×2 multiplier for words of seven or more letters. The later changelog notes also described tiers of ×1.0 for 3–4 letters, ×1.5 for 5–6 letters, and ×2 for 7+ letters. These descriptions are not consistent with the original written specification. The final intended rule must be confirmed and then aligned across source, UI, and documentation.

### Chrono Combo — specification and discrepancy
The written specification describes a consecutive-word mechanic:

- The first valid word starts a five-second combo window.
- Subsequent qualifying valid words extend the combo timer by +3 / +4 / +5 seconds according to combo level, with the combo timer capped at 10 seconds.
- The mechanic must not award an extra five seconds to the main game timer.
- Reset the streak when the combo timer expires.
- Invalid words must not advance the combo.
- Keep word scoring, main timer rewards, and combo behavior separate.
- Update the score/timer/combo display correctly and ensure animation callbacks do not trigger rewards more than once.

The reviewed source was also reported to include combo score bonuses of +100 / +300 / +500. Confirm the intended relationship between those score bonuses and the time-extension rules before treating Chrono Combo as finalized.

### Feature interaction requirements
- A valid word must be validated and scored exactly once.
- The intended interaction order is: calculate base score using existing rules; apply Word Amplifier if eligible; evaluate Chrono Combo; update score/timer/UI; refill consumed tiles sequentially; unlock the grid after the animation completes.
- Rapid valid words must not corrupt word order, score, timer, combo level, or board state.
- Invalid words must not earn valid-word score or time/combo rewards.
- No new score, timer, or combo events should occur after game-over.
- Preserve existing local-storage records and statistics.

## 2026-10-19 — Browser rebuild from recovered APK source

### Source recovery
- Recovered the Word Scavenger HTML/CSS/JavaScript assets from the supplied APK, including the dictionary and original source/assets structure.
- Recorded recovered-source backup: `word_scavenger_recovered_source.zip`.
- The recovered Android version included an Android database bridge; the browser version needed browser-compatible handling.
- Preserve the recovered source as an archive so browser-specific changes do not destroy the original reference.

### Browser project
- Created `word_scavenger_browser.zip` as the browser project.
- Rebuilt the browser game around the 5×5 grid, weighted letters, original letter values, four letter/word bonus types, dictionary validation, and a two-minute timer.
- Added browser pointer input and browser-side game statistics.
- Improved dictionary lookup using a set-based lookup in the browser rebuild.
- Preserved the recovered original source in an `original-source/` folder within the browser ZIP.
- Added `README-UPDATE.txt`.
- Added the alternate theme stylesheet `css/style2.css` and theme toggle script `js/theme-toggle.js`.

### Browser rebuild items identified for checking
- Verify that the original statistics tabs and their behavior are preserved accurately.
- Verify refill animation and input locking.
- An initial review identified a missing `js/letters.js` reference. Check the current project to determine whether it remains an issue or has since been fixed.
- Verify all script and DOM references; ensure there are no undefined variables or missing elements.
- Verify the browser project works without Android-only APIs or database-bridge dependencies.

## 2026-10-19 to 2026-10-20 — UI/theme refinements

- Added **Style 2** as an alternate stylesheet/theme so the user can compare it with the original style and switch back if preferred.
- The user requested that the `3× letter` tile color be changed because it was too similar to the selected-letter color.
- The user also asked whether any other colors were too similar. Review other bonus/selection colors for clear distinction and contrast.
- Preserve both themes and ensure theme switching does not change gameplay logic, tile metadata, scoring, or bonus behavior.
- The current record establishes the requested color change and theme-switching approach, but does not independently confirm that every color adjustment was implemented and visually approved.

## 2026-10-19 — Project documentation and version handling

- A separate document, `Word Scavenger — Complete Powers, Scoring & Time Rules`, was requested to consolidate Classic Mode rules with Word Amplifier and Chrono Combo.
- The project should maintain one canonical `Word Scavenger changelog.md` rather than a new changelog for each ZIP.
- Keep a known-good original APK and recovered-source ZIP as archival backups.
- For everyday work, use the latest verified full browser project ZIP as the baseline.
- Do not assume that a ZIP is the newest complete version merely because it has a later-sounding filename; compare its contents with the last known working build.
- The changelog should be updated whenever a change is implemented, a requirement is changed, a bug is found/fixed, or a test result changes.

## Testing and release checklist

The following are required regression checks; the available history does not prove that all have passed.

### Core gameplay
- [ ] Game opens and starts normally in the browser.
- [ ] 5×5 board, weighted letter generation, custom A–Z values, and bonus-tile distribution are preserved.
- [ ] Valid words score correctly and invalid words are rejected.
- [ ] A word is accepted and scored only once.
- [ ] Consumed tiles are replaced; unaffected tiles remain unchanged.
- [ ] Sequential flip animation reveals replacement letters correctly.
- [ ] Grid input locks during refill and unlocks afterward.
- [ ] Timer begins at 120 seconds, stops at zero, and cannot exceed 180 seconds.
- [ ] Valid-word and bonus-tile time rewards are correct.
- [ ] Game-over during an animation does not trigger additional rewards or corrupt the board.

### Powers and animations
- [ ] Word Amplifier threshold and multiplier match the final approved rule.
- [ ] Word Amplifier applies after existing tile/word bonuses and only once per word.
- [ ] Chrono Combo starts, advances, caps, and expires as specified.
- [ ] Combo score bonuses, if retained, match the approved rules.
- [ ] Long Word Bonus behavior and tile locking are correct.
- [ ] Rotate maps all tiles 90 degrees clockwise and preserves each tile's full metadata.
- [ ] Rotate animation looks clockwise and remains short.
- [ ] Main timer pauses during Rotate animation.
- [ ] Rotate and Randomize are disabled during normal refill and Long Word Bonus animation locks.
- [ ] Randomize has a clear, short animation and does not damage tile data or game state.
- [ ] All buttons recover correctly after animation completion.

### UI, storage, and compatibility
- [ ] Original theme and Style 2 both render correctly and can be switched.
- [ ] `3× letter` is visually distinct from selected tiles and other bonus tiles.
- [ ] Statistics, achievements, end-of-game summary, and personal-best behavior are correct.
- [ ] Local-storage records continue to work.
- [ ] No missing script files, undefined variables, null DOM references, or console errors remain.
- [ ] Acode preview works on the target Android device without modifying game code, if Android-browser use is still required.

## Version and verification notes

Known filenames in the available record:
- `word_scavenger_recovered_source.zip` — recovered source archive.
- `word_scavenger_browser.zip` — browser rebuild archive.
- `word_scavenger_browser_actions_rotate_randomize.zip` — recorded Rotate/Randomize build.
- `Word_Scavenger_Classic_Phase_3_2_Full_Project_Chrono_Combo_...` — an earlier full-project ZIP, but the full filename is unavailable in the current record.
- `Word Scavenger changelog.md` — canonical changelog filename.

The history available for this update includes the changelog source, a Classic Mode enhancement specification, a browser JavaScript source excerpt, and conversation summaries for 19–20 October 2026. It does **not** provide a complete transcript of every project chat or the complete contents of every ZIP. Therefore this is a consolidated changelog of all changes and requirements supported by the available record, not a claim that every historical edit has been independently verified.

**Release rule:** Do not label the project fully tested until the checklist above has been run against the exact ZIP intended for release.

## 2026-10-21 — Phase 1A scoring, timer, and charge correctness

### Added
- Added `SCORING-RULES.md` as the authoritative specification for base letter/word scoring, Word Amplifier, Chrono Combo, main-timer rewards and caps, saved time-earned metrics, and long-word Bomb/Swap charge conditions.
- Added shared pure calculation functions in `js/scoring-rules.js` and deterministic tests in `tests/scoring-rules.test.js`.

### Changed
- Routed in-game word scoring, time-award calculations, and Chrono Combo transitions through the shared scoring rules module.
- Corrected Bomb charge eligibility to accept words of 6 or more letters and Swap charge eligibility to accept words of 7 or more letters, rather than exact-length words only.
- Added the scoring rules module to the PWA app shell and bumped the service-worker cache version so updated clients can fetch it.
- Updated the README's outdated bonus-time summary to point to the authoritative specification.

### Verification
- Deterministic tests cover letter and word bonus arithmetic, Word Amplifier multipliers and rounding, additive time awards, per-word and overall caps, combo progression and expiry, long-word charge thresholds, and the single accepted-word reward call path.
- JavaScript syntax and ZIP integrity checks passed for the updated package.
- Browser interaction, live localStorage round persistence, and PWA offline startup remain unverified; source and deterministic tests do not establish those behaviors.


## 2026-10-21 — Phase 1B power and animation lifecycle

### Changed
- Centralized power-animation locking through a shared guard that prevents power activation during power animations, tile refills, and Long Word Bonus tile transformations. Rotate and Randomize remain disabled while relevant tile locks are active.
- Hardened Bomb and Swap activation with lock checks and target/index validation; power animations now consistently set and release the shared busy state. Stale scheduled callbacks remain invalidated by the refill token.
- Restricted main-timer and Chrono Combo timer pausing to the actual 400 ms Rotate animation. Randomize, Bomb, and Swap do not pause either timer. Rotate resumes each timer only if it was running before the animation.
- Changed Bomb/Swap charge progress: any accepted word of 6 or more letters is excluded from both the 10-word Bomb and 15-word Swap milestones. Bomb still awards an immediate charge at 6+ letters; Swap awards one at 7+ letters. These long words preserve existing short-word milestone progress rather than advancing or resetting it.
- Updated power hints and the authoritative scoring rules to explain the milestone exclusion.
- Cancelling an in-flight refill/action sequence now clears the shared busy state; leaving gameplay cancels armed powers and pending animation callbacks.

### Verification
- Added deterministic charge-progress tests covering 6-letter words, 7+ letter words, preserved milestone progress, milestone completion, and charge caps.
- Added source guards for shared power-lock enforcement, Rotate-only timer pausing, and stale callback token checks.
- JavaScript syntax, deterministic tests, manifest/app-shell reference checks, and ZIP integrity are required before packaging.
- Interactive browser animation, timer behavior under real browser scheduling, and PWA install/offline behavior remain unverified unless separately tested.


## 2026-10-21 — Phase 1C board powers and Phase 1D round records

### Added
- Added `js/game-logic.js` with pure board transformations and round-summary calculations, plus deterministic tests in `tests/game-logic.test.js`.
- Added round-summary persistence for average points per valid word, with zero-word rounds safely reporting zero.

### Changed
- Routed Rotate, Swap, and Bomb board transformations through shared pure helpers to make tile identity and metadata preservation testable.
- Rotate continues to map the 5×5 board clockwise; the center maps to itself.
- Bomb gravity/refill now uses a pure transformation that explicitly preserves every unaffected position and moves tile objects intact into the target block.
- Ending a round now cancels armed powers and pending refill/action callbacks, clears power-move transforms, and prevents stale animation frames from applying after cancellation.
- Round Complete now derives average points per word from the same normalized round summary stored in Recent Games. The metric includes combo score and is zero for rounds with no accepted words.
- Added the new logic module to the PWA app shell and bumped the cache version.

### Verification
- Deterministic tests passed for four clockwise rotations restoring the exact original tile objects/metadata, center-tile identity, Swap affecting exactly two positions, Bomb corner and middle targets, gravity/refill, unaffected-tile identity, and round-summary/score-breakdown arithmetic.
- The existing scoring and charge tests passed. JavaScript syntax and archive integrity checks are included in the release validation.
- Live browser animation, pointer-level Bomb preview, visual confirmation that unaffected tiles do not flip, actual localStorage persistence across screens, and PWA install/offline behavior remain unverified unless separately tested.


## 2026-10-21 — Swap regression fix

### Fixed
- Fixed Swap throwing a `ReferenceError` during the swap animation because it referenced undefined `first` and `second` identifiers. The animation now tracks the two tile objects at `firstIndex` and `secondIndex`, preventing the exception that could leave the board action lock enabled.

### Verification
- Added a source regression guard for the Swap animation tile references.
- Automated JavaScript syntax and deterministic test suites pass; live browser interaction still needs confirmation.

## 2026-10-21 — UI/HUD refinement pass

### Changed
- Added each tile's existing letter-point value as a small subscript and displayed the tile's bonus type (`2L`, `3L`, `2W`, or `3W`) as a superscript badge.
- Removed the separate bonus-tile legend; bonus identity is now shown directly on the relevant tiles.
- Reworked the theme control from a floating fixed-position toggle into a Settings / Appearance screen with explicit Classic and Style 2 choices. The existing `wordScavengerTheme` local-storage key and `theme-style2` body class are retained.
- Added ready/locked visual states to power controls based on the existing charge, round, and board-lock conditions.
- Added responsive styling for tile annotations, HUD feedback areas, power controls, and theme choices while retaining the two existing stylesheet palettes.

### Verification
- JavaScript syntax checks passed for `js/game.js` and `js/theme-toggle.js`.
- Existing scoring-rule tests passed.
- Existing game-logic tests passed, including rotation, randomize metadata, swap, bomb gravity/refill, round summary, persistence guards, and game-over cancellation guards.
- Browser-level visual inspection, touch interaction, theme persistence across reloads, and the complete end-to-end UI regression checklist have not been verified in a real browser in this run.


## 2026-10-21 — UI/HUD refinement and letter table update

### Changed
- Updated the gameplay layout to reserve stable areas for the header, current word, Chrono Combo indicator, board, and power controls; placed power controls beneath the board to match the approved reference composition.
- Refined Classic and Style 2 tile styling to use dark-blue/electric-blue surfaces with gold accents while preserving separate bonus-tile identities.
- Improved tile annotation styling: letter values remain subscripts and bonus labels (`2L`, `3L`, `2W`, `3W`) remain superscripts inside the tile. The separate bonus legend is hidden/removed from the gameplay presentation.
- Refined responsive HUD and power-control layouts for narrow screens and short landscape viewports.
- Kept theme selection in Settings / Appearance and retained the `wordScavengerTheme` persistence key.

### Letter values and distribution
- Replaced the letter-point array and weighted letter bag with the user-provided A–Z table.
- Letter-point values now read: A16, B34, C32, D23, E14, F42, G21, H41, I16, J81, K52, L22, M32, N19, O18, P34, Q102, R19, S12, T19, U16, V45, W42, X82, Y42, Z101.
- Distribution counts now read: A19, B5, C8, D8, E31, F5, G10, H7, I16, J1, K2, L10, M8, N17, O19, P5, Q2, R17, S13, T20, U11, V4, W5, X1, Y5, Z1 (250 total entries).

### Verification
- JavaScript syntax checks passed for `js/game.js` and `js/theme-toggle.js`.
- Existing scoring-rule tests passed.
- Existing game-logic and source-guard tests passed, including rotation, randomize metadata, swap, bomb gravity/refill, round summary, persistence, game-over cancellation, and Play Again guards.
- ZIP integrity check is required after packaging. Actual browser rendering and interaction remain unverified in this update.

## 2026-10-21 — HUD placement, pause control, and reward feedback

### Changed
- Repositioned the gameplay HUD so the timer is on the left, a pause control is centered, and the score is on the right.
- Moved the game-menu action into the pause dialog so the primary HUD row stays focused on timer, pause, and score.
- Positioned time-bonus feedback next to the timer and score-gain feedback next to the score.
- Increased score-reward explanation visibility to approximately 2.8 seconds and time-bonus visibility to approximately 1.9 seconds.
- Removed the empty reward-row height so it no longer creates unnecessary vertical spacing.
- Refined the Style 2 colors toward Electric Blue + Gold, reducing teal/cyan dominance while retaining the Classic dark-blue-and-gold theme.

### Added
- Added a pause dialog with Resume and Main Menu actions.
- Pausing stops the main round timer and pauses the Chrono Combo deadline; resuming restores the remaining combo time.

### Verification
- JavaScript syntax and existing deterministic tests are run for this package. Real-device/browser layout and pause interaction still require manual verification.


## 2026-10-21 — Palette and HUD feedback correction

- Restored Style 1 to the original teal background with warm default tiles and distinct blue, red, pale-blue, and purple bonus tiles.
- Restored Style 2 to the electric-blue background with pale neutral default tiles and gold, cyan, coral, and purple bonus tiles.
- Kept the timer on the left, pause button centered, and score on the right.
- Kept time-bonus feedback adjacent to the timer and score/word/combo feedback adjacent to the score.
- Removed the extra combo time (`+Ns`) from the score explanation; time awards remain visible beside the timer.
- Extended score explanation animation and cleanup to approximately 3.8–4 seconds.
- Automated checks are recorded separately from browser verification; the revised visual palette still requires browser review.

## 2026-10-21 — HUD alignment and power-target feedback

### Changed
- Centered the TIME and SCORE labels and values within their respective HUD regions while keeping the pause control in the true center column.
- Improved Style 2 tile-value subscripts with a dark, high-contrast color on pale tiles; selected tiles retain a white value for contrast.
- Added a single-tile hover/target highlight while Randomize or Swap is armed, matching the visual language of Bomb's target preview.
- Increased Bomb's target-intersection tolerance and ensured its action button keeps a larger minimum tap height on narrow layouts.

### Verification
- JavaScript syntax check passed for `js/game.js` and `js/game-logic.js`.
- Existing scoring-rules and game-logic test suites passed.
- Browser visual verification has not been performed in this run; confirm both themes, HUD centering, pointer/touch targeting, and Bomb selection in Live Server before release.


## v3.07.6 — 2026-10-30 — Tile gloss and flip artifact follow-up

### Changed
- Reshaped the glossy tile highlight to follow an octagonal cap rather than an oval that clashes with the tile silhouette.
- Added WebKit backface-visibility declarations and adjusted the flip's edge-on midpoint from 90° to 89° to reduce intermittent black compositing flashes while retaining the existing flip duration and sequence.

### Verification
- JavaScript syntax and automated tests are to be run against this package. Browser visual verification remains outstanding.

## v3.07.8 — 2026-10-30 — Local vowel balancing

### Added
- Added local 3×3 vowel balancing across the top-left, top-right, center, bottom-left, and bottom-right blocks of the 5×5 board. Each block normally contains 2–6 vowels inclusive.
- Added bounded candidate retries and per-draw relaxation when overlapping constraints cannot be satisfied.
- Added deterministic tests for block definitions, center overlap, initial board generation, retry fallback and bag accounting, and Randomize candidate filtering.

### Changed
- Initial tile generation and ordinary word refills now validate the affected local blocks in addition to existing whole-board safeguards.
- Randomize avoids candidate letters that violate the local constraint when a valid candidate exists.
- Bumped the PWA cache to v14 so clients can load the updated balancing logic.

### Preserved
- Existing global vowel target (8–12), uncommon-consonant target (2–5), letter distribution, consonant balancing, repeated-letter soft cap, independent bag accounting, and bonus safeguards.
- Rotate and Swap do not rebalance the board. Bomb's generated refill tiles bypass the local constraint to preserve its power-specific behavior. Wild Letter retains its special handling.

### Verification
- JavaScript syntax checks passed.
- All six Node test suites passed.
- Browser visual and Android gameplay testing remain outstanding.
- Initial board generation now retries the whole board up to 12 times if the completed board violates any local block; each retry resets all Marble Bag state, and the bounded final attempt prevents an infinite startup loop.
