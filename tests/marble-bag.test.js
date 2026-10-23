'use strict';
const assert = require('node:assert/strict');
const marbleBag = require('../js/marble-bag.js');

function makeBoard(fill = null) { return Array.from({ length: 25 }, () => fill ? { ...fill } : null); }

// The agreed pool sizes are preserved in the independently replenished bags.
{
  const engine = marbleBag.createEngine({ random: () => 0.37 });
  const state = engine.getState();
  assert.equal(state.letterCategory.size, 100);
  assert.equal(state.vowelLetters.size, 96);
  assert.equal(state.consonantGroup.size, 154);
  assert.equal(state.commonLetters.size, 118);
  assert.equal(state.uncommonLetters.size, 36);
  assert.equal(state.bonusCategory.size, 100);
  assert.equal(state.normalTiles.size, 175);
  assert.equal(state.bonusTypes.size, 75);
}

// A full board already at the vowel upper limit forces a consonant.
{
  const engine = marbleBag.createEngine();
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 12; i += 1) board[i] = { letter: 'A', bonus: 'NO' };
  board[24] = null;
  const before = engine.getState().letterCategory.remaining;
  const letter = engine.drawLetter(board, 24);
  assert.ok(!'AEIOU'.includes(letter), `expected a consonant, got ${letter}`);
  assert.equal(engine.getState().letterCategory.remaining, before, 'forced consonant bypasses the top-level category bag');
}

// If the remaining empty slots cannot reach eight vowels, a vowel is forced.
{
  const engine = marbleBag.createEngine();
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 7; i += 1) board[i] = { letter: 'A', bonus: 'NO' };
  board[24] = null;
  const letter = engine.drawLetter(board, 24);
  assert.ok('AEIOU'.includes(letter), `expected a vowel, got ${letter}`);
}

// A forced uncommon/common subgroup draw bypasses the subgroup selector.
{
  const engine = marbleBag.createEngine();
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 12; i += 1) board[i] = { letter: 'A', bonus: 'NO' };
  for (let i = 12; i < 17; i += 1) board[i] = { letter: 'P', bonus: 'NO' };
  board[24] = null;
  const before = engine.getState().consonantGroup.remaining;
  const letter = engine.drawLetter(board, 24);
  assert.ok('TRNSLGDCHM'.includes(letter), `five existing uncommon consonants force a common consonant, got ${letter}`);
  assert.equal(engine.getState().consonantGroup.remaining, before, 'forced subgroup draw bypasses its selector bag');
}

// Bonus safeguards enforce the initial 5-10 bonus-tile range on a completed board.
{
  const engine = marbleBag.createEngine();
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 10; i += 1) board[i] = { letter: 'T', bonus: '2LS' };
  board[24] = null;
  const before = engine.getState().bonusCategory.remaining;
  assert.equal(engine.drawBonus(board, 24), 'NO', 'ten existing bonus tiles force a normal tile');
  assert.equal(engine.getState().bonusCategory.remaining, before, 'forced normal draw bypasses the bonus category bag');
}
{
  const engine = marbleBag.createEngine();
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 4; i += 1) board[i] = { letter: 'T', bonus: '2LS' };
  board[24] = null;
  assert.notEqual(engine.drawBonus(board, 24), 'NO', 'four bonuses with no future slots force a bonus');
}

// A depleted sub-bag replenishes only when the next draw is requested.
{
  const engine = marbleBag.createEngine({ random: () => 0.37 });
  const board = makeBoard({ letter: 'T', bonus: 'NO' });
  for (let i = 0; i < 7; i += 1) board[i] = { letter: 'A', bonus: 'NO' };
  board[24] = null;
  for (let i = 0; i < 96; i += 1) engine.drawLetter(board, 24);
  assert.equal(engine.getState().vowelLetters.remaining, 0);
  assert.equal(engine.getState().vowelLetters.replenishments, 1);
  engine.drawLetter(board, 24);
  assert.equal(engine.getState().vowelLetters.remaining, 95);
  assert.equal(engine.getState().vowelLetters.replenishments, 2);
}

// Randomize returns the old letter to its corresponding letter sub-bag; same letters are allowed.
{
  const engine = marbleBag.createEngine();
  const before = engine.getState();
  engine.returnLetter('A');
  const after = engine.getState();
  assert.equal(after.vowelLetters.remaining, before.vowelLetters.remaining + 1);
}

// Randomize animation previews do not consume entries; only the final replacement is a real draw.
{
  const engine = marbleBag.createEngine({ random: () => 0.37 });
  const before = engine.getState();
  assert.ok('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(engine.previewLetter()));
  assert.deepEqual(engine.getState(), before, 'visual-only preview does not change any bag');
}

// Long Word Bonus uses weighted selection with replacement and upgrades only within a family.
{
  const engine2ls = marbleBag.createEngine({ random: () => 0.01 });
  assert.equal(engine2ls.weightedBonus(), '2LS');
  const engine3ls = marbleBag.createEngine({ random: () => 0.4 });
  assert.equal(engine3ls.weightedBonus(), '3LS');
  const engine2ws = marbleBag.createEngine({ random: () => 0.7 });
  assert.equal(engine2ws.weightedBonus(), '2WS');
  const engine3ws = marbleBag.createEngine({ random: () => 0.9 });
  assert.equal(engine3ws.weightedBonus(), '3WS');
  const engine = marbleBag.createEngine({ random: () => 0.01 });
  const bonusStateBefore = engine.getState();
  assert.equal(engine.upgradeBonus('NO'), '2LS');
  assert.deepEqual(engine.getState(), bonusStateBefore, 'Long Word Bonus does not consume or modify any bag');
  assert.equal(engine.upgradeBonus('2LS'), '3LS');
  assert.equal(engine.upgradeBonus('3LS'), '3LS');
  assert.equal(engine.upgradeBonus('2WS'), '3WS');
  assert.equal(engine.upgradeBonus('3WS'), '3WS');
}

console.log('Marble Bag tests passed.');
