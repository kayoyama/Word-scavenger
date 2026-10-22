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
  for (let destinationIndex = 0; destinationIndex < 25; destinationIndex += 1) {
    assert.equal(once[destinationIndex], original[logic.rotateClockwiseSourceIndex(destinationIndex, 5)], `DOM source mapping preserves tile identity at destination ${destinationIndex}`);
  }
  assert.equal(logic.rotateClockwiseSourceIndex(0, 5), 20, 'top-left destination maps to bottom-left source');
  assert.equal(logic.rotateClockwiseSourceIndex(12, 5), 12, 'center destination maps to center source');
  assert.throws(() => logic.rotateClockwiseSourceIndex(25, 5), RangeError);
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
  assert.equal(result.movementPlan.get(0).sourceIndex, null, 'top-edge replacement animates from above the board');
  assert.equal(result.movementPlan.get(0).isNew, true, 'top-edge movement plan marks replacement tiles as new');
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
  assert.deepEqual(result.movementPlan.get(12), { sourceIndex: 2, isNew: false, tile: original[2] }, 'existing falling tile has a stable source-to-destination plan');
  assert.deepEqual(result.movementPlan.get(17), { sourceIndex: 7, isNew: false, tile: original[7] }, 'second landing tile tracks its own source');
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (col !== 2 && col !== 3) assert.equal(result.tiles[row * 5 + col], original[row * 5 + col], `column ${col} remains unchanged`);
    }
  }
}


// Bomb cascade around protected Chain tiles: only the anchored tile is immune.
{
  const original = makeBoard();
  original[7].isAnchored = true; // fixed tile above/inside the affected two-column region
  original[12].isAnchored = true; // protected tile in the 2x2 target
  let nextId = 500;
  const result = logic.bombClearAndGravity(original, 5, 2, 2, () => ({ id: nextId++, letter: 'Z', bonus: 'NO' }));
  assert.equal(result.tiles[7], original[7], 'anchored tile above the blast stays at its original index');
  assert.equal(result.tiles[12], original[12], 'anchored tile inside the blast survives in place');
  assert.ok(result.clearedIndices.includes(13), 'unanchored target tile beside a protected tile is still cleared');
  assert.ok(result.clearedIndices.includes(17), 'unanchored target tile below the protected tile is still cleared');
  assert.ok(!result.clearedIndices.includes(12), 'protected target tile is not destroyed');
  assert.equal(result.tiles[10], original[10], 'columns outside the blast/cascade stay unchanged');
  assert.equal(result.tiles[11], original[11], 'neighboring column outside the blast/cascade stays unchanged');
  for (let row = 0; row <= 3; row += 1) {
    for (const col of [2, 3]) {
      const tile = result.tiles[row * 5 + col];
      assert.ok(tile, `affected position ${row},${col} is filled`);
    }
  }
  assert.equal(result.newTiles.size, result.clearedIndices.length, 'new tiles fill the unprotected cleared positions');
}

// Bonus promotion must never alter a protected Chain tile.
{
  const board = makeBoard();
  board[12].isAnchored = true;
  const originalBonus = board[12].bonus;
  const transitions = logic.resolveBombLandingBonuses(board, [12], new Map([[12, '3WS']]));
  assert.equal(board[12].bonus, originalBonus, 'protected tile bonus is untouched');
  assert.equal(transitions.has(12), false, 'protected tile has no landing-bonus transition');
}


// Bomb gravity passes unchained tiles through fixed Chain tiles and only creates
// new letters for topmost unchained vacancies after all available tiles fall.
{
  const original = makeBoard();
  original[7].isAnchored = true; // fixed at row 1, in the first affected column
  const upperTile = original[2]; // unchained tile above the Chain tile
  let nextId = 700;
  const result = logic.bombClearAndGravity(original, 5, 2, 2, () => ({ id: nextId++, letter: 'Z', bonus: 'NO' }));
  assert.equal(result.tiles[7], original[7], 'Chain tile stays fixed');
  assert.equal(result.tiles[17], upperTile, 'unchained tile cascades past the fixed Chain tile into a lower vacancy');
  assert.equal(result.newTiles.size, result.clearedIndices.length, 'new letters only replace the vacancies left after available unchained tiles fall');
  assert.equal(result.movementPlan.get(2).isNew, true, 'new letter spawns at a top vacancy only after the unchained source tile cascades down');
}

// Bomb landing bonus resolution is independent per destination and preserves tile identity/letters.
{
  const board = makeBoard();
  const existingFallingTile = board[2];
  const generatedTopTile = { id: 900, letter: 'Z', bonus: 'NO', color: 'new' };
  board[12] = existingFallingTile;
  board[0] = generatedTopTile;
  board[13].bonus = '3WS';
  board[18].bonus = '2WS';
  const explodedBonuses = new Map([[12, '3WS'], [0, '2WS'], [13, '2LS'], [18, '3WS']]);
  const transitions = logic.resolveBombLandingBonuses(board, [12, 0, 13, 18], explodedBonuses);
  assert.equal(board[12], existingFallingTile, 'promoted existing tile keeps object identity');
  assert.equal(board[12].letter, existingFallingTile.letter, 'promoted existing tile keeps its letter');
  assert.equal(board[12].bonus, '3WS', 'exploded destination wins when its bonus is stronger');
  assert.equal(board[0], generatedTopTile, 'promoted newly generated tile keeps object identity');
  assert.equal(board[0].letter, 'Z', 'random replacement letter is retained after promotion');
  assert.equal(board[0].bonus, '2WS', 'new top-edge tile is promoted independently');
  assert.equal(board[13].bonus, '3WS', 'incoming stronger bonus wins independently at another destination');
  assert.equal(board[18].bonus, '3WS', 'each landing position uses its own exploded bonus');
  assert.equal(transitions.get(12), '3LS', 'existing tile transition records its incoming bonus');
  assert.equal(transitions.get(0), 'NO', 'generated tile transition records its random incoming bonus');
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
  assert.match(source, /el\('play-again-button'\)\.addEventListener\('click', requestNewGame\)/,
    'Play Again returns through the pre-round power selection before starting a fresh round');
  assert.match(source, /const swappedTileData = new Set\(\[tiles\[firstIndex\], tiles\[secondIndex\]\]\)/,
    'Swap animation tracks the two swapped tile objects rather than undefined identifiers');
  assert.doesNotMatch(source, /new Set\(\[first, second\]\)/,
    'Swap must not reference undefined first/second variables that can leave actionBusy stuck');
  assert.match(source, /function startGame\(\)[\s\S]*?totalScore = 0;[\s\S]*?sessionWords = 0;[\s\S]*?sessionTimeBonus = 0;/,
    'new round resets transient score and time metrics');
}
console.log('PASS: round persistence, game-over cancellation, and Play Again source guards');

// Bomb pointer integration: release-to-explode uses the captured target and bounded
// release validation, never a stale preview as an unconditional fallback.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
  assert.match(source, /function captureBombTargetAtPoint\(x, y\)[\s\S]*?nearest\.distance > bombTargetTolerance/,
    'Bomb target acquisition accepts a forgiving but bounded neighborhood around an intersection');
  assert.match(source, /function isReleaseNearBombTarget\(target, x, y\)[\s\S]*?x < boardRect\.left[\s\S]*?Math\.hypot\(x - point\.x, y - point\.y\) <= bombTargetTolerance/,
    'Bomb release must remain inside the board and close to the captured target');
  assert.match(source, /bombGestureTarget = captureBombTargetAtPoint\(event\.clientX, event\.clientY\)/,
    'pointer-down captures the intended Bomb target');
  assert.match(source, /const candidate = captureBombTargetAtPoint\(event\.clientX, event\.clientY\);[\s\S]*?if \(candidate\) \{[\s\S]*?bombGestureTarget = candidate/,
    'dragging updates the captured target only when a new valid target is acquired');
  assert.match(source, /if \(!isCancellation && isReleaseNearBombTarget\(target, event\.clientX, event\.clientY\)\)\s*\{\s*useBombAt\(target\.row, target\.col\);/,
    'Bomb detonates on release only when the captured target passes release validation');
  assert.doesNotMatch(source, /findBombBlockAtPoint\(event\.clientX, event\.clientY\)\s*\|\|\s*\(bombTargetPreview/,
    'stale preview cannot bypass release validation');
  assert.match(source, /const isCancellation = event\.type === 'pointercancel'/,
    'pointer cancellation never detonates the Bomb');
  assert.match(source, /function animateBombMovementPlan\(oldRectsByIndex, movementPlan[\s\S]*?const oldRect = sourceIndex === null \? null : oldRectsByIndex\.get\(sourceIndex\)/,
    'Bomb animation uses a destination-indexed movement plan rather than tile object identity');
  assert.match(source, /gameLogic\.resolveBombLandingBonuses\(tiles, bombResult\.clearedIndices, landingBonuses\)/,
    'Bomb bonus resolution uses tested shared logic while preserving tile identity');
  assert.match(source, /animateBombMovementPlan\(oldRectsByIndex, bombResult\.movementPlan, 300, token, bonusTransitionByIndex\)/,
    'Bomb uses the precomputed movement plan and per-destination color transition');
}
