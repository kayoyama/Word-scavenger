/* Authoritative Word Scavenger scoring, timer, and combo calculations.
 * Pure functions are shared by the browser game and deterministic Node tests.
 */
(function attachWordScoringRules(root) {
  'use strict';

  const AMPLIFIER_MULTIPLIERS = Object.freeze({ 3: 1, 4: 1.25, 5: 1.5, 6: 1.75, 7: 2 });
  const AMPLIFIER_TIME_SECONDS = Object.freeze({ 3: 0, 4: 5, 5: 10, 6: 15, 7: 20 });
  const PER_WORD_TIME_CAPS = Object.freeze({ 3: 10, 4: 15, 5: 20, 6: 25, 7: 30 });
  const BONUS_TIME_SECONDS = Object.freeze({ NO: 0, '2LS': 2, '3LS': 3, '2WS': 2, '3WS': 3 });

  function tierForLength(length) {
    return Math.min(7, Math.max(3, Number(length) || 0));
  }

  function amplifierMultiplier(length) {
    return length < 3 ? 1 : AMPLIFIER_MULTIPLIERS[tierForLength(length)] || 1;
  }

  function calculateWordScore(tiles, indices, letterPoints) {
    let letterScore = 0;
    let wordMultiplier = 1;
    indices.forEach((index) => {
      const tile = tiles[index];
      const points = letterPoints[tile.letter.charCodeAt(0) - 64] || 0;
      if (tile.bonus === '2LS') letterScore += points * 2;
      else if (tile.bonus === '3LS') letterScore += points * 3;
      else letterScore += points;
      if (tile.bonus === '2WS') wordMultiplier *= 2;
      else if (tile.bonus === '3WS') wordMultiplier *= 3;
    });
    const baseTotal = letterScore * wordMultiplier;
    const multiplier = amplifierMultiplier(indices.length);
    const total = Math.round(baseTotal * multiplier);
    return {
      base: letterScore,
      multiplier: wordMultiplier,
      baseTotal,
      amplifierMultiplier: multiplier,
      amplifierBonus: total - baseTotal,
      total
    };
  }

  function calculateTimeAward(tiles, indices, secondsLeft, maxTimeSeconds) {
    const extra = indices.reduce((sum, index) => sum + (BONUS_TIME_SECONDS[tiles[index].bonus] || 0), 0);
    const tier = tierForLength(indices.length);
    const amplifierSeconds = indices.length < 3 ? 0 : (AMPLIFIER_TIME_SECONDS[tier] || 0);
    const requested = 2 + extra + amplifierSeconds;
    const wordCap = indices.length < 3 ? 0 : (PER_WORD_TIME_CAPS[tier] || 30);
    const cappedRequested = Math.min(requested, wordCap);
    const added = Math.max(0, Math.min(cappedRequested, maxTimeSeconds - secondsLeft));
    return { extra, amplifierSeconds, requested, wordCap, cappedRequested, added, newSecondsLeft: secondsLeft + added };
  }

  function calculateComboTransition(level, deadline, now, windowMs, maxSeconds) {
    const active = level > 0 && now < deadline;
    const nextLevel = active ? level + 1 : 1;
    let rewardSeconds = 0;
    let rewardPoints = 0;
    if (nextLevel === 2) { rewardSeconds = 3; rewardPoints = 100; }
    else if (nextLevel === 3) { rewardSeconds = 4; rewardPoints = 300; }
    else if (nextLevel >= 4) { rewardSeconds = 5; rewardPoints = 500; }

    const nextDeadline = !active
      ? now + windowMs
      : Math.min(now + maxSeconds * 1000, deadline + rewardSeconds * 1000);
    return {
      level: nextLevel,
      deadline: nextDeadline,
      rewardSeconds,
      requestedReward: rewardSeconds,
      rewardPoints,
      secondsRemaining: Math.min(maxSeconds, Math.max(0, Math.ceil((nextDeadline - now) / 1000)))
    };
  }

  function qualifiesForLongWordCharge(wordLength, threshold) {
    return Number(wordLength) >= Number(threshold);
  }

  const api = Object.freeze({
    AMPLIFIER_MULTIPLIERS,
    AMPLIFIER_TIME_SECONDS,
    PER_WORD_TIME_CAPS,
    BONUS_TIME_SECONDS,
    calculateWordScore,
    calculateTimeAward,
    calculateComboTransition,
    qualifiesForLongWordCharge
  });
  root.WordScoringRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
