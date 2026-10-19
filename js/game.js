/* Browser rebuild of the recovered Word Scavenger game.
   Core rules retained: 5x5 board, weighted letters, 2-minute rounds,
   original letter values and bonus-square distribution, dictionary validation,
   and replacement of the tiles used in a valid word. */
(() => {
  'use strict';

  const ROUND_SECONDS = 120;
  const MAX_TIME_SECONDS = 180;
  const CHRONO_COMBO_WINDOW_MS = 5000;
  const SIZE = 5;
  const WORD_AMPLIFIER_MIN_LENGTH = 5;
  const WORD_AMPLIFIER_MULTIPLIER = 1.5;
  const WORD_AMPLIFIER_HIGH_LENGTH = 7;
  const WORD_AMPLIFIER_HIGH_MULTIPLIER = 2;
  const STORAGE_KEY = 'wordScavengerBrowserStats';
  const BONUS_CLASSES = {
    NO: '', '2LS': 'bonus-2ls', '3LS': 'bonus-3ls',
    '2WS': 'bonus-2ws', '3WS': 'bonus-3ws'
  };
  const LETTER_POINTS = [0, 16, 34, 32, 23, 14, 42, 24, 41, 16, 81, 52, 22, 32, 19, 18, 34, 102, 19, 22, 19, 22, 45, 42, 82, 42, 101];

  const el = (id) => document.getElementById(id);
  const frontScreen = el('front-screen');
  const statsScreen = el('stats-screen');
  const gameScreen = el('game-screen');
  const board = el('board');
  const selectionTrace = el('selection-trace');
  const boardStage = board ? board.closest('.board-stage') : null;
  let pointerTracePoints = [];
  const wordlistSet = new Set(Array.isArray(window.wordlist) ? window.wordlist : []);

  let tiles = [];
  let selectedIndices = [];
  let isSelecting = false;
  let roundActive = false;
  let actionBusy = false;
  let rotateCharges = 0;
  let randomizeCharges = 0;
  let randomizeWordProgress = 0;
  let randomizeMode = false;
  let secondsLeft = ROUND_SECONDS;
  let timerId = null;
  let countdownId = null;
  const refillTimers = new Set();
  const lockedTileIndices = new Set();
  let refillToken = 0;
  let lastPointerX = null;
  let lastPointerY = null;
  let totalScore = 0;
  let lastScore = 0;
  let sessionWords = 0;
  let sessionLongestWord = '';
  let sessionHighestWord = '';
  let sessionHighestWordScore = 0;
  let sessionTimeBonus = 0;
  let sessionWordAndTileScore = 0;
  let sessionAmplifierBonus = 0;
  let sessionComboBonus = 0;
  let sessionHighestCombo = 0;
  let roundMilestones = [];
  let timeBonusTimeout = null;
  let feedbackTimeout = null;
  let scoreGainTimeout = null;
  let chronoComboLevel = 0;
  let chronoComboDeadline = 0;
  let chronoComboIntervalId = null;
  let chronoComboClearTimeout = null;
  let chronoComboIndicator = null;
  let stats = readStats();
  let letterBag = [];
  let bonusBag = [];

  // Add the combo indicator dynamically so Phase 3 only requires replacing game.js.
  function installChronoComboUI() {
    const comboSlot = el('combo-slot');
    if (!comboSlot || document.getElementById('chrono-combo')) return;

    const style = document.createElement('style');
    style.textContent = `
      .chrono-combo { position: absolute; z-index: 7; left: 50%; top: -18px; transform: translateX(-50%); display: block; min-width: 142px; padding: 5px 12px 6px; border: 1px solid rgba(111,239,255,.92); border-radius: 999px; background: rgba(0,49,70,.94); box-shadow: 0 0 10px rgba(39,220,255,.45), inset 0 0 6px rgba(255,255,255,.10); color: #e9fdff; font-size: 11px; font-weight: 1000; line-height: 1.15; letter-spacing: .045em; text-align: center; white-space: nowrap; opacity: 1; transition: color .15s ease, box-shadow .15s ease; pointer-events: none; }
      .chrono-combo[hidden] { display: none !important; }
      .chrono-combo.chrono-combo-active { animation: combo-energy .45s ease-out; }
      .chrono-combo.chrono-combo-hot { color: #fff3a0; border-color: #fff18b; background: linear-gradient(135deg, #5b2b00, #c46b00 55%, #5b2b00); box-shadow: 0 0 16px rgba(255,197,54,.95), inset 0 0 8px rgba(255,255,255,.2); }
      .chrono-combo.chrono-combo-expired { color: #ffe2dc; border-color: #ff9385; background: linear-gradient(135deg, #541c2a, #a43b45); animation: chrono-combo-expired .35s ease-out; }
      @keyframes combo-energy { 0% { opacity: .5; filter: brightness(1.8); transform: scale(.72); } 70% { opacity: 1; transform: scale(1.12); } 100% { transform: scale(1); } }
      @keyframes chrono-combo-expired { 0% { filter: brightness(1.7); transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: .85; } }
      .score-gain.amplifier-burst { color: #fff2a0 !important; text-shadow: 0 0 5px #ffb000, 0 0 12px #ff5e00; }
      .score-gain.combo-burst { color: #bafaff !important; text-shadow: 0 0 5px #00d9ff, 0 0 13px #168cff; }
      .score-gain.amplifier-burst.combo-burst { color: #fff4bd !important; text-shadow: 0 0 6px #ffd84d, 0 0 13px #ff7b00, 0 0 20px #00d9ff; }
      .score-gain.amplifier-burst.score-gain-show { animation: reward-amplifier-pop 1.15s ease-out both; }
      .score-gain.combo-burst.score-gain-show { animation: reward-combo-pop 1.15s cubic-bezier(.2,.8,.2,1) both; }
      .score-gain.amplifier-burst.combo-burst.score-gain-show { animation: reward-combined-pop 1.2s ease-out both; }
      @keyframes reward-amplifier-pop { 0% { opacity: 0; transform: translateY(8px) scale(.55) rotate(-2deg); } 18% { opacity: 1; transform: translateY(-4px) scale(1.28) rotate(1deg); } 35% { transform: translateY(0) scale(.96); } 55% { transform: scale(1.12); } 100% { opacity: 0; transform: translateY(-10px) scale(1); } }
      @keyframes reward-combo-pop { 0% { opacity: 0; transform: translateY(8px) scale(.6); } 20% { opacity: 1; transform: translateY(-4px) scale(1.3); } 45% { transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-10px) scale(1.08); } }
      @keyframes reward-combined-pop { 0% { opacity: 0; transform: translateY(8px) scale(.5) rotate(-3deg); } 20% { opacity: 1; transform: translateY(-5px) scale(1.35) rotate(2deg); } 42% { transform: translateY(0) scale(1.05) rotate(0); } 62% { transform: scale(1.18); } 100% { opacity: 0; transform: translateY(-12px) scale(1); } }
      @media (prefers-reduced-motion: reduce) { .chrono-combo { transition: none; animation: none !important; } .score-gain.amplifier-burst.score-gain-show, .score-gain.combo-burst.score-gain-show { animation-duration: .01ms !important; } .chrono-combo.chrono-combo-expired { animation: none; } }
    `;
    document.head.appendChild(style);

    chronoComboIndicator = document.createElement('span');
    chronoComboIndicator.id = 'chrono-combo';
    chronoComboIndicator.className = 'chrono-combo';
    chronoComboIndicator.setAttribute('aria-live', 'polite');
    chronoComboIndicator.hidden = true;
    // Anchor the compact label to the board frame so it never occupies layout space.
    (boardStage || comboSlot).appendChild(chronoComboIndicator);
  }

  function readStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        bestScore: Number(saved.bestScore) || 0,
        gamesPlayed: Number(saved.gamesPlayed) || 0,
        wordsFound: Number(saved.wordsFound) || 0,
        wordCounts: saved.wordCounts && typeof saved.wordCounts === 'object' ? saved.wordCounts : {},
        bestLongestWord: typeof saved.bestLongestWord === 'string' ? saved.bestLongestWord : '',
        bestLongestLength: Number(saved.bestLongestLength) || 0,
        bestWord: typeof saved.bestWord === 'string' ? saved.bestWord : '',
        bestWordScore: Number(saved.bestWordScore) || 0,
        bestWordsInRound: Number(saved.bestWordsInRound) || (Array.isArray(saved.rounds) ? saved.rounds.reduce((best, round) => Math.max(best, Number(round.wordsFound) || 0), 0) : 0),
        totalScoreAccumulated: Number(saved.totalScoreAccumulated) || (Array.isArray(saved.rounds) ? saved.rounds.reduce((sum, round) => sum + (Number(round.finalScore) || 0), 0) : 0),
        scoreRoundsCount: Number(saved.scoreRoundsCount) || (Array.isArray(saved.rounds) ? saved.rounds.length : 0),
        rounds: Array.isArray(saved.rounds) ? saved.rounds : [],
        tutorialSeen: Boolean(saved.tutorialSeen),
        achievements: saved.achievements && typeof saved.achievements === 'object' ? saved.achievements : {}
      };
    } catch (_) {
      return { bestScore: 0, gamesPlayed: 0, wordsFound: 0, wordCounts: {}, bestLongestWord: '', bestLongestLength: 0, bestWord: '', bestWordScore: 0, bestWordsInRound: 0, totalScoreAccumulated: 0, scoreRoundsCount: 0, rounds: [], tutorialSeen: false, achievements: {} };
    }
  }

  function saveStats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (_) { /* Game remains playable if storage is blocked. */ }
    updateMenuPersonalBest();
  }

  function updateMenuPersonalBest() {
    el('menu-best-score').textContent = Number(stats.bestScore || 0).toLocaleString();
    if (stats.bestScore > 0) {
      const details = [];
      if (stats.bestLongestWord) details.push(`Longest: ${stats.bestLongestWord}`);
      if (stats.bestWord) details.push(`Top word: ${stats.bestWord} (${stats.bestWordScore})`);
      el('menu-best-detail').textContent = details.join(' · ') || 'Your best score so far';
    } else {
      el('menu-best-detail').textContent = 'Play a round to set your record';
    }
  }

  function showScreen(screen) {
    frontScreen.hidden = screen !== 'front';
    statsScreen.hidden = screen !== 'stats';
    gameScreen.hidden = screen !== 'game';
    if (screen !== 'front') el('tutorial-overlay').hidden = true;
  }

  function randomInt(max) { return Math.floor(Math.random() * max) + 1; }

  // Exact weighted letter distribution from the original loadcharset2().
  function makeLetterBag() {
    const counts = {
      A: 16, B: 4, C: 6, D: 8, E: 24, F: 4, G: 5, H: 5, I: 13,
      J: 2, K: 2, L: 7, M: 6, N: 13, O: 15, P: 4, Q: 2, R: 13,
      S: 10, T: 15, U: 7, V: 3, W: 4, X: 2, Y: 4, Z: 2
    };
    letterBag = [];
    Object.entries(counts).forEach(([letter, count]) => {
      for (let i = 0; i < count; i += 1) letterBag.push(letter);
    });
  }

  // Retains the original distribution: 400 NO slots plus 100 bonus slots.
  function makeBonusBag() {
    bonusBag = [];
    const noCount = randomInt(400);
    const remainingNo = 400 - noCount;
    for (let i = 0; i < noCount; i += 1) bonusBag.push('NO');
    for (let i = 0; i < 37; i += 1) bonusBag.push('2LS');
    for (let i = 0; i < 26; i += 1) bonusBag.push('3LS');
    for (let i = 0; i < 22; i += 1) bonusBag.push('2WS');
    for (let i = 0; i < 15; i += 1) bonusBag.push('3WS');
    for (let i = 0; i < remainingNo; i += 1) bonusBag.push('NO');
  }

  function drawLetter() { return letterBag[randomInt(letterBag.length) - 1]; }
  function drawBonus() { return bonusBag[randomInt(bonusBag.length) - 1]; }

  function createTile(index, letter, bonus) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tile ${BONUS_CLASSES[bonus] || ''}`.trim();
    button.dataset.index = String(index);
    button.dataset.letter = letter;
    button.dataset.bonus = bonus;
    button.textContent = letter;
    button.setAttribute('aria-label', `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}, letter ${letter}${bonus === 'NO' ? '' : `, ${bonus}`}`);
    return button;
  }

  function renderActionCharges() {
    const rotateButton = el('rotate-action');
    const randomizeButton = el('randomize-action');
    if (!rotateButton || !randomizeButton) return;
    el('rotate-count').textContent = `${rotateCharges} / 3`;
    el('randomize-count').textContent = `${randomizeCharges} / 1`;
    el('randomize-hint').textContent = randomizeCharges ? 'Choose a tile to change its letter' : `Next charge: ${5 - randomizeWordProgress} correct word${5 - randomizeWordProgress === 1 ? '' : 's'}`;
    rotateButton.disabled = !roundActive || actionBusy || rotateCharges <= 0;
    randomizeButton.disabled = !roundActive || actionBusy || (randomizeCharges <= 0 && !randomizeMode);
    randomizeButton.classList.toggle('action-armed', randomizeMode);
  }

  function grantActionCharges() {
    rotateCharges = Math.min(3, rotateCharges + 1);
    if (randomizeCharges === 0) {
      randomizeWordProgress += 1;
      if (randomizeWordProgress >= 5) {
        randomizeCharges = 1;
        randomizeWordProgress = 0;
      }
    }
    renderActionCharges();
  }

  function setActionsBusy(busy) {
    actionBusy = busy;
    board.classList.toggle('board-actions-locked', busy);
    renderActionCharges();
  }

  // Rotate the complete 5x5 matrix 90 degrees clockwise. Tile objects move intact,
  // so each letter keeps its original bonus type and color. Five tiles flip per batch.
  function rotateBoardClockwise() {
    if (!roundActive || actionBusy || rotateCharges <= 0 || lockedTileIndices.size > 0) return;
    rotateCharges -= 1;
    randomizeMode = false;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    setActionsBusy(true);
    const oldTiles = tiles.slice();
    const rotated = new Array(SIZE * SIZE);
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        rotated[row * SIZE + col] = oldTiles[(SIZE - 1 - col) * SIZE + row];
      }
    }
    const token = refillToken;
    const batchDelay = 145;
    const flipDuration = 180;
    for (let row = 0; row < SIZE; row += 1) {
      const rowStart = row * SIZE;
      scheduleRefillTimer(() => {
        for (let col = 0; col < SIZE; col += 1) {
          const tile = board.querySelector(`[data-index="${rowStart + col}"]`);
          if (tile) tile.classList.add('tile-flip', 'action-tile-flip');
        }
        scheduleRefillTimer(() => {
          tiles = rotated;
          for (let col = 0; col < SIZE; col += 1) updateTileElement(rowStart + col);
        }, 90, token);
        scheduleRefillTimer(() => {
          for (let col = 0; col < SIZE; col += 1) {
            const tile = board.querySelector(`[data-index="${rowStart + col}"]`);
            if (tile) tile.classList.remove('tile-flip', 'action-tile-flip');
          }
        }, flipDuration, token);
      }, row * batchDelay, token);
    }
    scheduleRefillTimer(() => {
      tiles = rotated;
      setActionsBusy(false);
    }, (SIZE - 1) * batchDelay + flipDuration + 10, token);
    renderActionCharges();
  }

  function armRandomize() {
    if (!roundActive || actionBusy || randomizeCharges <= 0 || lockedTileIndices.size > 0) return;
    randomizeMode = !randomizeMode;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    el('word-feedback').textContent = randomizeMode ? 'Tap a tile to randomize its letter' : 'Drag across letters to select them';
    renderActionCharges();
  }

  function randomizeTileLetter(index) {
    if (!randomizeMode || !roundActive || actionBusy || randomizeCharges <= 0 || index < 0 || index >= tiles.length || lockedTileIndices.size > 0) return false;
    randomizeMode = false;
    randomizeCharges = 0;
    randomizeWordProgress = 0;
    setActionsBusy(true);
    const token = refillToken;
    const tileElement = board.querySelector(`[data-index="${index}"]`);
    if (tileElement) tileElement.classList.add('tile-flip', 'action-tile-flip');
    scheduleRefillTimer(() => {
      const oldLetter = tiles[index].letter;
      let newLetter = drawLetter();
      if (letterBag.length > 1) {
        let attempts = 0;
        while (newLetter === oldLetter && attempts < 8) { newLetter = drawLetter(); attempts += 1; }
      }
      tiles[index] = { letter: newLetter, bonus: tiles[index].bonus };
      updateTileElement(index);
      const updated = board.querySelector(`[data-index="${index}"]`);
      if (updated) updated.classList.add('tile-flip', 'action-tile-flip');
    }, 90, token);
    scheduleRefillTimer(() => {
      const updated = board.querySelector(`[data-index="${index}"]`);
      if (updated) updated.classList.remove('tile-flip', 'action-tile-flip');
      setActionsBusy(false);
      el('word-feedback').textContent = 'Drag across letters to select them';
    }, 200, token);
    renderActionCharges();
    return true;
  }

  function renderBoard() {
    board.replaceChildren();
    tiles.forEach((tile, index) => board.appendChild(createTile(index, tile.letter, tile.bonus)));
  }

  function updateTileElement(index) {
    const tileData = tiles[index];
    const tileElement = board.querySelector(`[data-index="${index}"]`);
    if (!tileElement) return;

    Object.values(BONUS_CLASSES).filter(Boolean).forEach((className) => tileElement.classList.remove(className));
    const bonusClass = BONUS_CLASSES[tileData.bonus];
    if (bonusClass) tileElement.classList.add(bonusClass);
    tileElement.dataset.letter = tileData.letter;
    tileElement.dataset.bonus = tileData.bonus;
    tileElement.textContent = tileData.letter;
    tileElement.setAttribute('aria-label', `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}, letter ${tileData.letter}${tileData.bonus === 'NO' ? '' : `, ${tileData.bonus}`}`);
  }

  function scheduleRefillTimer(callback, delay, token) {
    const timer = window.setTimeout(() => {
      refillTimers.delete(timer);
      if (token !== refillToken) return;
      callback();
    }, delay);
    refillTimers.add(timer);
    return timer;
  }

  function cancelRefillSequence() {
    refillToken += 1;
    refillTimers.forEach((timer) => window.clearTimeout(timer));
    refillTimers.clear();
    board.querySelectorAll('.tile-flip, .tile-refill-locked, .bonus-hit').forEach((tile) => {
      tile.classList.remove('tile-flip', 'tile-refill-locked', 'bonus-hit');
    });
    lockedTileIndices.clear();
  }

  // Each consumed tile stays locked until its own flip finishes. Other tiles
  // remain selectable while the replacement sequence is running.
  function runRefillSequence(indices, bonusOverrides = {}) {
    const token = refillToken;
    const flipDurationMs = 180;
    const staggerMs = 55;
    const revealDelayMs = 90;

    indices.forEach((index, position) => {
      const startDelay = position * staggerMs;
      scheduleRefillTimer(() => {
        const tileElement = board.querySelector(`[data-index="${index}"]`);
        if (!tileElement) {
          lockedTileIndices.delete(index);
          return;
        }
        tileElement.classList.add('tile-flip');

        // Reveal the replacement near the midpoint of this tile's flip.
        scheduleRefillTimer(() => {
          tiles[index] = { letter: drawLetter(), bonus: Object.prototype.hasOwnProperty.call(bonusOverrides, index) ? bonusOverrides[index] : drawBonus() };
          updateTileElement(index);
          const updatedElement = board.querySelector(`[data-index="${index}"]`);
          if (updatedElement) updatedElement.classList.add('tile-flip', 'tile-refill-locked');
        }, revealDelayMs, token);

        scheduleRefillTimer(() => {
          const finishedElement = board.querySelector(`[data-index="${index}"]`);
          if (finishedElement) finishedElement.classList.remove('tile-flip', 'tile-refill-locked');
          lockedTileIndices.delete(index);
        }, flipDurationMs, token);
      }, startDelay, token);
    });
  }

  // Long Word Bonus: long valid words create new bonus tiles without replacing letters.
  // Existing bonus tiles, consumed tiles, and temporarily locked tiles are never transform candidates.
  function randomBonusType() {
    return ['2LS', '3LS', '2WS', '3WS'][randomInt(4) - 1];
  }

  function grantLongWordBonuses(wordLength, usedIndices) {
    const rewardCount = wordLength >= 7 ? 3 : (wordLength === 6 ? 2 : (wordLength === 5 ? 1 : 0));
    const refillBonusOverrides = {};
    if (!rewardCount) return refillBonusOverrides;

    const used = new Set(usedIndices);
    const availableOrdinary = () => tiles
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile, index }) => tile.bonus === 'NO' && !used.has(index) && !lockedTileIndices.has(index));
    const availableRefills = usedIndices.filter((index) => !Object.prototype.hasOwnProperty.call(refillBonusOverrides, index));
    let remaining = rewardCount;

    // First reward prefers transforming one existing ordinary tile.
    const firstCandidates = availableOrdinary();
    if (remaining > 0 && firstCandidates.length) {
      const chosen = firstCandidates[randomInt(firstCandidates.length) - 1];
      transformTileIntoBonus(chosen.index, randomBonusType());
      remaining -= 1;
    }

    // The second reward, when present, is assigned to a tile refilled by this word.
    if (remaining > 0 && availableRefills.length) {
      const refillIndex = availableRefills.shift();
      refillBonusOverrides[refillIndex] = randomBonusType();
      remaining -= 1;
    }

    // A third reward prefers another ordinary tile; if none is eligible, use another refill.
    while (remaining > 0) {
      const candidates = availableOrdinary();
      if (candidates.length) {
        const chosen = candidates[randomInt(candidates.length) - 1];
        transformTileIntoBonus(chosen.index, randomBonusType());
        remaining -= 1;
        continue;
      }
      if (availableRefills.length) {
        const refillIndex = availableRefills.shift();
        refillBonusOverrides[refillIndex] = randomBonusType();
        remaining -= 1;
        continue;
      }
      break;
    }

    // If the board has no eligible ordinary tile, preserve the reward by using refills.
    while (remaining > 0 && availableRefills.length) {
      const refillIndex = availableRefills.shift();
      refillBonusOverrides[refillIndex] = randomBonusType();
      remaining -= 1;
    }
    return refillBonusOverrides;
  }

  function transformTileIntoBonus(index, bonusType) {
    if (!tiles[index] || tiles[index].bonus !== 'NO' || lockedTileIndices.has(index)) return false;
    const tileElement = board.querySelector(`[data-index="${index}"]`);
    if (!tileElement) return false;
    lockedTileIndices.add(index);
    tileElement.classList.add('long-word-bonus-transform', 'tile-refill-locked');
    scheduleRefillTimer(() => {
      if (!tiles[index] || tiles[index].bonus !== 'NO') {
        lockedTileIndices.delete(index);
        return;
      }
      tiles[index].bonus = bonusType;
      updateTileElement(index);
      const updatedElement = board.querySelector(`[data-index="${index}"]`);
      if (updatedElement) updatedElement.classList.add('long-word-bonus-transform', 'tile-refill-locked');
    }, 180, refillToken);
    scheduleRefillTimer(() => {
      const updatedElement = board.querySelector(`[data-index="${index}"]`);
      if (updatedElement) updatedElement.classList.remove('long-word-bonus-transform', 'tile-refill-locked');
      lockedTileIndices.delete(index);
    }, 620, refillToken);
    return true;
  }

  function startGame() {
    hideChronoCombo();
    stopTimers();
    cancelRefillSequence();
    makeLetterBag();
    makeBonusBag();
    tiles = Array.from({ length: SIZE * SIZE }, () => ({ letter: drawLetter(), bonus: drawBonus() }));
    selectedIndices = [];
    isSelecting = false;
    actionBusy = false;
    rotateCharges = 0;
    randomizeCharges = 0;
    randomizeWordProgress = 0;
    randomizeMode = false;
    roundActive = false;
    secondsLeft = ROUND_SECONDS;
    totalScore = 0;
    lastScore = 0;
    sessionWords = 0;
    sessionLongestWord = '';
    sessionHighestWord = '';
    sessionHighestWordScore = 0;
    sessionTimeBonus = 0;
    sessionWordAndTileScore = 0;
    sessionAmplifierBonus = 0;
    sessionComboBonus = 0;
    sessionHighestCombo = 0;
    roundMilestones = [];
    if (timeBonusTimeout !== null) window.clearTimeout(timeBonusTimeout);
    if (feedbackTimeout !== null) window.clearTimeout(feedbackTimeout);
    if (scoreGainTimeout !== null) window.clearTimeout(scoreGainTimeout);
    timeBonusTimeout = null;
    feedbackTimeout = null;
    scoreGainTimeout = null;
    el('time-bonus').textContent = '';
    el('score-gain').textContent = '';
    el('score-gain').classList.remove('score-gain-show');
    el('time-bonus').classList.remove('time-bonus-show');
    el('score').textContent = '0';
    el('last-word').textContent = '—';
    el('last-points').textContent = '+0';
    el('current-word').textContent = 'Find a word';
    el('word-feedback').textContent = 'Drag across letters to select them';
    el('countdown').textContent = '02:00';
    el('game-over').hidden = true;
    el('countdown-overlay').hidden = false;
    el('countdown-number').textContent = '3';
    el('personal-best-message').hidden = true;
    renderBoard();
    renderActionCharges();
    showScreen('game');
    // A short 3-2-1-GO countdown gives players time to prepare before the clock starts.
    const countdownSteps = ['3', '2', '1', 'GO!'];
    let countdownStep = 0;
    el('countdown-number').classList.remove('countdown-pop');
    void el('countdown-number').offsetWidth;
    el('countdown-number').classList.add('countdown-pop');
    countdownId = window.setInterval(() => {
      countdownStep += 1;
      if (countdownStep >= countdownSteps.length) {
        window.clearInterval(countdownId);
        countdownId = null;
        el('countdown-overlay').hidden = true;
        roundActive = true;
        renderActionCharges();
        timerId = window.setInterval(tick, 1000);
        return;
      }
      el('countdown-number').textContent = countdownSteps[countdownStep];
      el('countdown-number').classList.remove('countdown-pop');
      void el('countdown-number').offsetWidth;
      el('countdown-number').classList.add('countdown-pop');
    }, 700);
  }

  function stopTimers() {
    if (timerId !== null) window.clearInterval(timerId);
    if (countdownId !== null) window.clearInterval(countdownId);
    timerId = null;
    countdownId = null;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function updateCountdown() {
    el('countdown').textContent = formatTime(secondsLeft);
  }

  function tick() {
    if (!roundActive) return;
    secondsLeft = Math.max(0, secondsLeft - 1);
    updateCountdown();
    if (secondsLeft === 0) endGame();
  }

  // Every valid word earns 2 seconds. Bonus tiles add extra time by type.
  function awardTimeBonus(indices) {
    const bonusSeconds = { NO: 0, '2LS': 1, '3LS': 2, '2WS': 2, '3WS': 3 };
    const extra = indices.reduce((sum, index) => sum + (bonusSeconds[tiles[index].bonus] || 0), 0);
    const requested = 2 + extra;
    const added = Math.max(0, Math.min(requested, MAX_TIME_SECONDS - secondsLeft));
    secondsLeft += added;
    sessionTimeBonus += added;
    updateCountdown();

    const indicator = el('time-bonus');
    indicator.textContent = added === 0
      ? 'TIME MAX'
      : (extra > 0 ? `+${added}s BONUS` : `+${added}s`);
    indicator.classList.remove('time-bonus-show');
    // Force a fresh animation when words are found in quick succession.
    void indicator.offsetWidth;
    indicator.classList.add('time-bonus-show');
    el('countdown').classList.remove('timer-bonus-pulse');
    void el('countdown').offsetWidth;
    el('countdown').classList.add('timer-bonus-pulse');
    if (timeBonusTimeout !== null) window.clearTimeout(timeBonusTimeout);
    timeBonusTimeout = window.setTimeout(() => {
      indicator.classList.remove('time-bonus-show');
      indicator.textContent = '';
      el('countdown').classList.remove('timer-bonus-pulse');
      timeBonusTimeout = null;
    }, 1200);
    return added;
  }

  function stopChronoComboTicker() {
    if (chronoComboIntervalId !== null) {
      window.clearInterval(chronoComboIntervalId);
      chronoComboIntervalId = null;
    }
  }

  function hideChronoCombo() {
    stopChronoComboTicker();
    if (chronoComboClearTimeout !== null) {
      window.clearTimeout(chronoComboClearTimeout);
      chronoComboClearTimeout = null;
    }
    chronoComboLevel = 0;
    chronoComboDeadline = 0;
    updateChronoFrame(0);
    if (chronoComboIndicator) {
      chronoComboIndicator.hidden = true;
      chronoComboIndicator.textContent = '';
      chronoComboIndicator.classList.remove('chrono-combo-active', 'chrono-combo-hot', 'chrono-combo-expired');
    }
  }

  function expireChronoCombo() {
    stopChronoComboTicker();
    chronoComboLevel = 0;
    chronoComboDeadline = 0;
    updateChronoFrame(0);
    if (!chronoComboIndicator) return;
    chronoComboIndicator.hidden = false;
    chronoComboIndicator.textContent = 'COMBO EXPIRED';
    chronoComboIndicator.classList.remove('chrono-combo-active', 'chrono-combo-hot');
    chronoComboIndicator.classList.add('chrono-combo-expired');
    if (chronoComboClearTimeout !== null) window.clearTimeout(chronoComboClearTimeout);
    chronoComboClearTimeout = window.setTimeout(() => {
      if (chronoComboLevel === 0 && chronoComboIndicator) {
        chronoComboIndicator.hidden = true;
        chronoComboIndicator.textContent = '';
        chronoComboIndicator.classList.remove('chrono-combo-expired');
      }
      chronoComboClearTimeout = null;
    }, 800);
  }

  function updateChronoFrame(remainingMs = 0) {
    if (!boardStage) return;
    const active = roundActive && chronoComboLevel > 0 && remainingMs > 0;
    boardStage.classList.toggle('chrono-frame-active', active);
    boardStage.classList.toggle('chrono-frame-hot', active && remainingMs <= 2500);
    boardStage.classList.toggle('chrono-frame-expiring', active && remainingMs <= 1500);
  }

  function renderChronoCombo() {
    if (!chronoComboIndicator || !roundActive || chronoComboLevel <= 0) return;
    const remainingMs = chronoComboDeadline - Date.now();
    if (remainingMs <= 0) {
      expireChronoCombo();
      return;
    }
    const remainingSeconds = (remainingMs / 1000).toFixed(1);
    chronoComboIndicator.hidden = false;
    chronoComboIndicator.textContent = `COMBO ×${chronoComboLevel} · ${remainingSeconds}s`;
    chronoComboIndicator.classList.remove('chrono-combo-expired', 'chrono-combo-hot', 'chrono-combo-active');
    if (remainingMs <= 2500) chronoComboIndicator.classList.add('chrono-combo-hot');
    updateChronoFrame(remainingMs);
  }

  // Called exactly once when a valid word is accepted, never from animation callbacks.
  function processChronoCombo() {
    if (!roundActive || secondsLeft <= 0) {
      return { level: 0, rewardSeconds: 0, requestedReward: 0, rewardPoints: 0, secondsRemaining: 0 };
    }

    const now = Date.now();
    const comboIsActive = chronoComboLevel > 0 && now < chronoComboDeadline;

    if (chronoComboClearTimeout !== null) {
      window.clearTimeout(chronoComboClearTimeout);
      chronoComboClearTimeout = null;
    }
    chronoComboIndicator?.classList.remove('chrono-combo-expired');

    // A word found after the countdown expires starts a new streak.
    chronoComboLevel = comboIsActive ? chronoComboLevel + 1 : 1;

    let requestedReward = 0;
    let rewardPoints = 0;
    if (chronoComboLevel === 2) { requestedReward = 3; rewardPoints = 100; }
    else if (chronoComboLevel === 3) { requestedReward = 4; rewardPoints = 300; }
    else if (chronoComboLevel >= 4) { requestedReward = 5; rewardPoints = 500; }

    // First valid word starts a 5-second combo window.
    // For consecutive words, add only the listed reward to the time remaining;
    // do not reset to 5 seconds first. Cap the combo countdown at 10 seconds.
    // Chrono Combo must never modify the main round timer.
    if (!comboIsActive) {
      chronoComboDeadline = now + CHRONO_COMBO_WINDOW_MS;
    } else {
      const cappedDeadline = now + 10000;
      chronoComboDeadline = Math.min(
        cappedDeadline,
        chronoComboDeadline + (requestedReward * 1000)
      );
    }

    stopChronoComboTicker();
    renderChronoCombo();
    chronoComboIntervalId = window.setInterval(renderChronoCombo, 100);
    return {
      level: chronoComboLevel,
      rewardSeconds: requestedReward,
      requestedReward,
      rewardPoints,
      secondsRemaining: Math.min(10, Math.max(0, Math.ceil((chronoComboDeadline - now) / 1000)))
    };
  }

  const ACHIEVEMENTS = {
    amplifier: { title: 'Elder Tongue', detail: 'Find a 7-letter word for a ×2 Amplifier.' },
    combo4: { title: 'Momentum', detail: 'Reach a four-word Chrono Combo.' },
    chronoCap: { title: 'Timekeeper', detail: 'Fill the Chrono Combo timer to 10 seconds.' }
  };

  function unlockAchievement(id) {
    if (stats.achievements[id]) return;
    stats.achievements[id] = true;
    roundMilestones.push(ACHIEVEMENTS[id].title);
  }

  function endGame() {
    if (!roundActive) return;
    roundActive = false;
    isSelecting = false;
    selectedIndices = [];
    hideChronoCombo();
    stopTimers();
    clearSelectionStyles();
    stats.gamesPlayed += 1;
    const previousBestScore = stats.bestScore;
    const isNewBestScore = totalScore > previousBestScore;
    if (isNewBestScore) stats.bestScore = totalScore;
    stats.totalScoreAccumulated += totalScore;
    stats.scoreRoundsCount += 1;
    stats.bestWordsInRound = Math.max(stats.bestWordsInRound, sessionWords);
    if (sessionLongestWord.length > stats.bestLongestLength) {
      stats.bestLongestLength = sessionLongestWord.length;
      stats.bestLongestWord = sessionLongestWord;
    }
    if (sessionHighestWordScore > stats.bestWordScore) {
      stats.bestWordScore = sessionHighestWordScore;
      stats.bestWord = sessionHighestWord;
    }
    const elapsedSeconds = Math.max(0, ROUND_SECONDS + sessionTimeBonus - secondsLeft);
    stats.rounds.unshift({
      finalScore: totalScore,
      wordsFound: sessionWords,
      longestWord: sessionLongestWord,
      highestWord: sessionHighestWord,
      highestWordScore: sessionHighestWordScore,
      timeBonusSeconds: sessionTimeBonus,
      wordAndTileScore: sessionWordAndTileScore,
      amplifierBonus: sessionAmplifierBonus,
      comboBonus: sessionComboBonus,
      highestCombo: sessionHighestCombo,
      durationSeconds: elapsedSeconds,
      completedAt: new Date().toISOString(),
      newPersonalBest: isNewBestScore
    });
    stats.rounds = stats.rounds.slice(0, 20);
    saveStats();
    el('final-score').textContent = totalScore.toLocaleString();
    el('result-words').textContent = String(sessionWords);
    el('result-longest-word').textContent = sessionLongestWord || '—';
    el('result-longest-length').textContent = `${sessionLongestWord.length} ${sessionLongestWord.length === 1 ? 'letter' : 'letters'}`;
    el('result-highest-word').textContent = sessionHighestWord || '—';
    el('result-highest-points').textContent = `${sessionHighestWordScore} ${sessionHighestWordScore === 1 ? 'point' : 'points'}`;
    el('result-average-score').textContent = sessionWords ? (totalScore / sessionWords).toFixed(1) : '0';
    el('result-word-score').textContent = sessionWordAndTileScore.toLocaleString();
    el('result-amplifier-score').textContent = `+${sessionAmplifierBonus.toLocaleString()}`;
    el('result-combo-score').textContent = `+${sessionComboBonus.toLocaleString()}`;
    el('result-time-earned').textContent = `+${sessionTimeBonus}s`;
    el('result-highest-combo').textContent = `×${sessionHighestCombo}`;
    const milestones = el('result-milestones');
    milestones.hidden = roundMilestones.length === 0;
    milestones.textContent = roundMilestones.length ? `Milestone unlocked: ${roundMilestones.join(' · ')}` : '';
    const comparison = el('personal-best-comparison');
    if (isNewBestScore) {
      comparison.textContent = `Previous personal best: ${previousBestScore.toLocaleString()} · New record: +${(totalScore - previousBestScore).toLocaleString()} points`;
    } else if (totalScore === previousBestScore) {
      comparison.textContent = `You matched your personal best of ${previousBestScore.toLocaleString()} points`;
    } else {
      comparison.textContent = `Personal best: ${previousBestScore.toLocaleString()} · ${ (previousBestScore - totalScore).toLocaleString()} points below your record`;
    }
    el('personal-best-message').hidden = !isNewBestScore;
    el('game-over').hidden = false;
  }

  function getWord() { return selectedIndices.map((index) => tiles[index].letter).join(''); }

  function renderSelectionTrace() {
    if (!selectionTrace) return;
    selectionTrace.replaceChildren();
    if (selectedIndices.length === 0 || pointerTracePoints.length === 0) return;

    const stageBounds = board.getBoundingClientRect();
    if (stageBounds.width === 0 || stageBounds.height === 0) return;
    selectionTrace.setAttribute('viewBox', `0 0 ${stageBounds.width} ${stageBounds.height}`);
    selectionTrace.setAttribute('width', String(stageBounds.width));
    selectionTrace.setAttribute('height', String(stageBounds.height));

    // Render the sampled pointer trajectory itself, clipped to the board. This is not
    // reconstructed from tile centers, so the visual path never invents a different route.
    const points = pointerTracePoints.map((point) => {
      return `${point.x - stageBounds.left},${point.y - stageBounds.top}`;
    });
    if (points.length < 1) return;

    const svg = 'http://www.w3.org/2000/svg';
    const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point}`).join(' ');
    const glow = document.createElementNS(svg, 'path');
    glow.setAttribute('class', 'selection-trace-glow');
    glow.setAttribute('d', pathData);
    const line = document.createElementNS(svg, 'path');
    line.setAttribute('class', 'selection-trace-line');
    line.setAttribute('d', pathData);
    const head = document.createElementNS(svg, 'circle');
    const last = pointerTracePoints[pointerTracePoints.length - 1];
    head.setAttribute('class', 'selection-trace-head');
    head.setAttribute('cx', String(last.x - stageBounds.left));
    head.setAttribute('cy', String(last.y - stageBounds.top));
    head.setAttribute('r', '5.5');
    selectionTrace.append(glow, line, head);
  }

  function clearSelectionStyles() {
    board.querySelectorAll('.tile').forEach((tile) => tile.classList.remove('selected', 'preview-valid'));
    if (selectionTrace) selectionTrace.replaceChildren();
    pointerTracePoints = [];
  }

  function renderSelection() {
    clearSelectionStyles();
    selectedIndices.forEach((index) => {
      const tile = board.querySelector(`[data-index="${index}"]`);
      if (tile) tile.classList.add('selected');
    });
    renderSelectionTrace();
    const word = getWord();
    el('current-word').textContent = word || 'Find a word';
    if (!word) {
      el('word-feedback').classList.remove('feedback-error', 'feedback-success');
      el('word-feedback').textContent = 'Drag across letters to select them';
      el('last-points').textContent = '+0';
      return;
    }
    if (wordlistSet.has(word)) {
      el('word-feedback').classList.remove('feedback-error');
      el('word-feedback').classList.add('feedback-success');
      const result = scoreWord(selectedIndices);
      el('word-feedback').textContent = `Valid word · ${result.total} points${result.amplifierMultiplier > 1 ? ` · ${amplifierLabel(result.amplifierMultiplier)}` : ''}`;
      el('last-points').textContent = `+${result.total}`;
      selectedIndices.forEach((index) => {
        const tile = board.querySelector(`[data-index="${index}"]`);
        if (tile) tile.classList.add('preview-valid');
      });
    } else {
      el('word-feedback').classList.remove('feedback-success');
      el('word-feedback').textContent = `${word.length < 3 ? 'Keep going' : 'Not in dictionary'}`;
      el('last-points').textContent = '+0';
    }
  }

  function amplifierLabel(multiplier) {
    return multiplier >= 2 ? 'WORD AMPLIFIER ×2' : (multiplier > 1 ? 'WORD AMPLIFIER ×1.5' : '');
  }

  function scoreWord(indices) {
    let base = 0;
    let wordMultiplier = 1;
    indices.forEach((index) => {
      const tile = tiles[index];
      let letterMultiplier = 1;
      if (tile.bonus === '2LS') letterMultiplier = 2;
      if (tile.bonus === '3LS') letterMultiplier = 3;
      if (tile.bonus === '2WS') wordMultiplier *= 2;
      if (tile.bonus === '3WS') wordMultiplier *= 3;
      const letterIndex = tile.letter.charCodeAt(0) - 64;
      base += (LETTER_POINTS[letterIndex] || 0) * letterMultiplier;
    });
    const baseTotal = base * wordMultiplier;
    const amplifierMultiplier = indices.length >= WORD_AMPLIFIER_HIGH_LENGTH
      ? WORD_AMPLIFIER_HIGH_MULTIPLIER
      : (indices.length >= WORD_AMPLIFIER_MIN_LENGTH ? WORD_AMPLIFIER_MULTIPLIER : 1);
    const total = Math.round(baseTotal * amplifierMultiplier);
    return {
      base,
      multiplier: wordMultiplier,
      baseTotal,
      amplifierMultiplier,
      amplifierBonus: total - baseTotal,
      total
    };
  }

  function tileIndexFromPoint(x, y) {
    const target = document.elementFromPoint(x, y);
    const tile = target && target.closest ? target.closest('.tile') : null;
    return tile && board.contains(tile) ? Number(tile.dataset.index) : -1;
  }

  function selectTile(index) {
    if (!roundActive || index < 0 || index >= tiles.length || lockedTileIndices.has(index)) return;
    if (feedbackTimeout !== null) {
      window.clearTimeout(feedbackTimeout);
      feedbackTimeout = null;
      el('word-feedback').classList.remove('feedback-error');
    }
    const existingPosition = selectedIndices.indexOf(index);
    if (existingPosition !== -1) {
      // Dragging backward along the current path removes the later selected tiles.
      if (existingPosition < selectedIndices.length - 1) {
        selectedIndices = selectedIndices.slice(0, existingPosition + 1);
        renderSelection();
      }
      return;
    }
    selectedIndices.push(index);
    renderSelection();
  }

  function finishSelection() {
    if (!roundActive || selectedIndices.length === 0 || selectedIndices.some((index) => lockedTileIndices.has(index))) {
      selectedIndices = [];
      renderSelection();
      return;
    }
    const word = getWord();
    if (!wordlistSet.has(word)) {
      selectedIndices = [];
      clearSelectionStyles();
      el('current-word').textContent = word || 'Find a word';
      el('word-feedback').textContent = word.length < 3 ? 'Try a longer word' : 'Word not found';
      el('word-feedback').classList.remove('feedback-success', 'feedback-error');
      void el('word-feedback').offsetWidth;
      el('word-feedback').classList.add('feedback-error');
      if (feedbackTimeout !== null) window.clearTimeout(feedbackTimeout);
      feedbackTimeout = window.setTimeout(() => {
        el('word-feedback').classList.remove('feedback-error');
        el('word-feedback').textContent = 'Drag across letters to select them';
        el('current-word').textContent = 'Find a word';
        feedbackTimeout = null;
      }, 1000);
      return;
    }
    if (feedbackTimeout !== null) {
      window.clearTimeout(feedbackTimeout);
      feedbackTimeout = null;
    }
    const usedIndices = [...selectedIndices];
    usedIndices.forEach((index) => {
      const tile = board.querySelector(`[data-index="${index}"]`);
      if (tile) tile.classList.add('word-success-flash');
    });
    const result = scoreWord(usedIndices);
    const timeAdded = awardTimeBonus(usedIndices);
    const longWordBonusOverrides = grantLongWordBonuses(word.length, usedIndices);
    const comboResult = processChronoCombo();
    const wordAndComboScore = result.total + comboResult.rewardPoints;
    totalScore += wordAndComboScore;
    lastScore = wordAndComboScore;
    sessionWords += 1;
    grantActionCharges();
    // Keep the round breakdown additive: original scoring first, then Amplifier, then Combo.
    sessionWordAndTileScore += result.baseTotal;
    sessionAmplifierBonus += result.amplifierBonus;
    sessionComboBonus += comboResult.rewardPoints;
    sessionHighestCombo = Math.max(sessionHighestCombo, comboResult.level);
    if (result.amplifierMultiplier >= 2) unlockAchievement('amplifier');
    if (comboResult.level >= 4) unlockAchievement('combo4');
    if (comboResult.secondsRemaining >= 10) unlockAchievement('chronoCap');
    if (word.length > sessionLongestWord.length) sessionLongestWord = word;
    if (wordAndComboScore > sessionHighestWordScore) {
      sessionHighestWord = word;
      sessionHighestWordScore = wordAndComboScore;
    }
    stats.wordsFound += 1;
    stats.wordCounts[word] = (Number(stats.wordCounts[word]) || 0) + 1;
    saveStats();
    el('score').textContent = totalScore.toLocaleString();
    el('score').classList.remove('score-total-pop');
    void el('score').offsetWidth;
    el('score').classList.add('score-total-pop');
    el('last-word').textContent = word;
    el('last-points').textContent = `+${lastScore}`;
    el('current-word').textContent = word;
    el('word-feedback').classList.remove('feedback-error');
    el('word-feedback').classList.add('feedback-success');
    const amplifierText = amplifierLabel(result.amplifierMultiplier);
    el('word-feedback').textContent = `+${lastScore.toLocaleString()} points${result.multiplier > 1 ? ` · ${result.multiplier}× word multiplier` : ''}${amplifierText ? ` · ${amplifierText}` : ''} · +${timeAdded}s${comboResult.rewardPoints > 0 ? ` · COMBO +${comboResult.rewardPoints}` : ''}${comboResult.level > 0 && comboResult.rewardSeconds > 0 ? ` · +${comboResult.rewardSeconds}s COMBO TIME` : (comboResult.requestedReward > 0 && comboResult.rewardSeconds === 0 ? ' · TIME MAX' : '')}`;
    const scoreGain = el('score-gain');
    const scoreGainParts = [`+${result.total.toLocaleString()} WORD PTS`];
    if (result.amplifierMultiplier > 1) scoreGainParts.push(amplifierText);
    if (comboResult.rewardPoints > 0) scoreGainParts.push(`COMBO +${comboResult.rewardPoints}`);
    if (comboResult.level > 0 && comboResult.rewardSeconds > 0) scoreGainParts.push(`+${comboResult.rewardSeconds}s`);
    scoreGain.textContent = scoreGainParts.join('  ✦  ');
    scoreGain.classList.remove('score-gain-show', 'amplifier-burst', 'combo-burst');
    if (result.amplifierMultiplier > 1) scoreGain.classList.add('amplifier-burst');
    if (comboResult.level >= 2) scoreGain.classList.add('combo-burst');
    void scoreGain.offsetWidth;
    scoreGain.classList.add('score-gain-show');
    if (scoreGainTimeout !== null) window.clearTimeout(scoreGainTimeout);
    scoreGainTimeout = window.setTimeout(() => {
      scoreGain.classList.remove('score-gain-show', 'amplifier-burst', 'combo-burst');
      scoreGain.textContent = '';
      scoreGainTimeout = null;
    }, 1050);
    selectedIndices = [];
    clearSelectionStyles();
    // Lock only the consumed tiles. All other tiles stay available during refill.
    usedIndices.forEach((index) => {
      lockedTileIndices.add(index);
      const lockedTile = board.querySelector(`[data-index="${index}"]`);
      if (lockedTile) lockedTile.classList.add('tile-refill-locked');
    });
    // Briefly spotlight bonus tiles that contributed to this word before refilling them.
    usedIndices.forEach((index) => {
      const usedTile = board.querySelector(`[data-index="${index}"]`);
      if (usedTile && tiles[index].bonus !== 'NO') {
        usedTile.classList.add('bonus-hit');
        usedTile.setAttribute('aria-label', `${tiles[index].letter}, ${tiles[index].bonus} bonus used for scoring and time`);
      }
    });
    // Keep success feedback visible briefly, then remove it before the approved flip sequence.
    scheduleRefillTimer(() => {
      usedIndices.forEach((index) => {
        const tile = board.querySelector(`[data-index="${index}"]`);
        if (tile) tile.classList.remove('word-success-flash', 'preview-valid');
      });
    }, 400, refillToken);
    // Keep the bonus highlight visible, then flip only consumed tiles in sequence.
    scheduleRefillTimer(() => {
      usedIndices.forEach((index) => {
        const usedTile = board.querySelector(`[data-index="${index}"]`);
        if (usedTile) usedTile.classList.remove('bonus-hit');
      });
      runRefillSequence(usedIndices, longWordBonusOverrides);
    }, 520, refillToken);
  }

  function renderRoundHistory() {
    const container = el('round-history');
    container.replaceChildren();
    if (!stats.rounds.length) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Complete a round to see your history.';
      container.appendChild(p);
      return;
    }
    stats.rounds.slice(0, 20).forEach((round) => {
      const row = document.createElement('div');
      row.className = 'history-row';
      const details = document.createElement('div');
      details.className = 'history-details';
      const title = document.createElement('strong');
      title.textContent = `${Number(round.finalScore || 0).toLocaleString()} points${round.newPersonalBest ? ' · Personal best' : ''}`;
      const subtitle = document.createElement('span');
      const date = round.completedAt ? new Date(round.completedAt) : null;
      const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Previous game';
      subtitle.textContent = `${dateText} · ${Number(round.wordsFound || 0)} words · ${round.longestWord || 'No words'}`;
      details.append(title, subtitle);
      const score = document.createElement('strong');
      score.className = 'history-word-count';
      score.textContent = `${Number(round.timeBonusSeconds || 0)}s bonus`;
      row.append(details, score);
      container.appendChild(row);
    });
  }

  function renderStats() {
    el('best-score').textContent = String(stats.bestScore);
    el('games-played').textContent = String(stats.gamesPlayed);
    el('words-found').textContent = String(stats.wordsFound);
    el('average-game-score').textContent = stats.scoreRoundsCount ? Math.round(stats.totalScoreAccumulated / stats.scoreRoundsCount).toLocaleString() : '0';
    el('best-round-words').textContent = String(stats.bestWordsInRound || 0);
    el('stats-longest-word').textContent = stats.bestLongestWord || '—';
    el('stats-longest-length').textContent = stats.bestLongestWord ? `${stats.bestLongestLength} letters` : 'No record yet';
    el('stats-best-word').textContent = stats.bestWord || '—';
    el('stats-best-word-score').textContent = stats.bestWord ? `${stats.bestWordScore.toLocaleString()} points` : 'No record yet';
    renderRoundHistory();
    const achievementGrid = el('achievement-grid');
    achievementGrid.replaceChildren();
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
      const card = document.createElement('div');
      const unlocked = Boolean(stats.achievements[id]);
      card.className = `achievement-card${unlocked ? ' achievement-unlocked' : ''}`;
      const icon = document.createElement('span');
      icon.className = 'achievement-icon';
      icon.textContent = unlocked ? '✦' : '○';
      const text = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = achievement.title;
      const detail = document.createElement('small');
      detail.textContent = unlocked ? achievement.detail : 'Keep playing to unlock';
      text.append(title, detail);
      card.append(icon, text);
      achievementGrid.appendChild(card);
    });
    const container = el('word-stats');
    container.replaceChildren();
    const sorted = Object.entries(stats.wordCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20);
    if (sorted.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Play a game to start building your stats.';
      container.appendChild(p);
      return;
    }
    sorted.forEach(([word, count]) => {
      const row = document.createElement('div');
      row.className = 'word-stat-row';
      const name = document.createElement('span'); name.textContent = word;
      const uses = document.createElement('span'); uses.textContent = `${count} ${count === 1 ? 'time' : 'times'}`;
      const strong = document.createElement('strong'); strong.textContent = String(count);
      row.append(name, uses, strong);
      container.appendChild(row);
    });
  }

  function requestNewGame() {
    if (!stats.tutorialSeen) {
      el('tutorial-overlay').hidden = false;
      return;
    }
    startGame();
  }

  function dismissTutorialAndStart() {
    stats.tutorialSeen = true;
    saveStats();
    el('tutorial-overlay').hidden = true;
    startGame();
  }

  el('new-game-button').addEventListener('click', requestNewGame);
  el('tutorial-start-button').addEventListener('click', dismissTutorialAndStart);
  el('tutorial-skip-button').addEventListener('click', dismissTutorialAndStart);
  el('stats-button').addEventListener('click', () => { renderStats(); showScreen('stats'); });
  el('stats-back-button').addEventListener('click', () => showScreen('front'));
  el('game-menu-button').addEventListener('click', () => { roundActive = false; hideChronoCombo(); stopTimers(); showScreen('front'); });
  el('rotate-action').addEventListener('click', rotateBoardClockwise);
  el('randomize-action').addEventListener('click', armRandomize);
  el('play-again-button').addEventListener('click', startGame);
  el('results-menu-button').addEventListener('click', () => { el('game-over').hidden = true; showScreen('front'); });

  board.addEventListener('pointerdown', (event) => {
    if (!roundActive || actionBusy || event.button > 0) return;
    const tile = event.target.closest('.tile');
    if (!tile) return;
    event.preventDefault();
    if (randomizeMode) { randomizeTileLetter(Number(tile.dataset.index)); return; }
    isSelecting = true;
    selectedIndices = [];
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    pointerTracePoints = [{ x: event.clientX, y: event.clientY }];
    board.setPointerCapture?.(event.pointerId);
    selectTile(Number(tile.dataset.index));
  });
  board.addEventListener('pointermove', (event) => {
    if (!isSelecting || !roundActive || actionBusy) return;
    // Keep the visual trace on the real pointer coordinates. Tile selection still
    // samples between pointer events separately so fast drags cannot skip tiles.
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
    for (let step = 1; step <= steps; step += 1) {
      const x = lastPointerX + (dx * step) / steps;
      const y = lastPointerY + (dy * step) / steps;
      const index = tileIndexFromPoint(x, y);
      if (index !== -1) selectTile(index);
    }
    const lastPoint = pointerTracePoints[pointerTracePoints.length - 1];
    if (!lastPoint || Math.hypot(event.clientX - lastPoint.x, event.clientY - lastPoint.y) >= 1.5) {
      pointerTracePoints.push({ x: event.clientX, y: event.clientY });
      if (pointerTracePoints.length > 180) pointerTracePoints.shift();
    }
    // Refresh the trace even if the pointer moved within a tile.
    renderSelectionTrace();
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  });
  function pointerEnd() {
    if (!isSelecting) return;
    isSelecting = false;
    lastPointerX = null;
    lastPointerY = null;
    finishSelection();
  }
  board.addEventListener('pointerup', pointerEnd);
  board.addEventListener('pointercancel', pointerEnd);
  board.addEventListener('contextmenu', (event) => event.preventDefault());

  // Keep the original menu as the initial screen; dictionary loading is synchronous.
  installChronoComboUI();
  updateMenuPersonalBest();
  if (wordlistSet.size === 0) {
    el('word-feedback').textContent = 'Dictionary failed to load. Please reopen the game from its folder.';
  }
})();
