'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /id="round-power-action-symbol"[^>]*>\s*<svg/, 'Wild Letter button starts with an SVG symbol, not a plain W');
assert.match(game, /actionSymbol\.innerHTML = '<svg viewBox="0 0 24 24"/, 'Wild Letter uses an inline wildcard SVG');
assert.match(html, /<strong>Chain Protect<\/strong>/, 'Round Power picker uses Chain Protect name');
assert.match(game, /textContent = anchorSelected \? 'CHAIN PROTECT' : 'WILD LETTER'/, 'middle button label reflects the selected power');
assert.match(game, /const usedWildLettersThisRound = new Set\(\)/, 'selected letters are tracked for the current round');
assert.match(game, /button\.disabled = alreadyUsed/, 'letters already selected are disabled in the picker');
assert.match(game, /if \(usedWildLettersThisRound\.has\(letter\)\) return/, 'already-used letters cannot be selected again');
assert.match(game, /usedWildLettersThisRound\.clear\(\)/, 'letter availability resets for each new round');
assert.match(game, /usedWildLettersThisRound\.has\(wildLetterLetter\)/, 'transform also guards against reusing a letter');
assert.match(game, /const WILD_LETTER_TAP_MOVE_THRESHOLD = 12/, 'Wild Letter has a small touch movement threshold');
assert.match(game, /wildLetterGesture = \{ pointerId: event\.pointerId, index: Number\(tile\.dataset\.index\)/, 'tile target is recorded on pointer down rather than selected immediately');
assert.match(game, /releaseIndex === gesture\.index/, 'Wild Letter picker requires release on the same tile');
assert.match(game, /const WILD_LETTER_ACTIVATION_GUARD_MS = 450/, 'activation guard prevents the activating gesture from bleeding into tile targeting');
assert.match(game, /event\.type === 'pointerup' && !gesture\.moved && releasedOnSameTile/, 'Wild Letter requires a completed pointerup on the same tile');
assert.match(game, /board\.setPointerCapture\?\.\(event\.pointerId\)/, 'Wild Letter tracks the complete gesture even if the pointer drifts off the tile');
assert.match(game, /wildLetterGesture\.moved = true/, 'movement beyond threshold cancels tap targeting');
for (const file of ['css/style.css', 'css/style2.css']) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(css, /\.wild-letter-action \.action-copy strong \{[^}]*text-align: center/s, `${file} centers wrapped Round Power labels`);
  assert.match(css, /\.wild-letter-choice:disabled/, `${file} visibly disables already-used letters`);
}
console.log('PASS: Round Power icon/name, per-round unique Wild Letters, touch-safe targeting, and responsive centering source checks');

// Wild Letter pauses the main timer for its full targeting/picker lifecycle and restores only a previously running timer.
assert.match(game, /wildLetterTimerWasRunning = pauseRoundTimer\(\)/);
assert.match(game, /resumeRoundTimer\(wildLetterTimerWasRunning\)/);
assert.match(game, /wildLetterComboWasRunning = pauseChronoComboTimer\(\)/);
assert.match(game, /resumeChronoComboTimer\(wildLetterComboWasRunning\)/);
assert.match(game, /if \(wasWildLetterMode\)[\s\S]*?resumeRoundTimer\(wildLetterTimerWasRunning\)/);

// Play Again dismisses the results overlay before opening the pre-round selection flow.
const requestNewGameBody = game.slice(game.indexOf('  function requestNewGame('), game.indexOf('  function dismissTutorialAndStart('));
assert.match(requestNewGameBody, /el\('game-over'\)\.hidden = true/);
assert.match(requestNewGameBody, /showScreen\('front'\)/);
assert.match(requestNewGameBody, /showRoundPowerSelection\(\)/);
