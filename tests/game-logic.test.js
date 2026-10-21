'use strict';
const assert = require('node:assert/strict');
const logic = require('../js/game-logic.js');

function makeBoard(size = 5) {
  return Array.from({ length: size * size }, (_, i) => ({
    id: i,
    letter: String.fromCharCode(65 + (i % 26)),
    bonus: ['NO', '2LS', '3LS', '2WS', '3WS'][i % 5],
    color: `color-${i % 5}`,
    extra: { stableId: `tile-${i}` }
  }));
}

// Rotate mapping and complete metadata preservation.
{
  const original = makeBoard();
  let rotated = original;
  for (let i = 0; i < 4; i += 1) rotated = logic.rotateClockwise(rotated, 5);
  assert.deepEqual(rotated, original, 'four clockwise rotations restore every tile and metadata');
  const once = logic.rotateClockwise(original, 5);
  assert.equal(once[0], original[20], 'top-left destination receives bottom-left source for clockwise rotation');
  assert.equal(once[12], original[12], 'center tile remains at the center');
  assert.equal(once[0].bonus, original[20].bonus, 'bonus metadata moves with tile identity');
}

// Randomize changes only the letter and preserves bonus/color/other metadata.
{
  const original = makeBoard()[8];
  const changed = logic.withRandomizedLetter(original, 'Z');
  assert.equal(changed.letter, 'Z');
  assert.equal(changed.bonus, original.bonus);
  assert.equal(changed.color, original.color);
  assert.deepEqual(changed.extra, original.extra);
  assert.notEqual(changed, original, 'randomized tile is a new object with preserved metadata');
}

// Swap changes only two positions and preserves complete tile objects.
{
  const original = makeBoard();
  const swapped = logic.swapTiles(original, 1, 23);
  assert.equal(swapped[1], original[23]);
  assert.equal(swapped[23], original[1]);
  for (let i = 0; i < original.length; i += 1) {
    if (i !== 1 && i !== 23) assert.equal(swapped[i], original[i], `unaffected tile ${i} stays stationary`);
  }
  assert.throws(() => logic.swapTiles(original, 2, 2), RangeError);
}

// Bomb at a corner: only the two target columns change; bottom unaffected tiles retain identity.
{
  const original = makeBoard();
  let nextId = 100;
  const result = logic.bombClearAndGravity(original, 5, 0, 0, () => ({ id: nextId++, letter: 'Z', bonus: 'NO', color: 'new' }));
  assert.deepEqual(result.clearedIndices, [0, 1, 5, 6]);
  assert.equal(result.newTiles.size, 4, 'top-edge bomb refills four cleared positions');
  for (let row = 2; row < 5; row += 1) {
    for (let col = 2; col < 5; col += 1) assert.equal(result.tiles[row * 5 + col], original[row * 5 + col], 'unaffected tile remains stationary');
  }
  assert.equal(result.tiles[10], original[10]);
  assert.equal(result.tiles[11], original[11]);
}

// Bomb in the middle: two tiles above fall into the block, and only target columns change.
{
  const original = makeBoard();
  let nextId = 200;
  const result = logic.bombClearAndGravity(original, 5, 2, 2, () => ({ id: nextId++, letter: 'Q', bonus: '3WS', color: 'new' }));
  assert.equal(result.tiles[12], original[2]);
  assert.equal(result.tiles[17], original[7]);
  assert.equal(result.tiles[2].id, 200);
  assert.equal(result.tiles[7].id, 201);
  assert.equal(result.newTiles.size, 4);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (col !== 2 && col !== 3) assert.equal(result.tiles[row * 5 + col], original[row * 5 + col], `column ${col} remains unchanged`);
    }
  }
}

// Round summary is stable and handles zero-word rounds without NaN/Infinity.
{
  const summary = logic.summarizeRound({
    finalScore: 1234, wordsFound: 4, longestWord: 'SCAVENGE', highestWord: 'WORD',
    highestWordScore: 501, highestCombo: 3, timeBonusSeconds: 37,
    wordAndTileScore: 900, amplifierBonus: 134, comboBonus: 200
  });
  assert.equal(summary.averagePointsPerWord, 308.5);
  assert.equal(summary.highestCombo, 3);
  assert.equal(summary.timeBonusSeconds, 37);
  assert.equal(summary.wordAndTileScore + summary.amplifierBonus + summary.comboBonus, 1234);
  assert.equal(logic.summarizeRound({ finalScore: 0, wordsFound: 0 }).averagePointsPerWord, 0);
}

console.log('PASS: game-logic tests (rotation, randomize metadata, swap, bomb gravity/refill, round summary)');

// Source-level integration checks for persistence and safe round transitions.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
  assert.match(source, /function endGame\(\)\s*\{[\s\S]*?roundActive = false;[\s\S]*?cancelPowerModes\(\);[\s\S]*?cancelRefillSequence\(\);/,
    'game-over cancels armed powers and pending action callbacks');
  assert.match(source, /stats\.rounds\.unshift\(\{\s*\.\.\.roundRecord/s, 'round summary is persisted into Recent Games');
  assert.match(source, /function saveStats\(\)[\s\S]*?localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(stats\)\)/,
    'persistent stats use the existing local-storage key');
  assert.match(source, /el\('play-again-button'\)\.addEventListener\('click', startGame\)/,
    'Play Again starts a fresh round through the normal reset path');
  assert.match(source, /const swappedTileData = new Set\(\[tiles\[firstIndex\], tiles\[secondIndex\]\]\)/,
    'Swap animation tracks the two swapped tile objects rather than undefined identifiers');
  assert.doesNotMatch(source, /new Set\(\[first, second\]\)/,
    'Swap must not reference undefined first/second variables that can leave actionBusy stuck');
  assert.match(source, /function startGame\(\)[\s\S]*?totalScore = 0;[\s\S]*?sessionWords = 0;[\s\S]*?sessionTimeBonus = 0;/,
    'new round resets transient score and time metrics');
}
console.log('PASS: round persistence, game-over cancellation, and Play Again source guards');
