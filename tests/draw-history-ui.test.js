'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

assert.match(html, /id="marble-story-panel"/);
assert.match(html, /id="initial-draw-stages"/);
assert.match(html, /id="recent-local-stages"/);
assert.doesNotMatch(html, /marble-bag-preview\.html|marble-story-frame/);
assert.match(game, /event\.operation === 'region attempt'/);
assert.match(game, /event\.affectedRegions/);
assert.match(game, /draw-story-board/);
assert.match(css, /repeat\(3, minmax\(0,1fr\)\)/);
assert.match(css, /\.draw-story-cell\.is-drawn/);
console.log('Draw history UI source checks passed.');
