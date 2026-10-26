WordScavenger targeted UI update
================================
Replace these files in your existing word_scavenger_browser folder:
- index.html
- js/game.js
- css/style.css

Keep your existing js/wordlist.js unchanged.

Changes:
- Chrono Combo uses a floating compact text pill and a slim segmented cyan/gold frame around the board; no reserved blank space.
- Selection trace renders actual pointer coordinates, while tile selection retains its existing sampled hit-testing.
- Valid selected words glow before release; submitted words retain a brief success flash before the existing sequential tile-flip refill.

Important: Test in your existing project folder with Live Server. These files were generated from the uploaded source, not written directly into your Windows folder.

Long Word Bonus + Style 2 integration
====================================
Additional changes in this build:
- A valid 5-letter word grants 1 Long Word Bonus reward.
- A valid 6-letter word grants 2 rewards.
- A valid word of 7 or more letters grants up to 3 rewards.
- Rewards randomly choose 2LS, 3LS, 2WS, or 3WS.
- Rewards transform eligible ordinary tiles without changing their letters, and/or assign a bonus to tiles refilled by the submitted word.
- Existing bonus tiles, consumed tiles, and locked tiles are excluded from ordinary-tile transformation candidates.
- If an ordinary tile cannot be transformed, the implementation falls back to bonus assignment on a refill tile where possible.
- Transformations briefly animate and lock the affected tile while the bonus is applied.
- Style 2 includes a matching electric-blue/cyan and gold transformation effect. Its 3× Letter tile remains violet (#7C4DFF), distinct from selected blue (#0878F9).
- The quick tutorial explains the Long Word Bonus thresholds.

Keep css/style2.css and js/theme-toggle.js alongside the updated files. Both themes remain available using the fixed theme switch. Existing gameplay, sequential refill flips, scoring, Word Amplifier, Chrono Combo, and statistics code were retained.

Validation performed: JavaScript syntax check passed (node --check); ZIP integrity check passed. A full interactive browser regression test was not run in this environment.

Board Actions update:
- Rotate: earn one charge per valid word, maximum three. Rotates the full 5x5 board 90 degrees clockwise; letters and bonus/color metadata move together. Uses five batches of five tiles with the existing flip animation. No direct score or time reward.
- Randomize: earn one charge after five valid words while not holding a charge, maximum one. Activate the action and tap a tile to change its letter; the tile's existing bonus type/color is preserved. Uses the existing flip animation. No direct score or time reward.
- Board actions and tile selection are disabled while action animations run.
