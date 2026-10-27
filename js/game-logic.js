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
    const movementPlan = new Map();
    const targetIndices = [
      row * size + col, row * size + col + 1,
      (row + 1) * size + col, (row + 1) * size + col + 1
    ];
    const targetSet = new Set(targetIndices);
    const clearedIndices = targetIndices.filter((index) => !items[index]?.isAnchored);
    clearedIndices.forEach((index) => { next[index] = null; });
    // Clear every unanchored destination in both affected columns before generating
    // any replacements, so each Marble Bag draw sees one coherent projected board.
    [col, col + 1].forEach((column) => {
      for (let r = 0; r <= row + 1; r += 1) {
        const index = r * size + column;
        if (!items[index]?.isAnchored) next[index] = null;
      }
    });

    // Chain protects individual tiles, not columns or regions. Keep each chained
    // tile fixed, but let every unchained tile in the affected columns fall through
    // the remaining unchained slots, even when that means passing a fixed Chain
    // tile. Generate replacements only for the topmost unchained vacancies after
    // all available unchained tiles have cascaded down.
    [col, col + 1].forEach((column) => {
      const affectedIndices = Array.from({ length: row + 2 }, (_, r) => r * size + column);
      const anchoredIndices = affectedIndices.filter((index) => items[index]?.isAnchored);
      anchoredIndices.forEach((index) => {
        next[index] = items[index];
        movementPlan.set(index, { sourceIndex: index, isNew: false, tile: items[index] });
      });

      const destinationIndices = affectedIndices.filter((index) => !items[index]?.isAnchored);
      destinationIndices.forEach((index) => { next[index] = null; });
      const sourceIndices = affectedIndices.filter((index) => !items[index]?.isAnchored && !targetSet.has(index));
      let sourceCursor = sourceIndices.length - 1;
      const newDestinationIndices = [];
      for (let destinationCursor = destinationIndices.length - 1; destinationCursor >= 0; destinationCursor -= 1) {
        const destinationIndex = destinationIndices[destinationCursor];
        if (sourceCursor >= 0) {
          const sourceIndex = sourceIndices[sourceCursor--];
          const tile = items[sourceIndex];
          next[destinationIndex] = tile;
          sourceByDestination.set(destinationIndex, sourceIndex);
          movementPlan.set(destinationIndex, { sourceIndex, isNew: false, tile });
          if (sourceIndex !== destinationIndex) movedTiles.add(tile);
        } else {
          newDestinationIndices.push(destinationIndex);
        }
      }
      // Create fresh letters in top-to-bottom order for stable, predictable IDs.
      newDestinationIndices.sort((a, b) => a - b).forEach((destinationIndex) => {
        const tile = createTile(destinationIndex, next);
        next[destinationIndex] = tile;
        movementPlan.set(destinationIndex, { sourceIndex: null, isNew: true, tile });
        newTiles.add(tile);
      });
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
      if (!tile || tile.isWildLetter || tile.isAnchored) return;
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

  // Resolve a pointer sample against cached tile rectangles. Expanded hit regions are
  // deliberately bounded and candidates must continue the current 8-neighbor path
  // (or be an earlier selected tile for deliberate backtracking).
  function resolveTrajectoryTileIndex(
    rects,
    x,
    y,
    previousIndex = -1,
    selectedIndices = [],
    expansionRatio = 0,
    boardSize = 5,
    directionX = 0,
    directionY = 0
  ) {
    if (!Array.isArray(rects) || !Number.isFinite(x) || !Number.isFinite(y)) return -1;

    const selected = new Set(Array.isArray(selectedIndices) ? selectedIndices : []);
    const ratio = Math.max(-0.08, Math.min(0.16, Number(expansionRatio) || 0));
    const directionLength = Math.hypot(directionX, directionY);
    const dirX = directionLength > 0 ? directionX / directionLength : 0;
    const dirY = directionLength > 0 ? directionY / directionLength : 0;
    const previousRect = Number.isInteger(previousIndex) ? rects[previousIndex] : null;
    const previousCenterX = previousRect ? previousRect.left + previousRect.width / 2 : x;
    const previousCenterY = previousRect ? previousRect.top + previousRect.height / 2 : y;

    const isAllowed = (index) => {
      if (previousIndex < 0 || index === previousIndex || selected.has(index)) return true;
      const rowDistance = Math.abs(Math.floor(index / boardSize) - Math.floor(previousIndex / boardSize));
      const colDistance = Math.abs((index % boardSize) - (previousIndex % boardSize));
      return rowDistance <= 1 && colDistance <= 1 && rowDistance + colDistance > 0;
    };

    let bestIndex = -1;
    let bestScore = Infinity;

    rects.forEach((rect, index) => {
      if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) ||
          !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || !isAllowed(index)) return;

      // Signed adjustment: positive expands the virtual target; negative contracts it.
      // Keep the adjustment bounded so the test slider cannot invert a tile's bounds.
      const pad = Math.min(rect.width, rect.height) * ratio;
      const left = rect.left - pad;
      const right = rect.right + pad;
      const top = rect.top - pad;
      const bottom = rect.bottom + pad;
      if (left > right || top > bottom || x < left || x > right || y < top || y > bottom) return;

      const insideEffectiveRect = x >= left && x <= right && y >= top && y <= bottom;
      const insideVisibleRect = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      // When expansion is positive, clip only the outer corners of the added region.
      // A negative adjustment instead contracts the actual selectable rectangle.
      if (ratio > 0 && !insideVisibleRect) {
        const outsideX = x < rect.left ? rect.left - x : (x > rect.right ? x - rect.right : 0);
        const outsideY = y < rect.top ? rect.top - y : (y > rect.bottom ? y - rect.bottom : 0);
        const cornerCut = Math.min(rect.width, rect.height) * 0.06;
        if (outsideX > 0 && outsideY > 0 && outsideX + outsideY > pad + cornerCut) return;
      }

      const dx = x < left ? left - x : (x > right ? x - right : 0);
      const dy = y < top ? top - y : (y > bottom ? y - bottom : 0);
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      const centerDx = x - centerX;
      const centerDy = y - centerY;
      const distanceScore = (dx * dx + dy * dy) * 1000 + centerDx * centerDx + centerDy * centerDy;

      // Direction is a tie-breaker for competing expanded regions, not a replacement
      // for proximity. It is derived from the current pointer-event trajectory.
      const moveX = centerX - previousCenterX;
      const moveY = centerY - previousCenterY;
      const moveLength = Math.hypot(moveX, moveY);
      const alignment = previousRect && moveLength > 0 && directionLength > 0
        ? (moveX * dirX + moveY * dirY) / moveLength
        : 0;
      const score = distanceScore - (insideVisibleRect ? 1000000 : alignment * 20);
      if (score < bestScore ||
          (score === bestScore && bestIndex === previousIndex && index !== previousIndex)) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
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

  root.WordGameLogic = Object.freeze({ rotateClockwise, rotateClockwiseSourceIndex, withRandomizedLetter, swapTiles, bombClearAndGravity, resolveBombLandingBonuses, resolveTrajectoryTileIndex, summarizeRound });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WordGameLogic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
