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
