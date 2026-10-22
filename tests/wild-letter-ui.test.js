'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scoring = fs.readFileSync(path.join(root, 'js/scoring-rules.js'), 'utf8');

assert.match(game, /tileData\.isWildLetter \? 1 : \(LETTER_POINTS\[tileData\.letter\.charCodeAt\(0\) - 64\] \|\| 0\)/,
  'updateTileElement must render Wild Letter value as 1');
assert.match(game, /const letterValue = tileData\?\.isWildLetter \? 1 :/,
  'initial tile rendering must render Wild Letter value as 1');
assert.match(scoring, /if \(tile\.isWildLetter\) \{[\s\S]*?letterScore \+= 1;[\s\S]*?return;/,
  'Wild Letter scoring must add one point and skip inherited bonus metadata');
assert.equal((html.match(/class="board-action [^"]*"/g) || []).length, 5,
  'all five power buttons must remain present');
for (const file of ['css/style.css', 'css/style2.css']) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(css, /\.board-actions \{ grid-template-columns: repeat\(5, minmax\(0, 1fr\)\) !important;/,
    `${file} must lay out five power buttons in one row`);
  if (file === 'css/style.css') {
    assert.match(css, /body:not\(\.theme-style2\) \.wild-letter-tile[\s\S]*?background: #ff9d78 !important;/,
      'Classic Wild Letter must use the default light-brown tile background');
  } else {
    assert.match(css, /body\.theme-style2 \.wild-letter-tile[\s\S]*?background: #ffffff !important;/,
      'Style 2 Wild Letter must use the default white tile background');
  }
  assert.match(css, /0 0 13px 4px rgba\(.*?\) !important;/,
    `${file} must provide a visible outer glow`);
  assert.match(css, /\.wild-letter-action \{ order: 3 !important;/, `${file} must put Wild Letter in the center column`);
  assert.match(css, /\.rotate-action \{ order: 1 !important;/, `${file} must put Rotate first`);
  assert.match(css, /\.randomize-action \{ order: 2 !important;/, `${file} must put Randomize second`);
  assert.match(css, /\.bomb-action \{ order: 4 !important;/, `${file} must put Bomb fourth`);
  assert.match(css, /\.swap-action \{ order: 5 !important;/, `${file} must put Swap fifth`);
  assert.doesNotMatch(css.slice(css.lastIndexOf('/* Wild Letter follow-up')), /background: linear-gradient\(140deg, #ff4fd8/,
    `${file} final Wild Letter override must not use the magenta gradient`);
}
console.log('PASS: Wild Letter rendering, scoring, theme, and five-button layout source checks');
