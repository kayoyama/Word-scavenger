'use strict';
const assert = require('node:assert/strict');
const rules = require('../js/scoring-rules.js');

const points = [0, 16, 34, 32, 23, 14, 42, 24, 41, 16, 81, 52, 22, 32, 19, 18, 34, 102, 19, 22, 19, 22, 45, 42, 82, 42, 101];
const tile = (letter, bonus = 'NO') => ({ letter, bonus });

// Word score: letter bonuses apply to letters, word bonuses multiply the letter subtotal,
// then Word Amplifier is applied once to that subtotal.
{
  const result = rules.calculateWordScore([tile('A', '2LS'), tile('B', '2WS'), tile('C', '3WS')], [0, 1, 2], points);
  assert.deepEqual(result, { base: 98, multiplier: 6, baseTotal: 588, amplifierMultiplier: 1, amplifierBonus: 0, total: 588 });
}
{
  const result = rules.calculateWordScore([tile('A'), tile('B'), tile('C'), tile('D')], [0, 1, 2, 3], points);
  assert.deepEqual(result, { base: 105, multiplier: 1, baseTotal: 105, amplifierMultiplier: 1.25, amplifierBonus: 26, total: 131 });
}
{
  const result = rules.calculateWordScore(Array.from('ABCDEFG').map((letter) => tile(letter)), [0, 1, 2, 3, 4, 5, 6], points);
  assert.equal(result.amplifierMultiplier, 2);
  assert.equal(result.total, Math.round(result.baseTotal * 2));
  assert.equal(result.amplifierBonus, result.total - result.baseTotal);
}

// Length-based time rewards plus tile rewards are capped per word, then by the overall timer.
{
  const tiles = [tile('A', '3LS'), tile('B', '3WS'), tile('C', '2LS'), tile('D', '2WS')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2, 3], 120, 180);
  assert.equal(result.extra, 10);
  assert.equal(result.amplifierSeconds, 4);
  assert.equal(result.requested, 14);
  assert.equal(result.wordCap, 15);
  assert.equal(result.added, 14);
  assert.equal(result.newSecondsLeft, 134);
}
{
  const tiles = [tile('A'), tile('B'), tile('C'), tile('D'), tile('E'), tile('F'), tile('G')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2, 3, 4, 5, 6], 175, 180);
  assert.equal(result.cappedRequested, 10);
  assert.equal(result.added, 5);
  assert.equal(result.newSecondsLeft, 180);
}
{
  const tiles = [tile('A'), tile('B'), tile('C')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2], 180, 180);
  assert.equal(result.added, 0);
  assert.equal(result.newSecondsLeft, 180);
}

// Length reward replaces the old universal +2; examples from the approved table.
{
  const three = [tile('A', '3LS'), tile('B', '3LS'), tile('C', '3LS')];
  const result3 = rules.calculateTimeAward(three, [0, 1, 2], 100, 180);
  assert.equal(result3.requested, 11);
  assert.equal(result3.cappedRequested, 10);
  const four = [tile('A', '3LS'), tile('B', '3LS'), tile('C', '3LS'), tile('D', '3LS')];
  const result4 = rules.calculateTimeAward(four, [0, 1, 2, 3], 100, 180);
  assert.equal(result4.requested, 16);
  assert.equal(result4.cappedRequested, 15);
  assert.equal(rules.calculateTimeAward([tile('A'), tile('B'), tile('C'), tile('D'), tile('E')], [0,1,2,3,4], 100, 180).requested, 6);
}

// Combo rewards affect only the combo deadline and score, never the main timer.
{
  const first = rules.calculateComboTransition(0, 0, 10000, 7000, 20);
  assert.deepEqual(first, { level: 1, deadline: 17000, rewardSeconds: 0, requestedReward: 0, rewardPoints: 0, secondsRemaining: 7 });
  const second = rules.calculateComboTransition(first.level, first.deadline, 11000, 7000, 20);
  assert.equal(second.level, 2);
  assert.equal(second.rewardPoints, 100);
  assert.equal(second.rewardSeconds, 3);
  assert.equal(second.deadline, 20000); // remaining 6s + 3s
  const third = rules.calculateComboTransition(second.level, second.deadline, 12000, 7000, 20);
  assert.equal(third.level, 3);
  assert.equal(third.rewardPoints, 300);
  assert.equal(third.rewardSeconds, 4);
  assert.equal(third.deadline, 24000);
  const fourth = rules.calculateComboTransition(third.level, third.deadline, 13000, 7000, 20);
  assert.equal(fourth.level, 4);
  assert.equal(fourth.rewardPoints, 500);
  assert.equal(fourth.rewardSeconds, 5);
  assert.equal(fourth.secondsRemaining, 16);
}
{
  const restarted = rules.calculateComboTransition(4, 9000, 10000, 7000, 20);
  assert.equal(restarted.level, 1);
  assert.equal(restarted.rewardPoints, 0);
  assert.equal(restarted.deadline, 17000);
}

// Long-word charge eligibility uses a minimum length, not an exact-length match.
assert.equal(rules.qualifiesForLongWordCharge(5, 6), false);
assert.equal(rules.qualifiesForLongWordCharge(6, 6), true);
assert.equal(rules.qualifiesForLongWordCharge(8, 6), true);
assert.equal(rules.qualifiesForLongWordCharge(6, 7), false);
assert.equal(rules.qualifiesForLongWordCharge(7, 7), true);
assert.equal(rules.qualifiesForLongWordCharge(9, 7), true);

console.log('PASS: scoring, amplifier, time caps, combo transitions, and long-word charge thresholds');

// Integration guard: each reward function has one call site in the accepted-word path,
// and refill callbacks do not invoke the reward functions.
{
  const fs = require('node:fs');
  const source = fs.readFileSync(require('node:path').join(__dirname, '../js/game.js'), 'utf8');
  for (const call of [/awardTimeBonus\(usedIndices\)/g, /const comboResult = processChronoCombo\(\)/g, /grantActionCharges\(word\.length\)/g]) {
    const matches = source.match(call) || [];
    assert.equal(matches.length, 1, `expected exactly one source call site for ${call}`);
  }
  assert.match(source, /const result = scoreWord\(usedIndices\);[\s\S]*?const timeAdded = awardTimeBonus\(usedIndices\);[\s\S]*?const comboResult = processChronoCombo\(\);[\s\S]*?grantActionCharges\(word.length\);/);
}

console.log('PASS: accepted-word reward call-site guard');

// Power charge milestones: all 6+ letter words are excluded from both regular
// milestones; qualifying long words may award immediate charges without resetting progress.
{
  const advance = rules.advancePowerChargeProgress;
  let bomb = advance(9, 0, 3, 6, 6, 10, 6);
  assert.deepEqual(bomb, { charges: 1, progress: 9, earned: true, reason: 'long-word' });
  let swap = advance(14, 0, 3, 6, 7, 15, 6);
  assert.deepEqual(swap, { charges: 0, progress: 14, earned: false, reason: 'excluded-long-word' });
  swap = advance(swap.progress, swap.charges, 3, 7, 7, 15, 6);
  assert.deepEqual(swap, { charges: 1, progress: 14, earned: true, reason: 'long-word' });
  bomb = advance(bomb.progress, bomb.charges, 3, 5, 6, 10, 6);
  assert.deepEqual(bomb, { charges: 2, progress: 0, earned: true, reason: 'milestone' });
  swap = advance(swap.progress, swap.charges, 3, 5, 7, 15, 6);
  assert.deepEqual(swap, { charges: 2, progress: 0, earned: true, reason: 'milestone' });
  const full = advance(8, 3, 3, 7, 7, 15, 6);
  assert.deepEqual(full, { charges: 3, progress: 0, earned: false, reason: 'full' });
}
console.log('PASS: long words are excluded from both regular power milestones; charge progress is preserved');

// Animation lifecycle integration guards: only Rotate pauses timers; all power
// entry points use the shared animation-lock predicate and stale callbacks are token-guarded.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
  const randomizeBody = source.slice(source.indexOf('  function randomizeTileLetter('), source.indexOf('  function renderBoard('));
  const rotateBody = source.slice(source.indexOf('  function rotateBoardClockwise('), source.indexOf('  function armRandomize('));
  assert.doesNotMatch(randomizeBody, /pauseRoundTimer\(|pauseChronoComboTimer\(|resumeRoundTimer\(|resumeChronoComboTimer\(/);
  assert.match(rotateBody, /pauseRoundTimer\(\)/);
  assert.match(rotateBody, /pauseChronoComboTimer\(\)/);
  assert.match(rotateBody, /resumeRoundTimer\(timerWasRunning\)/);
  assert.match(rotateBody, /resumeChronoComboTimer\(chronoWasRunning\)/);
  for (const fn of ['armBomb', 'armSwap', 'useBombAt', 'useSwap', 'rotateBoardClockwise', 'armRandomize', 'randomizeTileLetter']) {
    const start = source.indexOf(`  function ${fn}(`);
    assert.notEqual(start, -1, `missing ${fn}`);
    const next = source.indexOf('\n  function ', start + 4);
    assert.match(source.slice(start, next === -1 ? source.length : next), /isPowerActionLocked\(\)/, `${fn} must enforce the shared animation lock`);
  }
  assert.match(source, /if \(token !== refillToken\) return;/);
  for (const [fn, charge] of [['useBombAt', 'bombCharges -= 1;'], ['useSwap', 'swapCharges -= 1;'], ['randomizeTileLetter', 'randomizeCharges -= 1;']]) {
    const start = source.indexOf(`  function ${fn}(`);
    const next = source.indexOf('\n  function ', start + 4);
    const body = source.slice(start, next === -1 ? source.length : next);
    assert.equal((body.match(new RegExp(charge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, `${fn} should consume one charge once per activation`);
  }
}
console.log('PASS: animation lock and timer-policy source guards');


// Rotate is unlimited and does not participate in the word-charge economy.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const rotateBody = source.slice(source.indexOf('  function rotateBoardClockwise('), source.indexOf('  function armRandomize('));
  assert.doesNotMatch(source, /rotateCharges|ROTATE_CHARGE_CAP/);
  assert.match(source, /rotateButton\.disabled = !roundActive \|\| boardLocked;/);
  assert.match(html, /id="rotate-count"[^>]*>∞<\/span>/);
  assert.doesNotMatch(rotateBody, /scoreWord\(|awardTimeBonus\(|grantActionCharges\(/);
  assert.match(rotateBody, /animationDuration \+ 60/);
}
console.log('PASS: unlimited Rotate and end-frame handoff source guards');

// Bomb visual feedback is present in both themes and remains a separate layer
// from the existing cascade mechanics.
{
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
  for (const stylesheet of ['style.css', 'style2.css']) {
    const css = fs.readFileSync(path.join(__dirname, `../css/${stylesheet}`), 'utf8');
    assert.match(css, /\.bomb-aim-icon/);
    assert.match(css, /\.bomb-blast-effect/);
    assert.match(css, /prefers-reduced-motion/);
  }
  assert.match(source, /function updateBombAimIcon\(/);
  assert.match(source, /function showBombExplosion\(/);
  assert.match(source, /showBombExplosion\(row, col, 260\)/);
  assert.match(source, /bomb-blast-spark/);
  assert.match(source, /rotateClockwiseSourceIndex\(destinationIndex, SIZE\)/);
}
console.log('PASS: Bomb aiming icon and localized blast source guards');

// Wild Letters always contribute exactly one point and ignore inherited tile bonuses.
{
  const wild = { letter: 'Z', bonus: '3WS', isWildLetter: true, id: 'wild-test-1' };
  const result = rules.calculateWordScore([tile('A'), tile('B'), wild], [0, 1, 2], points);
  assert.equal(result.base, points[1] + points[2] + 1);
  assert.equal(result.multiplier, 1, 'Wild Letter must not apply an inherited word multiplier');
  assert.equal(result.total, points[1] + points[2] + 1, 'Wild Letter score ignores inherited letter/word bonus metadata');
}
console.log('PASS: Wild Letter fixed value and bonus isolation');
