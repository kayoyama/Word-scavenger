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

  // Return the source index that lands at a destination after a clockwise rotation.
  function rotateClockwiseSourceIndex(destinationIndex, size) {
    if (!Number.isInteger(size) || size < 1 || !Number.isInteger(destinationIndex) || destinationIndex < 0 || destinationIndex >= size * size) {
      throw new RangeError('Rotation destination must be a valid board index');
    }
    const row = Math.floor(destinationIndex / size);
    const col = destinationIndex % size;
    return (size - 1 - col) * size + row;
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
    const sourceByDestination = new Map();
    // Destination-indexed movement plan is independent of tile object identity.
    // sourceIndex is null for newly generated tiles entering from above.
    const movementPlan = new Map();
    const clearedIndices = [
      row * size + col, row * size + col + 1,
      (row + 1) * size + col, (row + 1) * size + col + 1
    ];

    // Cascade only the area above the explosion. Rows below the 2×2 target
    // remain exactly where they are, with their original tile objects/metadata.
    // Two fresh rows enter at the top; existing tiles above fall down two rows.
    [col, col + 1].forEach((column) => {
      for (let destinationRow = 0; destinationRow <= row + 1; destinationRow += 1) {
        const destinationIndex = destinationRow * size + column;
        const sourceRow = destinationRow - 2;
        if (sourceRow >= 0) {
          const sourceIndex = sourceRow * size + column;
          const tile = items[sourceIndex];
          next[destinationIndex] = tile;
          sourceByDestination.set(destinationIndex, sourceIndex);
          movementPlan.set(destinationIndex, { sourceIndex, isNew: false, tile });
          if (sourceIndex !== destinationIndex) movedTiles.add(tile);
        } else {
          const tile = createTile();
          next[destinationIndex] = tile;
          movementPlan.set(destinationIndex, { sourceIndex: null, isNew: true, tile });
          newTiles.add(tile);
        }
      }
    });
    return { tiles: next, movedTiles, newTiles, clearedIndices, sourceByDestination, movementPlan };
  }

  function resolveBombLandingBonuses(tiles, landingIndices, explodedBonuses) {
    if (!Array.isArray(tiles) || !Array.isArray(landingIndices) || !(explodedBonuses instanceof Map)) {
      throw new TypeError('Bomb bonus resolution requires tiles, landing indices, and exploded bonuses');
    }
    const rank = { NO: 0, '2LS': 1, '3LS': 2, '2WS': 3, '3WS': 4 };
    const transitions = new Map();
    landingIndices.forEach((index) => {
      const tile = tiles[index];
      if (!tile) return;
      const incomingBonus = tile.bonus || 'NO';
      const explodedBonus = explodedBonuses.get(index) || 'NO';
      const winningBonus = (rank[incomingBonus] || 0) >= (rank[explodedBonus] || 0)
        ? incomingBonus
        : explodedBonus;
      if (winningBonus !== incomingBonus) {
        // Mutate only the bonus field so tile identity and the random letter survive.
        tile.bonus = winningBonus;
        transitions.set(index, incomingBonus);
      }
    });
    return transitions;
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

  root.WordGameLogic = Object.freeze({ rotateClockwise, rotateClockwiseSourceIndex, withRandomizedLetter, swapTiles, bombClearAndGravity, resolveBombLandingBonuses, summarizeRound });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WordGameLogic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
