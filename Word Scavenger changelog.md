## [3.08.5] - 2026-10-31

### Added
- Restored the original “Most recent draw decision” panel inside the existing Original Marble Bags Summary in the Pause Menu.
- Displayed the last letter and bonus draw details, including their category/source fields and explanations of the actual draw paths.

### Changed
- Started from v3.08.4 Initial Draw Visuals and added only the missing last-draw decision container and its original rendering logic.
- Kept the existing consolidated diagnostics and all other v3.08.4 behavior unchanged.
- Bumped the PWA cache to v20.

### Verification
- JavaScript syntax checks and all six existing Node test files passed.
- Confirmed no iframe or standalone preview references were added.
- ZIP integrity verified. Live browser visual verification remains outstanding.

## [3.08.4] - 2026-10-31

### Changed
- Restored the actual 3×3 letter snapshots for all five Initial Board Generation stages above the existing stage-level diagnostic metrics.
- Highlighted tiles drawn during the current stage; tiles already present from earlier overlapping stages remain visually distinct.
- Preserved each stage's vowel count, natural/forced draw totals, rejected candidates, attempt count, and validation result beneath its board snapshot.

### Verification
- JavaScript syntax checks and all six existing Node test files passed.
- ZIP integrity verified. Live browser visual verification remains outstanding.

## [3.08.3] - 2026-10-31

### Fixed
- Corrected the Pause Menu integration so all three Marble Bag diagnostic sections are present in the visible diagnostics panel: Initial Board Generation, Recent Local Balance, and the original Marble Bags Summary.
- Added the missing DOM containers required by the existing initial-generation and latest-refill summary renderer.
- Kept Recent Local Balance as one aggregate summary of the latest complete refill batch; each refilled tile is counted once while affected overlapping regions are counted distinctly.

### Changed
- Reorganized the diagnostics into three permanently visible sections within the single Pause Menu panel.
- Clarified the original bag inspector heading as section 3 and retained its existing board inventory, effective probabilities, bag counts, and remaining-entry details.
- Bumped the PWA cache from v17 to v18 so installed clients receive the corrected Pause Menu markup and styles.

### Verification
- JavaScript syntax checks passed for all project scripts.
- All six existing Node test files passed.
- Static markup checks confirmed all three section containers and the existing renderer targets are present.
- ZIP integrity verified. Live browser visual verification remains outstanding.

## [v3.08.1] - 2026-10-30

### Changed
- Added direct access to Marble Preview & Draw Stories inside the Pause Game menu.
- Embedded the three-tab diagnostic experience in the paused game instead of requiring a separate page.
- Initial Draw Story and Recent Local Balance Story now show an actual 3×3 region visualization when recorded board snapshots are available.
- Newly drawn tiles, protected/shared tiles, and unchanged tiles have distinct visual treatments.
- Added board snapshots and drawn/protected position metadata to generation and balancing diagnostic events.

### Fixed
- Opening the diagnostic panel refreshes its read-only snapshot without consuming or changing Marble Bag entries.
- Closing the diagnostic panel and resuming or leaving the game correctly hides the embedded panel.

## v3.07.5 — 2026-10-30 — Hitbox tuning and octagonal tile refinement

### Changed
- Set the trajectory hitbox adjustment to a configurable `-0.07` ratio (−7% per side), keeping the visible tile size and grid layout unchanged.
- Removed the experimental hitbox slider, hitbox toggle, and diagnostic overlay. No hitbox overlay is shown on pause or during gameplay.
- Refined both themes to use a more square-like, symmetrical octagon with moderately clipped corners and a subtle inset edge treatment for a more connected tile surface.
- Bumped the PWA cache version so installed clients can fetch the updated JavaScript and styles.
- Deferred the proposed local 3×3 vowel-balancing rule to a separate phase; it is not included in this build.

### Verification
- `node --check js/game.js` and `node --check js/game-logic.js` — passed.
- `node --test tests/*.test.js` — all six test suites passed.
- ZIP integrity checked after packaging. Browser visual review and physical Android touch testing have not been performed.

---

## v3.07 — 2026-10-26 — Trajectory-aware touch selection

### Changed
- Added bounded trajectory-aware tile resolution for ordinary word dragging. Pointer movement is sampled along the path and resolves against cached tile rectangles, including a narrow tolerance around tile boundaries and gaps.
- Candidate tiles must continue the current eight-neighbor path or be an already-selected tile, preserving connected selection and deliberate backtracking while avoiding distant jumps.
- Cached tile rectangles by their current board index so rotation and DOM node reordering cannot mismatch geometry with tile identity.
- Kept the visual pointer trace, word validation, scoring, powers, animation locks, and tile rendering unchanged. Bumped the PWA cache version so installed clients can fetch the updated logic.

### Verification
- Added deterministic regression checks for initial targeting, narrow-gap resolution, rejecting distant jumps, diagonal neighbors, and backtracking.
- `node --check js/game.js` and `node --check js/game-logic.js` — passed.
- `node --test tests/*.test.js` — all six test suites passed.
- Browser visual/interaction and real Android thumb-drag testing have not been performed; those remain necessary to tune corridor sensitivity on-device.

---

## v3.06 — 2026-10-26 — Prevent Wild Letter picker gesture bleed-through

### Fixed
- Prevented the completed board-tile tap from accidentally choosing a letter in the Wild Letter picker on touch devices. A letter choice is now accepted only after a fresh pointer-down on an enabled letter button in the picker.
- Preserved the existing Wild Letter targeting safeguards: the power activation gesture cannot select a tile, targeting requires a completed tap on the same tile within the 12 CSS-pixel movement threshold and after the 450 ms activation guard, and the gesture cannot fall through into ordinary word selection.
- Kept the main timer and Chrono Combo running while the player chooses a target tile. Both timers pause only when the letter picker opens and resume afterward only if they were running before it opened.

### Verification
- `node --check js/game.js` — passed.
- `node --test tests/*.test.js` — all six test suites passed, including the new source regression guard.
- Source-level regression coverage verifies that a fresh picker pointer-down is required before accepting a letter choice.
- Browser/mobile touch verification remains outstanding; automated source tests do not prove the issue is resolved on every device.

---

## v3.05 — 2026-10-26 — Restore board letter selection

### Fixed
- Fixed a regression introduced by the board event guard: board tiles are `<button>` elements, so rejecting every event whose target was inside a button prevented all tile pointer-down events from reaching ordinary word selection and tile-targeting powers.
- Updated the guard to reject modal events and form controls, and reject buttons only when they are outside the board. Board tile buttons are allowed through to the existing selection/power logic.
- Added a source regression test to prevent reintroducing a blanket button guard.
- Bumped the PWA service-worker cache version so installed clients can fetch the corrected JavaScript.

### Verification
- Automated JavaScript syntax checks and all six project test suites passed.
- ZIP integrity and archive layout checked. Browser interaction and Android touch testing remain necessary; automated source tests do not replace them.

---

## v0.2.3 — 2026-10-23 — Round Power mobile UX and Wild Letter uniqueness

### Changed
- Replaced the Wild Letter button's plain `W` with an inline wildcard-star SVG. The center button now switches between the wildcard symbol and the link icon for Chain Protect.
- Renamed the user-facing Round Power from **Chain** to **Chain Protect** in the selection screen, center button, instructions, and feedback messages; internal identifiers remain stable.
- Centered the Round Power icon, wrapped label, and charge count on narrow mobile layouts in both Classic and Style 2.
- Updated the Wild Letter picker to visibly disable letters already assigned during the current round.

### Fixed
- Prevented a Wild Letter activation gesture from immediately selecting a board tile. Tile targeting now requires a completed tap on the same tile, movement of no more than 12 CSS pixels, and a brief activation guard. The existing target hover animation is preserved.
- Enforced per-round Wild Letter letter uniqueness in both the picker and tile transformation logic. A letter is reserved only after successful Wild Letter creation, remains unavailable if that tile is later consumed or destroyed, and becomes available again in the next round. Cancelling the picker does not spend a charge or reserve a letter.

### Verification
- JavaScript syntax check passed.
- Existing game-logic, scoring/timer, Chain Protect, and Wild Letter UI regression suites passed.
- Added source-level regression checks for the Wild Letter icon, Chain Protect naming, disabled duplicate letters, round reset, touch movement threshold, same-tile release, and mobile centering styles.
- Automated/source-level checks only; visual browser and Android device testing were not performed.

---

## v0.2.2 — 2026-10-22 — Chain usability and Bomb gravity refinement

### Changed
- Replaced the center Chain power's letter-A marker with a chain-link SVG icon.
- Expanded the pre-round Round Power selector with concise descriptions and charge counts for Wild Letter and Chain.
- Set a five-tile maximum for Chain. Its description now explains protecting a connected tile sequence while waiting for suffixes or other letters (for example, S, ER, or ING) to extend a word.

### Fixed
- Enforced the five-tile Chain limit during selection; selecting more than five connected tiles is rejected without consuming a charge.
- Corrected Bomb gravity around Chain tiles: chained tiles stay fixed, while unchained tiles in affected columns cascade down through available unchained positions. New letters are generated only for topmost unchained vacancies left after existing unchained tiles have moved.

### Verification
- JavaScript syntax checks passed.
- Game-logic tests cover tile identity, fixed Chain tiles, cascading unchained tiles past fixed Chain positions, and top-vacancy refill behavior.
- Chain UI source tests cover the link icon, power descriptions, charge counts, and five-tile cap.
- Automated/source-level checks only; visual browser and Android testing were not performed.

---

## v0.2.1 — 2026-10-22 — Chain naming and Bomb protection correction

### Changed
- Renamed the user-facing **Anchor Word** Round Power to **Chain** in the pre-round selector, center power button, instructions, status messages, and project README. The internal option ID remains stable to avoid unnecessary persistence/logic changes.
- Chain accepts any connected selection of at least two tiles; it no longer checks the dictionary or requires the selected letters to spell a valid word. Setup does not score or consume the selected tiles.

### Fixed
- Corrected Bomb protection to apply to individual chained tiles only. Unprotected tiles in the normal 2×2 blast still explode even when a chained tile is beside, above, below, or inside the blast.
- Updated the Bomb cascade to keep chained tiles fixed in place while unprotected tiles in the affected two columns fall/refill normally within the spaces between protected tiles. Unaffected board columns and rows below the cascade remain unchanged.
- Excluded protected chain tiles from explosion animation and bonus promotion; their tile data and bonus metadata remain untouched.

### Verification
- JavaScript syntax checks passed.
- Game-logic tests passed, including tests for unprotected blast tiles around chained tiles, fixed protected positions, refills, and protected bonus metadata.
- Scoring, Wild Letter UI, and Chain source regression tests passed.
- ZIP integrity verified after packaging. Automated/source-level checks only; visual browser and Android testing were not performed.

---

## v0.2.0 — 2026-10-22 — Phase 3: Anchor Word Round Power

### Added
- Implemented **Anchor Word** as the second mutually exclusive Round Power, with one charge per round and no refill.
- The player activates Anchor Word, then drags across a connected valid word. The selected tiles become an anchored chain without scoring or consuming those tiles during setup.
- Anchored tiles receive a clear gold outline/glow and keep their tile data and relative arrangement through Rotate.
- Anchored tiles cannot be changed by Randomize or moved by Swap. Bomb activation is blocked when its target/cascade would destroy or displace any anchored tile.
- Anchored tiles used in a later valid word are consumed and replaced normally, which removes their anchor status; remaining anchored tiles stay protected.
- Reused the center Round Power action button for the currently selected power: it displays Wild Letter or Anchor Word, its corresponding symbol, charge count, and context-sensitive instructions.
- Removed the **None** Round Power option for now. Wild Letter is the default selection; choosing Wild Letter or Anchor Word remains mutually exclusive for the round.
- Added the same power-target hover animation to tile targeting after activating Wild Letter, and added targeted source checks for Anchor Word.

### Changed
- The center power button now reflects the selected Round Power while keeping all five power buttons in one row: Rotate, Randomize, selected Round Power, Bomb, Swap.
- Anchor Word requires a valid connected word path and spends its charge only when the anchored chain is successfully created. Cancelling the mode or submitting an invalid path does not spend the charge.

### Fixed
- Prevented bomb cascades from shifting anchored tiles by rejecting bomb targets whose affected two columns include an anchored tile in the target area or above it.
- Prevented long-word bonus assignment from choosing anchored tiles as transformation candidates.

### Verification
- JavaScript syntax check passed.
- Existing game-logic, scoring, round persistence, and Wild Letter UI regression tests passed.
- Added and passed Anchor Word source checks for selection option removal, one-charge setup, tile anchoring, Randomize/Swap/Bomb protection, and theme styles.
- Automated/source-level checks only; visual browser testing and Android device testing were not performed.

---

## v0.1.2 — 2026-10-22 — Wild Letter theme and power-row follow-up

### Fixed
- Corrected the Classic-theme Wild Letter background to use the normal light-brown tile fill (`#ff9d78`) instead of white. Style 2 remains white.
- Kept a clear outer glow while using theme-appropriate outline colors: warm gold in Classic and gold in Style 2.
- Reordered the five power buttons so Wild Letter is centered as the super power: Rotate, Randomize, Wild Letter, Bomb, Swap. All five remain in the same responsive row.

### Verification
- Updated the Wild Letter UI source checks for the theme-specific default fills and centered button order.
- Automated syntax and regression checks were run for this package. Browser visual testing and Android device testing were not performed.

---

## v0.1.1 — 2026-10-22 — Wild Letter UI fixes

### Fixed
- Corrected the live tile-update renderer so Wild Letters display a subscript value of exactly `1`, matching initial board rendering.
- Isolated Wild Letter scoring from inherited letter and word bonus metadata: each Wild Letter contributes exactly one base point, while the other tiles' applicable word-level multipliers and word-level scoring rules remain in effect.
- Restored the default tile background for Wild Letters: light brown in Classic and white in Style 2. Added a distinct outer glow/outline without using the previous magenta-violet-cyan tile gradient.
- Placed Rotate, Randomize, Bomb, Swap, and Wild Letter in a five-column single-row layout, with compact responsive sizing for narrow mobile viewports.

### Verification
- Added a scoring regression test for a Wild Letter carrying simulated inherited bonus metadata.
- Added source-level checks for both Wild Letter render paths, score isolation, both theme overrides, and the five-button layout.
- JavaScript syntax checks and the existing regression suites were run for this release candidate. Browser visual testing and Android device testing were not performed.

---

## 2026-10-22 — Wild Letter selection flow, rotation animation, and visual emphasis

### Changed
- Repositioned the Wild Letter Round Power button as a centered fifth action beneath the four standard board actions, balancing the control layout in both themes.
- Changed Wild Letter activation order: activate the power, select the tile to transform, then choose its letter. Cancelling the letter picker returns to tile selection without spending a charge.
- Updated Wild Letter styling to a high-contrast magenta, violet, and cyan gradient with a bright outline and glow so it stands out from normal and bonus tiles.

### Fixed
- Cleared any lingering tile-flip animation classes before Rotate starts, so Wild Letter tiles use the same board-rotation animation as other tiles instead of appearing to flip.
- Cleared the selected tile highlight and target state when cancelling Wild Letter mode.

### Verification
- JavaScript syntax checks and the existing game-logic/scoring regression tests were run for this change.
- Browser and Android visual verification remains pending.

---

## 2026-10-22 — Bomb release targeting validation

### Fixed
- Preserved single-press/touch, release-to-explode Bomb interaction while capturing the intended 2×2 target at pointer-down.
- Added a forgiving but bounded target-acquisition tolerance so touches slightly off the intersection can still select the intended target.
- During a drag, the captured target changes only when the pointer enters a valid target neighborhood; a stale preview can no longer independently trigger an explosion.
- Validated pointer release against the captured target and board bounds. Releasing too far away, releasing outside the board, or cancelling the pointer gesture does not consume a Bomb charge.
- Kept the existing per-position bonus promotion and falling-animation tracking fix intact.

### Verification
- Added source-level regression checks for target capture, bounded release validation, drag target updates, stale-preview rejection, and pointer cancellation.
- Automated syntax and test results are recorded with the release candidate; actual mouse/touch visual verification remains separate and must be performed in a browser.

# Word Scavenger — Project Changelog

## 2026-10-22 — HUD, tile-value contrast, and Bomb landing-color correction

### Changed
- Applied high-contrast point-value labels across both Style 1 and Style 2, including dark bonus tiles and selected tiles.
- Corrected the HUD grid so the TIME and SCORE labels are centered over their own sections while the timer value stays left-aligned, score value stays right-aligned, and pause remains centered.
- Made Randomize and Swap explicitly clear and apply the single-tile target highlight during pointer movement and immediately on pointer-down.
- Changed Bomb color propagation so each of the four landing positions retains its own corresponding exploded tile's bonus/color instead of spreading one winning bonus through both columns.
- New tiles entering from above are generated with no inherited bonus; unaffected tiles retain their own bonus metadata.

### Verification status
- JavaScript syntax checks, game-logic tests, and scoring-rule regression tests passed. ZIP integrity will be checked after packaging. Real-browser visual and touch verification has not been performed.

---

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


## 2026-10-22 — HUD, power targeting, and Bomb color propagation

### Changed
- Improved Style 2 tile-value contrast with a backing treatment and contrasting values on dark/selected bonus tiles.
- Centered TIME and SCORE labels within their HUD blocks while preserving the centered pause control.
- Strengthened the single-tile hover/target highlight used by Randomize and Swap.
- Increased Bomb control touch target size and changed Bomb activation to use the release position/highlighted target.
- Bomb now selects the strongest bonus color in the targeted 2×2 block (`3WS` > `2WS` > `3LS` > `2LS` > no bonus) and propagates that bonus to the four landing cells during gravity.

### Verification
- Automated syntax, existing game-logic tests, scoring tests, and ZIP integrity are to be run for this candidate.
- Real-browser visual and touch-device verification has not been performed in this build step.


## 2026-10-22 — Annotation and Bomb cascade feedback

- Removed background pills behind tile point values and bonus superscripts; contrast is now handled through text color and text shadow in both themes.
- Aligned the TIME label left and SCORE label right, and increased both label sizes slightly while preserving the centered pause control.
- Updated Bomb refill generation so newly created tiles draw both letters and bonus colors from the existing weighted bags.
- For each falling tile that enters an exploded position, compare its own bonus against the bonus of that specific exploded tile and retain the higher-priority bonus for that landing tile only. No whole-column color propagation is used.
- Browser visual/touch verification remains required for final confirmation.


## 2026-10-22 — Bomb cascade storyboard and ZIP layout

- Corrected Bomb gravity so existing tiles in the two affected columns shift down by two rows, preserving their letters and bonus metadata while moving.
- Only newly created tiles entering at the top are drawn from the existing random letter and bonus distributions.
- Each of the four landing tiles in the exploded 2×2 area independently compares its bonus with the bonus of the exploded tile at that exact destination; stronger bonus metadata is applied locally, never across a whole column.
- Kept the existing position-based falling animation path for moved tile objects so the board animates rather than simply replacing the visible result.
- Repackaged the project with project files at the ZIP root instead of nesting them under `ws_fix/`.
- Automated source and archive checks are required; real-browser animation verification remains outstanding until run in Live Server.


## 2026-10-22 — Bomb cascade boundary correction

- Limited the Bomb gravity cascade to the two columns and rows above the exploded 2×2 area.
- Tiles below the explosion now retain their exact positions, letters, bonus metadata, and colors.
- Existing tiles above the explosion shift down two rows; only newly exposed top positions receive fresh random tiles.
- Per-landing bonus comparison remains limited to the four exploded destinations.
- ZIP packaging keeps project files at the archive root, without an extra wrapper directory.
- Browser animation verification remains outstanding.


## 2026-10-22 — Bomb top-row replacement bonus comparison

- Fixed the top-edge Bomb scenario: when no original tiles can fall into the exploded positions, newly generated replacement tiles now compare their random bonus against the corresponding exploded tile.
- The replacement tile keeps its randomly generated letter; only its bonus/color is promoted when the exploded tile has the higher-priority bonus.
- The comparison remains independent for each of the four exploded destinations.
- Existing tiles below the explosion remain unchanged.
- Browser visual verification of the color transition remains outstanding.

## 2026-10-22 — Bomb promoted-tile animation correction

### Fixed
- Preserved animation tracking when a tile's bonus is promoted during Bomb resolution. Previously, bonus promotion created a new tile object while the movement/new-tile animation sets still referenced the old object, which could cause that tile to appear at its destination without falling.
- Promoted tiles now remain included in the falling animation whether they originated above the explosion or were newly generated at the top edge.
- Added a background/text color transition from the incoming bonus to the winning bonus while the tile falls, without changing the randomly generated replacement letter.

### Verification
- `node --check js/game.js` — passed.
- `node --check js/game-logic.js` — passed.
- `node --test tests/game-logic.test.js tests/scoring-rules.test.js` — passed.
- ZIP integrity and archive-root layout are checked during packaging.
- Actual browser animation/color-transition verification remains outstanding; automated checks do not prove the visual effect.
- Preserved the captured source position for promoted falling tiles so their motion starts from the tile's actual pre-explosion location rather than from above the board.

## 2026-10-22 — Bomb cascade movement-plan correction

### Fixed
- Replaced Bomb animation's reliance on tile-object reference sets with a destination-indexed movement plan that records each destination's original source position, or marks a newly generated tile entering from above.
- Captured pre-explosion tile rectangles by board index and animated Bomb destinations from their recorded source positions. Newly generated tiles animate from above the board.
- Bonus promotion now mutates only the incoming tile's bonus metadata, preserving the same tile object and its letter. The movement plan remains stable through bonus resolution.
- Extracted per-destination bonus resolution into shared game logic so promoted existing tiles and promoted top-edge replacement tiles can be tested directly. Color transitions are keyed by destination index and run during the fall.
- Kept the four landing comparisons independent and preserved all unaffected tiles, including tiles below the explosion.

### Verification
- `node --check js/game.js` — passed.
- `node --check js/game-logic.js` — passed.
- `node --test tests/game-logic.test.js tests/scoring-rules.test.js` — passed, including movement-plan and promoted-tile identity/letter regression tests.
- ZIP integrity and archive-root layout checked after packaging.
- Actual browser animation/color-transition verification remains outstanding; automated tests do not prove visual smoothness.


## 2026-10-22 — Rotate and Bomb visual refinement

### Changed
- Made **Rotate** unlimited-use. It no longer consumes or earns charges and does not award score or time; the control displays an infinity symbol. Existing timer pausing during the rotation animation is preserved.
- Added a bomb icon that follows the pointer while aiming, while retaining the existing 2×2 target preview and release validation.
- Added a brief localized blast/ring effect before the existing Bomb explosion and falling cascade. The effect is styled in both themes and respects reduced-motion preferences.
- Delayed the Rotate board-state handoff slightly beyond the CSS animation duration so the final rotation frame can paint before the matrix is committed and transforms are cleared, targeting the reported end-of-animation blink.

### Preserved
- Existing Classic Mode scoring, time rewards, weighted letter/bonus generation, Randomize and Swap rules, both themes, Bomb target validation, per-position bonus resolution, movement plan, and unchanged tiles below the explosion.
- No fifth power was added; current powers remain the focus until their behavior is verified.

### Verification
- Automated syntax and existing regression tests are recorded separately from browser visual testing. The Rotate blink and new Bomb visuals require Live Server/browser verification before release.

## 2026-10-22 — Rotate color handoff and Bomb blast clarity

### Fixed
- Changed Rotate's completion handoff to reorder the existing tile DOM nodes into their clockwise destination order instead of rewriting each cell's contents. This keeps each tile's existing letter, bonus classes, and color attached to the same element through the final frame, addressing the reported blink when source and destination bonus colors differ.
- Added a tested clockwise destination-to-source index helper and refreshed each moved tile's board index and accessible row/column label after rotation.

### Changed
- Strengthened the localized Bomb effect into a brighter radial/starburst flash with an expanding ring and eight short sparks. The existing 2×2 targeting, explosion clearing, bonus resolution, and falling cascade remain unchanged.
- Aligned the blast and cleared-tile animation window to 260 ms so the blast reads clearly before the cascade begins.
- Applied the visual effect consistently to both themes and retained reduced-motion support.

### Verification
- `node --check js/game.js` — passed.
- `node --check js/game-logic.js` — passed.
- `node --test tests/game-logic.test.js tests/scoring-rules.test.js` — passed, including clockwise source-index mapping and source guards for the Rotate handoff and Bomb sparks.
- Browser visual verification remains outstanding. Automated tests do not prove that the Rotate blink is gone or that the explosion looks correct in Live Server.

## 2026-10-22 — Round Power pre-round selection (Phase 1)

### Added
- Added a pre-round **Round Power** selection dialog with **None**, **Wild Letter**, and **Anchor Word** options, leaving room for additional powers in the future.
- Added a selected-state treatment and accessible radio-style semantics for the options.
- Stored the selected option in round-selection state and attached it to the active game screen as round configuration for later power implementations. Routed New Game / Play Again through the selection step. The first-time tutorial now leads to power selection before gameplay.

### Changed
- The selected power is a configuration choice only in this phase. Wild Letter and Anchor Word gameplay effects, charges, and tile interactions are not implemented yet.
- Cancel returns to the main menu without starting a round. Existing gameplay is otherwise unchanged.

### Verification
- `node --check js/game.js` and `node --check js/game-logic.js` — passed.
- `node --test tests/game-logic.test.js tests/scoring-rules.test.js` — passed after updating the Play Again source guard to expect the new pre-round selection flow.
- Browser/device visual verification of selection, cancellation, tutorial flow, and Play Again remains outstanding.


## [Unreleased] - 2026-10-22

### Added
- Implemented the Wild Letter Round Power: three non-refillable charges per round, letter choice on activation, then player-selected tile transformation.
- Wild Letter tiles persist with unique IDs, display the chosen letter at a fixed value of 1, have a neutral distinct appearance, and can coexist on the board.
- Wild Letter tiles move with Rotate, are excluded from Randomize and Swap, and can be destroyed by Bomb.
- Added an A–Z selection dialog with cancellation before placement; choosing a letter alone does not spend a charge.

### Changed
- Word scoring now treats Wild Letter tiles as exactly 1 letter point and prevents ordinary letter-bonus multipliers from applying to them. Existing word-level scoring remains in effect.
- Bomb landing-bonus resolution preserves Wild Letter identity and its no-bonus status when a Wild Letter falls into an affected landing cell.

### Fixed
- Prevented Randomize and Swap from altering or moving Wild Letter tiles.

### Performance / Refactoring
- Reused the existing board rendering, tile-flip feedback, and round-power selection architecture for Wild Letter instead of introducing a separate board system.

## v3.01 — 2026-10-25 — Wild Letter gesture isolation

### Fixed
- Strengthened Wild Letter activation protection with a 450 ms guard to prevent the power-activation gesture from bleeding into tile targeting.
- Wild Letter placement now captures the pointer and opens the letter picker only after a completed `pointerup` on the same tile, with no movement beyond the existing 12 px threshold.
- Preserved cancellation behavior, charge handling, unique-per-round letter rules, scoring, and existing tile interactions.

### Verification
- JavaScript syntax check passed for `js/game.js`.
- Automated test suites passed for Wild Letter UI/mobile targeting, scoring rules, board logic, Anchor Word, and Marble Bag behavior.
- Interactive browser and Android touch verification remains necessary to confirm the reported issue is resolved on-device.


## v3.02 — 2026-10-25 — Marble Bag balance, timer tuning, and pause preview

### Changed
- Added a soft cap of four copies per ordinary letter on the projected 25-tile board. Eligible remaining entries are preferred; a fallback draw prevents generation from stalling when no eligible letter remains. Wild Letter tiles are excluded from the copy count.
- Removed Word Amplifier additional main-timer rewards while preserving the existing length-based score multipliers.
- Restored the main timer maximum to 180 seconds; the starting timer remains 120 seconds. Ordinary valid-word and bonus-tile time rewards remain.
- Expanded the pause-screen Marble Bag inspector into a read-only Board & Marble Bag preview with board composition, remaining entries, replenishment counts, and probabilities calculated from each bag’s remaining entries.

### Verification
- Updated scoring-rule tests for the reduced time rewards and 180-second cap.
- Added a Marble Bag regression test for the ordinary-letter soft cap.
- Automated test, syntax, and ZIP checks are recorded with the v3.02 package. Browser visual and gameplay testing remain required.


## v3.03 — 2026-10-26 — Wild Letter timer, Play Again, effective draw odds, and timer rewards

### Fixed
- Wild Letter now pauses the main round timer and Chrono Combo countdown from power activation through tile targeting and letter selection. Both resume only when the power completes or is cancelled, and only if each timer was running before activation.
- Fixed Play Again flow by dismissing the results overlay and returning to the front screen before opening pre-round Round Power selection. Persistent statistics and personal-best records remain intact.

### Changed
- Replaced separate pause-preview probability panels with two effective distributions: one combined letter-draw probability and one combined bonus-tile probability. Current board composition and all remaining bag-entry lists remain available. Effective odds account for current bag contents, board-balance rules, the four-copy letter soft cap, and replenishment on an empty bag.
- Rebalanced main-timer rewards: 3-letter words receive +2 seconds, 4-letter +4, 5-letter +6, 6-letter +8, and 7+ letter words +10. There is no additional universal +2-second reward. Used bonus tiles still add +2 for 2LS, +3 for 3LS, +2 for 2WS, and +3 for 3WS. Per-word caps remain 10/15/20/25/30 seconds; overall cap remains 180 seconds. Word Amplifier score multipliers are unchanged.
- Updated the PWA cache version so installed clients can fetch the revised game assets.

### Verification
- JavaScript syntax checks passed for `js/game.js`, `js/marble-bag.js`, `js/scoring-rules.js`, `js/theme-toggle.js`, and `js/game-logic.js`.
- All six automated test suites passed, including the updated length-based timer examples, effective probability normalization, Wild Letter timer guards, and Play Again flow guards.
- ZIP integrity passed and the unchanged `original-source` folder is absent.
- Live browser interaction and Android device testing have not been performed; Wild Letter timing, Play Again screen transitions, and the pause-preview display still need manual confirmation.


## v3.04 — 2026-10-26 — Wild Letter gesture/timer, Randomize modes, configurable category selectors

### Fixed
- Wild Letter no longer pauses the main timer or Chrono Combo when the power is activated or while the player chooses the target tile. Both pause only when the letter picker opens and resume on cancel, failed placement, or successful transformation only if they were running when the picker opened.
- Strengthened tile targeting so board selection ignores pointer events originating from controls/modals and requires a fresh pointer-down and pointer-up on the same tile after the activation guard. The gesture movement threshold remains in place.

### Changed
- Added `RANDOMIZE_LETTER_MODE` in `js/game.js`, defaulting to `weighted_bypass_cap`. Set it to `uniform_any_letter` for uniform selection from A–Z. Both modes exclude the returned letter, return the old letter to the bag, bypass the ordinary four-copy soft cap, and consume the replacement from the appropriate letter sub-bag.
- Moved category selector sizes into `CATEGORY_DISTRIBUTION` in `js/marble-bag.js`: vowel 9 / consonant 16; common 20 / uncommon 5; normal bonus 18 / bonus tile 7. Within-category letter weights and bonus-type distribution remain unchanged.
- Kept the ordinary generation soft cap at four copies per letter and kept letter and bonus bags independent.

### Verification
- Updated Marble Bag tests for the 25-entry category selectors and added coverage for both Randomize modes and exclusion of the returned letter.
- JavaScript syntax, automated regression tests, and ZIP integrity checks were run for the v3.04 package. Live browser and Android touch testing remains necessary to confirm the intermittent Wild Letter issue is resolved in actual interaction.


## 2026-10-27 — Hitbox slider range and direction-aware diagonal drag test

### Changed
- Changed the diagnostic hitbox adjustment slider to −8% through +16% in 1% increments, with 0% as the default baseline. Negative values contract selectable bounds; positive values expand them.
- Updated the visible hitbox overlay to reflect negative and positive adjustments.
- Passed the pointer-event movement vector into trajectory hit testing so direction can break ties between competing neighboring hit regions, while retaining geometric proximity, neighbor-only selection, and backtracking.

### Verification
- JavaScript syntax checks passed for `js/game.js` and `js/game-logic.js`.
- All six existing Node.js test files passed, including new regression assertions for directional corner tie-breaking and negative adjustment behavior.
- ZIP integrity checked after packaging. Real-browser and physical-device interaction testing remain outstanding.


## v3.07.6 — 2026-10-30 — Tile gloss and flip artifact follow-up

### Changed
- Reshaped the glossy tile highlight to follow an octagonal cap rather than an oval that clashes with the tile silhouette.
- Added WebKit backface-visibility declarations and adjusted the flip's edge-on midpoint from 90° to 89° to reduce intermittent black compositing flashes while retaining the existing flip duration and sequence.

### Verification
- JavaScript syntax and automated tests are to be run against this package. Browser visual verification remains outstanding.


## v3.07.7 — 2026-10-30 — Flip artifact root-cause fix

### Fixed
- Removed the `BONUS` label pseudo-element from `.tile.bonus-hit::after`. The same pseudo-element is now used for the octagonal inset edge; the competing selector was replacing that edge with a dark rectangular label during bonus-tile feedback and flips.
- Removed the corresponding Style 2 override for that conflicting pseudo-element. Bonus-tile feedback continues to use the existing outline and glow.
- Restored the flip midpoint to the original 90-degree angle and removed the extra backface declarations introduced in v3.07.6, preserving the prior flip animation behavior.

### Verification
- JavaScript syntax and automated Node test suites checked after the CSS-only correction.
- ZIP integrity checked. Live browser reproduction/visual confirmation remains outstanding.


## [3.08.0] - 2026-10-30

### Added
- Added center-first initial board generation: center 3×3 followed by the four corner regions.
- Added Initial Draw Story and Recent Local Balance Story diagnostics, retaining the latest 30 actual balance decisions.
- Added read-only three-tab Marble Bag Preview: Initial Draw Story, Recent Local Balance Story, and the existing Marble Preview.

### Changed
- Reduced local vowel-validation retries from 20 to 3 per replacement draw and 3 attempts per initial region.
- Integrated local 3×3 validation into Bomb replacement draws while preserving Bomb gravity, cascade, and landing-bonus behavior.
- Included initial-generation and recent balance histories in the game's diagnostic snapshot.

### Fixed
- Rejected local-balance candidates restore bag contents, draw counters, replenishment counters, and last-draw metadata before retrying.

### Performance / Refactoring
- Kept the existing Marble Bag hierarchy, forced selector-bypass draws, sub-bag availability behavior, effective probability calculation, and Wild Letter special behavior.
- Bumped the PWA cache version so updated game and preview assets are refreshed.
