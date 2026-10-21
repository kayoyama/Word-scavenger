/* Pure board transformations and round-summary calculations for Word Scavenger.
 * Shared by the browser game and deterministic regression tests.
 */
(function attachWordGameLogic(root) {
  'use strict';

  function rotateClockwise(items, size) {
    if (!Array.isArray(items) || items.length !== size * size) throw new TypeError('Board must be a square array');
    const rotated = new Array(items.length);
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        rotated[row * size + col] = items[(size - 1 - col) * size + row];
      }
    }
    return rotated;
  }

  function withRandomizedLetter(tile, letter) {
    if (!tile || typeof tile !== 'object' || typeof letter !== 'string' || letter.length !== 1) {
      throw new TypeError('Randomize requires a tile object and one replacement letter');
    }
    return { ...tile, letter };
  }

  function swapTiles(items, firstIndex, secondIndex) {
    if (!Array.isArray(items) || !Number.isInteger(firstIndex) || !Number.isInteger(secondIndex) ||
        firstIndex < 0 || secondIndex < 0 || firstIndex >= items.length || secondIndex >= items.length || firstIndex === secondIndex) {
      throw new RangeError('Swap requires two different valid tile indices');
    }
    const swapped = items.slice();
    [swapped[firstIndex], swapped[secondIndex]] = [swapped[secondIndex], swapped[firstIndex]];
    return swapped;
  }

  function bombClearAndGravity(items, size, row, col, createTile) {
    if (!Array.isArray(items) || items.length !== size * size || !Number.isInteger(row) || !Number.isInteger(col) ||
        row < 0 || col < 0 || row >= size - 1 || col >= size - 1 || typeof createTile !== 'function') {
      throw new RangeError('Bomb requires a valid 2×2 target and tile factory');
    }
    const next = items.slice();
    const movedTiles = new Set();
    const newTiles = new Set();
    [col, col + 1].forEach((column) => {
      const originalColumn = Array.from({ length: size }, (_, r) => items[r * size + column]);
      const nextColumn = originalColumn.slice();
      for (let r = 0; r < row; r += 1) {
        nextColumn[r] = createTile();
        newTiles.add(nextColumn[r]);
      }
      for (let offset = 0; offset < 2; offset += 1) {
        const destinationRow = row + offset;
        const sourceRow = destinationRow - 2;
        if (sourceRow >= 0) {
          nextColumn[destinationRow] = originalColumn[sourceRow];
          movedTiles.add(originalColumn[sourceRow]);
        } else {
          nextColumn[destinationRow] = createTile();
          newTiles.add(nextColumn[destinationRow]);
        }
      }
      for (let r = row + 2; r < size; r += 1) nextColumn[r] = originalColumn[r];
      for (let r = 0; r < size; r += 1) next[r * size + column] = nextColumn[r];
    });
    return { tiles: next, movedTiles, newTiles, clearedIndices: [row * size + col, row * size + col + 1, (row + 1) * size + col, (row + 1) * size + col + 1] };
  }

  function summarizeRound(round) {
    const wordsFound = Math.max(0, Number(round.wordsFound) || 0);
    const finalScore = Number(round.finalScore) || 0;
    return {
      finalScore,
      wordsFound,
      longestWord: typeof round.longestWord === 'string' ? round.longestWord : '',
      highestWord: typeof round.highestWord === 'string' ? round.highestWord : '',
      highestWordScore: Number(round.highestWordScore) || 0,
      averagePointsPerWord: wordsFound ? finalScore / wordsFound : 0,
      highestCombo: Math.max(0, Number(round.highestCombo) || 0),
      timeBonusSeconds: Math.max(0, Number(round.timeBonusSeconds) || 0),
      wordAndTileScore: Number(round.wordAndTileScore) || 0,
      amplifierBonus: Number(round.amplifierBonus) || 0,
      comboBonus: Number(round.comboBonus) || 0
    };
  }

  root.WordGameLogic = Object.freeze({ rotateClockwise, withRandomizedLetter, swapTiles, bombClearAndGravity, summarizeRound });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WordGameLogic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
