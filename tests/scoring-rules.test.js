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

// Time rewards are additive, capped per word, then capped by the overall timer.
{
  const tiles = [tile('A', '3LS'), tile('B', '3WS'), tile('C', '2LS'), tile('D', '2WS')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2, 3], 120, 200);
  assert.equal(result.extra, 10);
  assert.equal(result.amplifierSeconds, 5);
  assert.equal(result.requested, 17);
  assert.equal(result.wordCap, 15);
  assert.equal(result.added, 15);
  assert.equal(result.newSecondsLeft, 135);
}
{
  const tiles = [tile('A'), tile('B'), tile('C'), tile('D'), tile('E'), tile('F'), tile('G')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2, 3, 4, 5, 6], 195, 200);
  assert.equal(result.cappedRequested, 22);
  assert.equal(result.added, 5);
  assert.equal(result.newSecondsLeft, 200);
}
{
  const tiles = [tile('A'), tile('B'), tile('C')];
  const result = rules.calculateTimeAward(tiles, [0, 1, 2], 200, 200);
  assert.equal(result.added, 0);
  assert.equal(result.newSecondsLeft, 200);
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
