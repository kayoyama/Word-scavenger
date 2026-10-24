/* Marble Bag engine for Word Scavenger.
 * Keeps bag generation separate from rendering, animation, and tile transformations.
 * Bags are in-memory, draw without replacement, and replenish independently on demand.
 */
(function attachWordMarbleBag(root) {
  'use strict';

  const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
  const VOWEL_COUNTS = Object.freeze({ A: 19, E: 31, I: 16, O: 19, U: 11 });
  const COMMON_COUNTS = Object.freeze({ T: 20, R: 17, N: 17, S: 13, L: 10, G: 10, D: 8, C: 8, M: 8, H: 7 });
  const UNCOMMON_COUNTS = Object.freeze({ P: 5, B: 5, F: 5, W: 5, Y: 5, V: 4, K: 2, Q: 2, J: 1, X: 1, Z: 1 });
  const BONUS_COUNTS = Object.freeze({ '2LS': 25, '3LS': 20, '2WS': 18, '3WS': 12 });
  const BONUS_TYPES = Object.freeze(['2LS', '3LS', '2WS', '3WS']);
  const LETTER_MIN_VOWELS = 8;
  const LETTER_MAX_VOWELS = 12;
  const MIN_UNCOMMON_CONSONANTS = 2;
  const MAX_UNCOMMON_CONSONANTS = 5;
  // Initial tolerance: 20%-40% bonus tiles on a 25-tile board (5-10 bonuses).
  // This is configurable here and should be tuned from gameplay simulations later.
  const MIN_BONUS_TILES = 5;
  const MAX_BONUS_TILES = 10;
  const MAX_LETTER_COPIES = 4;

  function makeEntries(counts) {
    const entries = [];
    Object.entries(counts).forEach(([value, count]) => {
      for (let i = 0; i < count; i += 1) entries.push(value);
    });
    return entries;
  }

  function shuffle(entries, random) {
    for (let i = entries.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    return entries;
  }

  function createBag(name, makeEntriesFn, random) {
    return {
      name,
      makeEntries: makeEntriesFn,
      entries: [],
      draws: 0,
      replenishments: 0,
      refill() {
        this.entries = shuffle(this.makeEntries(), random);
        this.replenishments += 1;
      },
      draw() {
        if (this.entries.length === 0) this.refill();
        this.draws += 1;
        return this.entries.pop();
      },
      insert(value) {
        if (this.entries.length === 0) this.refill();
        const index = Math.floor(random() * (this.entries.length + 1));
        this.entries.splice(index, 0, value);
      }
    };
  }

  function countFromBag(bag) {
    return bag.entries.length;
  }

  function createEngine(options = {}) {
    const random = typeof options.random === 'function' ? options.random : Math.random;
    let bags;
    let lastDraw = { letter: null, bonus: null };

    function reset() {
      lastDraw = { letter: null, bonus: null };
      bags = {
        letterCategory: createBag('letterCategory', () => [
          ...Array(38).fill('V'), ...Array(62).fill('C')
        ], random),
        vowelLetters: createBag('vowelLetters', () => makeEntries(VOWEL_COUNTS), random),
        consonantGroup: createBag('consonantGroup', () => [
          ...Array(118).fill('common'), ...Array(36).fill('uncommon')
        ], random),
        commonLetters: createBag('commonLetters', () => makeEntries(COMMON_COUNTS), random),
        uncommonLetters: createBag('uncommonLetters', () => makeEntries(UNCOMMON_COUNTS), random),
        bonusCategory: createBag('bonusCategory', () => [
          ...Array(70).fill('NO'), ...Array(30).fill('BONUS')
        ], random),
        normalTiles: createBag('normalTiles', () => Array(175).fill('NO'), random),
        bonusTypes: createBag('bonusTypes', () => makeEntries(BONUS_COUNTS), random)
      };
      // Build each pool at round start so the initial state is deterministic in size.
      Object.values(bags).forEach((bag) => bag.refill());
    }

    function boardInfo(board, targetIndex) {
      const safeBoard = Array.isArray(board) ? board : [];
      const metrics = {
        vowels: 0, consonants: 0, uncommon: 0, bonus: 0, normal: 0,
        emptyAfterDraw: 0, occupied: 0, letterCounts: Object.create(null)
      };
      safeBoard.forEach((tile, index) => {
        if (index === targetIndex) return; // target tile is being replaced/created
        if (!tile) {
          metrics.emptyAfterDraw += 1;
          return;
        }
        metrics.occupied += 1;
        const letter = String(tile.letter || '').toUpperCase();
        if (!tile.isWildLetter && /^[A-Z]$/.test(letter)) metrics.letterCounts[letter] = (metrics.letterCounts[letter] || 0) + 1;
        if (VOWELS.has(letter)) metrics.vowels += 1;
        else if (/^[A-Z]$/.test(letter)) {
          metrics.consonants += 1;
          if (Object.prototype.hasOwnProperty.call(UNCOMMON_COUNTS, letter)) metrics.uncommon += 1;
        }
        if (tile.isWildLetter || !tile.bonus || tile.bonus === 'NO') metrics.normal += 1;
        else metrics.bonus += 1;
      });
      return metrics;
    }

    function drawLetter(board, targetIndex) {
      const info = boardInfo(board, targetIndex);
      let category;
      let categorySource = 'category-bag';
      if (info.vowels >= LETTER_MAX_VOWELS) {
        category = 'C'; // forced draw bypasses the top-level category bag
        categorySource = 'board-balance';
      } else if (info.vowels + info.emptyAfterDraw < LETTER_MIN_VOWELS) {
        category = 'V'; // forced draw bypasses the top-level category bag
        categorySource = 'board-balance';
      } else {
        category = bags.letterCategory.draw();
      }

      function drawUnderLetterCap(bag) {
        // Prefer an eligible entry without consuming rejected letters. If every
        // remaining entry would exceed the soft cap, allow a safe fallback draw.
        const eligible = [];
        bag.entries.forEach((value, index) => {
          if ((info.letterCounts[value] || 0) < MAX_LETTER_COPIES) eligible.push(index);
        });
        if (bag.entries.length === 0) bag.refill();
        const refreshedEligible = [];
        bag.entries.forEach((value, index) => {
          if ((info.letterCounts[value] || 0) < MAX_LETTER_COPIES) refreshedEligible.push(index);
        });
        if (refreshedEligible.length) {
          const chosen = refreshedEligible[Math.floor(random() * refreshedEligible.length)];
          bag.draws += 1;
          return { letter: bag.entries.splice(chosen, 1)[0], constrained: false };
        }
        return { letter: bag.draw(), constrained: true };
      }
      if (category === 'V') {
        const draw = drawUnderLetterCap(bags.vowelLetters);
        lastDraw.letter = { category: 'vowel', categorySource, group: null, groupSource: null, letter: draw.letter, letterCapSource: draw.constrained ? 'soft-cap-fallback' : ((info.letterCounts[draw.letter] || 0) >= MAX_LETTER_COPIES - 1 ? 'soft-cap-aware' : 'normal') };
        return draw.letter;
      }

      let group;
      let groupSource = 'consonant-group-selector';
      if (info.uncommon >= MAX_UNCOMMON_CONSONANTS) {
        group = 'common'; // bypass the common/uncommon selector when forced
        groupSource = 'board-balance';
      } else if (info.uncommon < MIN_UNCOMMON_CONSONANTS) {
        group = 'uncommon'; // safeguard applies when a consonant is being generated
        groupSource = 'board-balance';
      } else {
        group = bags.consonantGroup.draw();
      }
      const draw = drawUnderLetterCap(group === 'uncommon' ? bags.uncommonLetters : bags.commonLetters);
      const letter = draw.letter;
      lastDraw.letter = { category: 'consonant', categorySource, group, groupSource, letter, letterCapSource: draw.constrained ? 'soft-cap-fallback' : ((info.letterCounts[letter] || 0) >= MAX_LETTER_COPIES - 1 ? 'soft-cap-aware' : 'normal') };
      return letter;
    }

    function drawBonus(board, targetIndex) {
      const info = boardInfo(board, targetIndex);
      let category;
      let categorySource = 'bonus-category-bag';
      if (info.bonus >= MAX_BONUS_TILES) {
        category = 'NO'; // forced draw bypasses the top-level bonus category bag
        categorySource = 'board-balance';
      } else if (info.bonus + info.emptyAfterDraw < MIN_BONUS_TILES) {
        category = 'BONUS'; // forced draw bypasses the top-level bonus category bag
        categorySource = 'board-balance';
      } else {
        category = bags.bonusCategory.draw();
      }
      const type = category === 'NO' ? bags.normalTiles.draw() : bags.bonusTypes.draw();
      lastDraw.bonus = {
        category: category === 'NO' ? 'normal' : 'bonus',
        categorySource,
        type,
        typeSource: category === 'NO' ? 'normal-tile-bag' : 'bonus-type-bag'
      };
      return type;
    }

    function generateTile(board, targetIndex, tileOptions = {}) {
      lastDraw = { letter: null, bonus: null };
      const letter = drawLetter(board, targetIndex);
      let bonus;
      if (Object.prototype.hasOwnProperty.call(tileOptions, 'bonusOverride')) {
        bonus = tileOptions.bonusOverride;
        lastDraw.bonus = {
          category: bonus === 'NO' ? 'normal' : 'bonus',
          categorySource: 'Long Word Bonus override',
          type: bonus,
          typeSource: 'weighted assignment; no bag draw'
        };
      } else {
        bonus = drawBonus(board, targetIndex);
      }
      return { letter, bonus };
    }

    function returnLetter(letter) {
      const value = String(letter || '').toUpperCase();
      if (VOWELS.has(value)) bags.vowelLetters.insert(value);
      else if (Object.prototype.hasOwnProperty.call(COMMON_COUNTS, value)) bags.commonLetters.insert(value);
      else if (Object.prototype.hasOwnProperty.call(UNCOMMON_COUNTS, value)) bags.uncommonLetters.insert(value);
      else throw new TypeError(`Cannot return unknown letter to Marble Bag: ${value}`);
    }

    function previewLetter() {
      // Used only for transient Randomize animation frames; it does not consume a bag entry.
      const entries = makeEntries({ ...VOWEL_COUNTS, ...COMMON_COUNTS, ...UNCOMMON_COUNTS });
      return entries[Math.floor(random() * entries.length)];
    }

    function weightedBonus() {
      // Weighted selection with replacement; does not draw from or mutate the bonus bags.
      const roll = Math.floor(random() * 75);
      if (roll < 25) return '2LS';
      if (roll < 45) return '3LS';
      if (roll < 63) return '2WS';
      return '3WS';
    }

    function upgradeBonus(currentBonus) {
      if (!currentBonus || currentBonus === 'NO') return weightedBonus();
      if (currentBonus === '2LS') return '3LS';
      if (currentBonus === '3LS') return '3LS';
      if (currentBonus === '2WS') return '3WS';
      if (currentBonus === '3WS') return '3WS';
      return currentBonus;
    }

    function getState() {
      const state = {};
      Object.entries(bags).forEach(([key, bag]) => {
        state[key] = {
          remaining: countFromBag(bag),
          size: bag.makeEntries().length,
          draws: bag.draws,
          replenishments: bag.replenishments
        };
      });
      return state;
    }

    function getLastDraw() {
      return { letter: lastDraw.letter ? { ...lastDraw.letter } : null, bonus: lastDraw.bonus ? { ...lastDraw.bonus } : null };
    }

    // Read-only live diagnostic snapshot. Copies arrays so callers cannot mutate the active bags.
    function getContents() {
      const result = {};
      Object.entries(bags).forEach(([key, bag]) => {
        const remaining = bag.entries.slice();
        const frequencies = {};
        remaining.forEach((entry) => { frequencies[entry] = (frequencies[entry] || 0) + 1; });
        result[key] = { remaining: remaining.length, size: bag.makeEntries().length, entries: remaining, frequencies, draws: bag.draws, replenishments: bag.replenishments };
      });
      return result;
    }

    reset();
    return Object.freeze({ reset, drawLetter, drawBonus, generateTile, returnLetter, previewLetter, weightedBonus, upgradeBonus, getState, getLastDraw, getContents });
  }

  root.WordMarbleBag = Object.freeze({ createEngine, constants: Object.freeze({
    VOWEL_COUNTS, COMMON_COUNTS, UNCOMMON_COUNTS, BONUS_COUNTS,
    LETTER_MIN_VOWELS, LETTER_MAX_VOWELS, MIN_UNCOMMON_CONSONANTS, MAX_UNCOMMON_CONSONANTS,
    MIN_BONUS_TILES, MAX_BONUS_TILES, MAX_LETTER_COPIES
  }) });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WordMarbleBag;
})(typeof globalThis !== 'undefined' ? globalThis : this);
