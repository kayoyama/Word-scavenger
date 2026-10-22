/* Browser rebuild of the recovered Word Scavenger game.
   Core rules retained: 5x5 board, weighted letters, 2-minute rounds,
   original letter values and bonus-square distribution, dictionary validation,
   and replacement of the tiles used in a valid word. */
(() => {
  'use strict';

  const ROUND_SECONDS = 120;
  const MAX_TIME_SECONDS = 200;
  const CHRONO_COMBO_WINDOW_MS = 7000;
  const CHRONO_COMBO_MAX_SECONDS = 20;
  const SIZE = 5;
  const MAX_CHAIN_TILES = 5;
  const RANDOMIZE_CHARGE_CAP = 5;
  const RANDOMIZE_WORDS_PER_CHARGE = 5;
  const BOMB_CHARGE_CAP = 3;
  const BOMB_WORDS_PER_CHARGE = 10;
  const SWAP_CHARGE_CAP = 3;
  const SWAP_WORDS_PER_CHARGE = 15;
  const WILD_LETTER_CHARGES_PER_ROUND = 3;
  const STORAGE_KEY = 'wordScavengerBrowserStats';
  const BONUS_CLASSES = {
    NO: '', '2LS': 'bonus-2ls', '3LS': 'bonus-3ls',
    '2WS': 'bonus-2ws', '3WS': 'bonus-3ws'
  };
  const LETTER_POINTS = [0, 16, 34, 32, 23, 14, 42, 21, 41, 16, 81, 52, 22, 32, 19, 18, 34, 102, 19, 12, 19, 16, 45, 42, 82, 42, 101];
  const scoringRules = window.WordScoringRules;
  const gameLogic = window.WordGameLogic;

  const el = (id) => document.getElementById(id);
  const frontScreen = el('front-screen');
  const statsScreen = el('stats-screen');
  const gameScreen = el('game-screen');
  const board = el('board');
  const selectionTrace = el('selection-trace');
  const boardStage = board ? board.closest('.board-stage') : null;
  let pointerTracePoints = [];
  let rotateCenterOverlay = null;
  let rotateCenterOriginal = null;
  let bombTargetPreview = null;
  let bombAimIcon = null;
  let bombBlastEffect = null;
  let bombGestureTarget = null;
  let bombGesturePointerId = null;
  const wordlistSet = new Set(Array.isArray(window.wordlist) ? window.wordlist : []);

  let tiles = [];
  // Round Power is selected before each round. Wild Letter tiles carry stable IDs.
  let selectedRoundPower = 'wild-letter';
  let wildLetterCharges = 0;
  let wildLetterMode = false;
  let wildLetterLetter = null;
  let wildLetterTargetIndex = null;
  let anchorWordMode = false;
  let anchorWordCharges = 0;
  let nextWildLetterId = 1;
  let selectedIndices = [];
  let isSelecting = false;
  let roundActive = false;
  let isPaused = false;
  let pausedComboTimer = false;
  let actionBusy = false;
  let randomizeCharges = 0;
  let randomizeWordProgress = 0;
  let randomizeMode = false;
  let bombCharges = 0;
  let bombWordProgress = 0;
  let bombMode = false;
  let swapCharges = 0;
  let swapWordProgress = 0;
  let swapMode = false;
  let swapFirstIndex = null;
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
  let chronoComboPausedRemainingMs = null;
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
      .chrono-combo { position: relative; z-index: 7; left: auto; top: auto; transform: none; display: block; width: fit-content; margin: 0 auto; min-width: 142px; padding: 5px 12px 6px; border: 1px solid rgba(255,220,91,.86); border-radius: 999px; background: rgba(5,24,48,.96); box-shadow: 0 0 10px rgba(255,210,64,.25), inset 0 0 6px rgba(255,255,255,.10); color: #fff0a0; font-size: 11px; font-weight: 1000; line-height: 1.15; letter-spacing: .045em; text-align: center; white-space: nowrap; opacity: 1; transition: color .15s ease, box-shadow .15s ease; pointer-events: none; }
      .chrono-combo[hidden] { display: none !important; }
      .chrono-combo.chrono-combo-active { animation: combo-energy .45s ease-out; }
      .chrono-combo.chrono-combo-hot { color: #fff3a0; border-color: #fff18b; background: linear-gradient(135deg, #493400, #946d00 55%, #493400); box-shadow: 0 0 16px rgba(255,197,54,.65), inset 0 0 8px rgba(255,255,255,.2); }
      .chrono-combo.chrono-combo-expired { color: #d9e8f7; border-color: #7191b8; background: linear-gradient(135deg, #102744, #1d3d62); animation: chrono-combo-expired .35s ease-out; }
      @keyframes combo-energy { 0% { opacity: .5; filter: brightness(1.8); transform: scale(.72); } 70% { opacity: 1; transform: scale(1.12); } 100% { transform: scale(1); } }
      @keyframes chrono-combo-expired { 0% { filter: brightness(1.7); transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: .85; } }
      .score-gain.amplifier-burst { color: #fff2a0 !important; text-shadow: 0 0 5px #ffb000, 0 0 12px #ff5e00; }
      .score-gain.combo-burst { color: #d8eaff !important; text-shadow: 0 0 5px #398bff, 0 0 13px #168cff; }
      .score-gain.amplifier-burst.combo-burst { color: #fff4bd !important; text-shadow: 0 0 6px #ffd84d, 0 0 13px #c28a19, 0 0 20px #398bff; }
      .score-gain.amplifier-burst.score-gain-show { animation: reward-amplifier-pop 3.8s ease-out both; }
      .score-gain.combo-burst.score-gain-show { animation: reward-combo-pop 3.8s cubic-bezier(.2,.8,.2,1) both; }
      .score-gain.amplifier-burst.combo-burst.score-gain-show { animation: reward-combined-pop 3.8s ease-out both; }
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
    comboSlot.appendChild(chronoComboIndicator);
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
    el('settings-screen').hidden = screen !== 'settings';
    gameScreen.hidden = screen !== 'game';
    if (screen !== 'front') { el('tutorial-overlay').hidden = true; el('round-power-overlay').hidden = true; }
  }

  function randomInt(max) { return Math.floor(Math.random() * max) + 1; }

  // Exact weighted letter distribution from the original loadcharset2().
  function makeLetterBag() {
    const counts = {
      A: 19, B: 5, C: 8, D: 8, E: 31, F: 5, G: 10, H: 7, I: 16,
      J: 1, K: 2, L: 10, M: 8, N: 17, O: 19, P: 5, Q: 2, R: 17,
      S: 13, T: 20, U: 11, V: 4, W: 5, X: 1, Y: 5, Z: 1
    };
    letterBag = [];
    Object.entries(counts).forEach(([letter, count]) => {
      for (let i = 0; i < count; i += 1) letterBag.push(letter);
    });
  }

  // Fixed 500-entry bonus bag, matching the approved distribution exactly.
  function makeBonusBag() {
    bonusBag = [];
    for (let i = 0; i < 350; i += 1) bonusBag.push('NO');
    for (let i = 0; i < 50; i += 1) bonusBag.push('2LS');
    for (let i = 0; i < 40; i += 1) bonusBag.push('3LS');
    for (let i = 0; i < 35; i += 1) bonusBag.push('2WS');
    for (let i = 0; i < 25; i += 1) bonusBag.push('3WS');
  }

  function drawLetter() { return letterBag[randomInt(letterBag.length) - 1]; }
  function drawBonus() { return bonusBag[randomInt(bonusBag.length) - 1]; }

  function createTile(index, letter, bonus) {
    const button = document.createElement('button');
    button.type = 'button';
    const tileData = tiles[index];
    button.className = `tile ${tileData?.isWildLetter ? 'wild-letter-tile' : (BONUS_CLASSES[bonus] || '')} ${tileData?.isAnchored ? 'anchor-word-tile' : ''}`.trim();
    button.dataset.index = String(index);
    button.dataset.letter = letter;
    button.dataset.bonus = bonus;
    const letterValue = tileData?.isWildLetter ? 1 : (LETTER_POINTS[letter.charCodeAt(0) - 64] || 0);
    const bonusLabel = ({ '2LS': '2L', '3LS': '3L', '2WS': '2W', '3WS': '3W' })[bonus] || '';
    const face = document.createElement('span'); face.className = 'tile-letter'; face.textContent = letter;
    const value = document.createElement('sub'); value.className = 'tile-value'; value.textContent = String(letterValue);
    button.append(face, value);
    if (bonusLabel && !tileData?.isWildLetter) { const mark = document.createElement('sup'); mark.className = 'tile-bonus-mark'; mark.textContent = bonusLabel; button.appendChild(mark); }
    if (tileData?.isWildLetter) button.dataset.wildLetterId = tileData.id;
    button.setAttribute('aria-label', `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}, ${tileData?.isWildLetter ? 'Wild Letter ' : ''}${tileData?.isAnchored ? 'anchored ' : ''}letter ${letter}, ${letterValue} points${tileData?.isWildLetter ? ', wildcard tile' : (bonus === 'NO' ? '' : `, ${bonus}`)}${tileData?.isAnchored ? ', protected anchored tile' : ''}`);
    return button;
  }

  // Power actions cannot start while a power animation or tile-transform/refill lock is active.
  function isPowerActionLocked() {
    return actionBusy || lockedTileIndices.size > 0;
  }

  function renderActionCharges() {
    const wildButton = el('wild-letter-action');
    const rotateButton = el('rotate-action');
    const randomizeButton = el('randomize-action');
    const bombButton = el('bomb-action');
    const swapButton = el('swap-action');
    if (!wildButton || !rotateButton || !randomizeButton || !bombButton || !swapButton) return;
    const anchorSelected = selectedRoundPower === 'anchor-word';
    const actionSymbol = el('round-power-action-symbol');
    if (anchorSelected) {
      actionSymbol.innerHTML = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M10 13.5a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1l-1.4 1.4"/><path d="M14 10.5a5 5 0 0 0-7.1 0l-2.4 2.4a5 5 0 0 0 7.1 7.1l1.4-1.4"/></svg>';
    } else {
      actionSymbol.textContent = 'W';
    }
    el('round-power-action-label').textContent = anchorSelected ? 'CHAIN' : 'WILD LETTER';
    el('wild-letter-count').textContent = anchorSelected ? `${anchorWordCharges} / 1` : `${wildLetterCharges} / ${WILD_LETTER_CHARGES_PER_ROUND}`;
    el('wild-letter-hint').textContent = anchorSelected
      ? (anchorWordMode ? `Select 2–${MAX_CHAIN_TILES} connected tiles` : (anchorWordCharges > 0 ? `Protect up to ${MAX_CHAIN_TILES} tiles while waiting to extend a word` : 'Chain already created this round'))
      : (wildLetterMode ? 'Choose a tile, then choose its letter' : (wildLetterCharges > 0 ? 'Choose a tile, then its letter' : 'Wild Letter already used up'));
    const boardLocked = isPowerActionLocked();
    const powerModeActive = anchorSelected ? anchorWordMode : wildLetterMode;
    const powerCharges = anchorSelected ? anchorWordCharges : wildLetterCharges;
    wildButton.disabled = !roundActive || powerCharges <= 0 && !powerModeActive || boardLocked;
    wildButton.classList.toggle('power-ready', !wildButton.disabled && powerCharges > 0);
    wildButton.classList.toggle('power-locked', wildButton.disabled);
    wildButton.classList.toggle('action-armed', powerModeActive);
    wildButton.classList.toggle('anchor-word-action', anchorSelected);
    el('rotate-count').textContent = '∞';
    el('randomize-count').textContent = `${randomizeCharges} / ${RANDOMIZE_CHARGE_CAP}`;
    el('bomb-count').textContent = `${bombCharges} / ${BOMB_CHARGE_CAP}`;
    el('swap-count').textContent = `${swapCharges} / ${SWAP_CHARGE_CAP}`;
    el('randomize-hint').textContent = randomizeCharges > 0
      ? (randomizeCharges >= RANDOMIZE_CHARGE_CAP ? 'Storage full · choose a tile' : 'Choose a tile to change its letter')
      : `Next charge: ${RANDOMIZE_WORDS_PER_CHARGE - randomizeWordProgress} correct word${RANDOMIZE_WORDS_PER_CHARGE - randomizeWordProgress === 1 ? '' : 's'}`;
    el('bomb-hint').textContent = bombMode ? 'Click the intersection of four tiles' : 'Every 10 words under 6 letters, or any 6+ letter word';
    el('swap-hint').textContent = swapMode ? (swapFirstIndex === null ? 'Select the first tile' : 'Select the second tile') : 'Every 15 words under 6 letters, or any 7+ letter word';
    rotateButton.disabled = !roundActive || boardLocked;
    randomizeButton.disabled = !roundActive || boardLocked || (randomizeCharges <= 0 && !randomizeMode);
    bombButton.disabled = !roundActive || boardLocked || (bombCharges <= 0 && !bombMode);
    swapButton.disabled = !roundActive || boardLocked || (swapCharges <= 0 && !swapMode);
    [[rotateButton, roundActive], [randomizeButton, randomizeCharges > 0 || randomizeMode], [bombButton, bombCharges > 0 || bombMode], [swapButton, swapCharges > 0 || swapMode]].forEach(([button, ready]) => { button.classList.toggle('power-ready', Boolean(ready) && !button.disabled); button.classList.toggle('power-locked', button.disabled); });
    board.classList.toggle('board-actions-locked', boardLocked);
    randomizeButton.classList.toggle('action-armed', randomizeMode);
    bombButton.classList.toggle('action-armed', bombMode);
    swapButton.classList.toggle('action-armed', swapMode);
  }

  function grantActionCharges(wordLength) {
    if (randomizeCharges < RANDOMIZE_CHARGE_CAP) {
      randomizeWordProgress += 1;
      if (randomizeWordProgress >= RANDOMIZE_WORDS_PER_CHARGE) {
        randomizeCharges = Math.min(RANDOMIZE_CHARGE_CAP, randomizeCharges + 1);
        randomizeWordProgress = 0;
      }
    } else randomizeWordProgress = 0;

    // 6+ letter words never advance either regular milestone counter. They can
    // award an immediate charge at each power's threshold without resetting progress.
    const bombProgress = scoringRules.advancePowerChargeProgress(
      bombWordProgress, bombCharges, BOMB_CHARGE_CAP, wordLength, 6, BOMB_WORDS_PER_CHARGE, 6
    );
    bombWordProgress = bombProgress.progress;
    bombCharges = bombProgress.charges;

    const swapProgress = scoringRules.advancePowerChargeProgress(
      swapWordProgress, swapCharges, SWAP_CHARGE_CAP, wordLength, 7, SWAP_WORDS_PER_CHARGE, 6
    );
    swapWordProgress = swapProgress.progress;
    swapCharges = swapProgress.charges;
    renderActionCharges();
  }

  function cancelPowerModes() {
    randomizeMode = false;
    wildLetterMode = false;
    anchorWordMode = false;
    wildLetterLetter = null;
    wildLetterTargetIndex = null;
    bombMode = false;
    bombGestureTarget = null;
    bombGesturePointerId = null;
    swapMode = false;
    swapFirstIndex = null;
    board.querySelectorAll('.power-target-selected').forEach((tile) => tile.classList.remove('power-target-selected'));
    board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover'));
    hideBombTargetPreview();
  }

  function armBomb() {
    if (!roundActive || isPowerActionLocked() || (bombCharges <= 0 && !bombMode)) return;
    const wasArmed = bombMode;
    cancelPowerModes();
    bombMode = !wasArmed;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    el('word-feedback').textContent = bombMode ? 'Bomb: click the intersection at the center of four tiles' : 'Drag across letters to select them';
    renderActionCharges();
  }

  function armSwap() {
    if (!roundActive || isPowerActionLocked() || (swapCharges <= 0 && !swapMode)) return;
    const wasArmed = swapMode;
    cancelPowerModes();
    swapMode = !wasArmed;
    swapFirstIndex = null;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    el('word-feedback').textContent = swapMode ? 'Swap: select two tiles' : 'Drag across letters to select them';
    renderActionCharges();
  }

  function getBombBlockGeometry(row, col) {
    const indices = [row * SIZE + col, row * SIZE + col + 1, (row + 1) * SIZE + col, (row + 1) * SIZE + col + 1];
    const rects = indices.map((index) => {
      const tile = board.querySelector(`[data-index="${index}"]`);
      return tile ? tile.getBoundingClientRect() : null;
    });
    if (rects.some((rect) => !rect)) return null;
    return {
      indices,
      left: Math.min(...rects.map((rect) => rect.left)),
      top: Math.min(...rects.map((rect) => rect.top)),
      right: Math.max(...rects.map((rect) => rect.right)),
      bottom: Math.max(...rects.map((rect) => rect.bottom))
    };
  }

  function nearestBombBlockAtPoint(x, y) {
    let best = null;
    let bestDistance = Infinity;
    const rects = Array.from({ length: SIZE * SIZE }, (_, index) => {
      const tile = board.querySelector(`[data-index="${index}"]`);
      return tile ? tile.getBoundingClientRect() : null;
    });
    for (let row = 0; row < SIZE - 1; row += 1) {
      for (let col = 0; col < SIZE - 1; col += 1) {
        const a = rects[row * SIZE + col];
        const b = rects[row * SIZE + col + 1];
        const c = rects[(row + 1) * SIZE + col];
        if (!a || !b || !c) continue;
        const ix = (a.right + b.left) / 2;
        const iy = (a.bottom + c.top) / 2;
        const distance = Math.hypot(x - ix, y - iy);
        if (distance < bestDistance) { bestDistance = distance; best = { row, col, distance }; }
      }
    }
    return best;
  }

  function bombIntersectionPoint(row, col) {
    const topLeft = board.querySelector(`[data-index="${row * SIZE + col}"]`);
    const topRight = board.querySelector(`[data-index="${row * SIZE + col + 1}"]`);
    const bottomLeft = board.querySelector(`[data-index="${(row + 1) * SIZE + col}"]`);
    if (!topLeft || !topRight || !bottomLeft) return null;
    const a = topLeft.getBoundingClientRect();
    const b = topRight.getBoundingClientRect();
    const c = bottomLeft.getBoundingClientRect();
    return { x: (a.right + b.left) / 2, y: (a.bottom + c.top) / 2, tileWidth: a.width, tileHeight: a.height };
  }

  function bombTargetTolerance(row, col, multiplier = 0.82) {
    const point = bombIntersectionPoint(row, col);
    return point ? Math.max(14, Math.min(point.tileWidth, point.tileHeight) * multiplier) : 0;
  }

  function captureBombTargetAtPoint(x, y) {
    const boardRect = board.getBoundingClientRect();
    if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) return null;
    const nearest = nearestBombBlockAtPoint(x, y);
    if (!nearest || nearest.distance > bombTargetTolerance(nearest.row, nearest.col)) return null;
    return { row: nearest.row, col: nearest.col };
  }

  function isReleaseNearBombTarget(target, x, y) {
    if (!target) return false;
    const boardRect = board.getBoundingClientRect();
    if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) return false;
    const point = bombIntersectionPoint(target.row, target.col);
    return Boolean(point && Math.hypot(x - point.x, y - point.y) <= bombTargetTolerance(target.row, target.col, 0.82));
  }

  function updateBombTargetPreview(x, y) {
    if (!bombMode || !roundActive || !boardStage) return;
    const boardRect = board.getBoundingClientRect();
    if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) {
      hideBombTargetPreview();
      return;
    }
    updateBombAimIcon(x, y);
    const nearest = nearestBombBlockAtPoint(x, y);
    if (!nearest) { hideBombTargetPreview(); return; }
    const geometry = getBombBlockGeometry(nearest.row, nearest.col);
    if (!geometry) { hideBombTargetPreview(); return; }
    if (!bombTargetPreview) {
      bombTargetPreview = document.createElement('div');
      bombTargetPreview.className = 'bomb-target-preview';
      bombTargetPreview.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 4; i += 1) {
        const cell = document.createElement('span');
        cell.className = 'bomb-target-cell';
        bombTargetPreview.appendChild(cell);
      }
      boardStage.appendChild(bombTargetPreview);
    }
    const stageRect = boardStage.getBoundingClientRect();
    bombTargetPreview.style.left = `${geometry.left - stageRect.left}px`;
    bombTargetPreview.style.top = `${geometry.top - stageRect.top}px`;
    bombTargetPreview.style.width = `${geometry.right - geometry.left}px`;
    bombTargetPreview.style.height = `${geometry.bottom - geometry.top}px`;
    bombTargetPreview.dataset.row = String(nearest.row);
    bombTargetPreview.dataset.col = String(nearest.col);
    bombTargetPreview.hidden = false;
  }

  function hideBombTargetPreview() {
    if (bombTargetPreview) bombTargetPreview.remove();
    if (bombAimIcon) bombAimIcon.remove();
    bombTargetPreview = null;
    bombAimIcon = null;
  }

  function updateBombAimIcon(x, y) {
    if (!bombMode || !boardStage) return;
    const boardRect = board.getBoundingClientRect();
    if (x < boardRect.left || x > boardRect.right || y < boardRect.top || y > boardRect.bottom) {
      if (bombAimIcon) bombAimIcon.remove();
      bombAimIcon = null;
      return;
    }
    if (!bombAimIcon) {
      bombAimIcon = document.createElement('span');
      bombAimIcon.className = 'bomb-aim-icon';
      bombAimIcon.textContent = '💣';
      bombAimIcon.setAttribute('aria-hidden', 'true');
      boardStage.appendChild(bombAimIcon);
    }
    const stageRect = boardStage.getBoundingClientRect();
    bombAimIcon.style.left = `${x - stageRect.left}px`;
    bombAimIcon.style.top = `${y - stageRect.top}px`;
  }

  function showBombExplosion(row, col, duration = 220) {
    if (!boardStage) return;
    const geometry = getBombBlockGeometry(row, col);
    if (!geometry) return;
    if (bombBlastEffect) bombBlastEffect.remove();
    const stageRect = boardStage.getBoundingClientRect();
    const effect = document.createElement('div');
    effect.className = 'bomb-blast-effect';
    effect.setAttribute('aria-hidden', 'true');
    effect.style.left = `${geometry.left - stageRect.left}px`;
    effect.style.top = `${geometry.top - stageRect.top}px`;
    effect.style.width = `${geometry.right - geometry.left}px`;
    effect.style.height = `${geometry.bottom - geometry.top}px`;
    const sparkDistance = Math.round(Math.min(geometry.right - geometry.left, geometry.bottom - geometry.top) * 0.42);
    for (let index = 0; index < 8; index += 1) {
      const spark = document.createElement('span');
      spark.className = 'bomb-blast-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.style.setProperty('--spark-angle', `${index * 45}deg`);
      spark.style.setProperty('--spark-distance', `${sparkDistance}px`);
      spark.style.animationDelay = `${(index % 3) * 8}ms`;
      effect.appendChild(spark);
    }
    boardStage.appendChild(effect);
    bombBlastEffect = effect;
    const removeEffect = () => {
      if (effect.parentNode) effect.remove();
      if (bombBlastEffect === effect) bombBlastEffect = null;
    };
    effect.addEventListener('animationend', removeEffect, { once: true });
    window.setTimeout(removeEffect, duration + 100);
  }

  function captureTilePositions() {
    const positions = new Map();
    tiles.forEach((tileData, index) => {
      const element = board.querySelector(`[data-index="${index}"]`);
      if (element) positions.set(tileData, element.getBoundingClientRect());
    });
    return positions;
  }

  function captureTileRectsByIndex() {
    const positions = new Map();
    tiles.forEach((tileData, index) => {
      const element = board.querySelector(`[data-index="${index}"]`);
      if (element) positions.set(index, element.getBoundingClientRect());
    });
    return positions;
  }

  // Bomb animation is destination-driven rather than object-reference-driven.
  // Bonus promotion can therefore never detach a tile from its movement path.
  function animateBombMovementPlan(oldRectsByIndex, movementPlan, duration = 300, token = refillToken, bonusTransitionByIndex = new Map()) {
    const animated = [];
    movementPlan.forEach((movement, destinationIndex) => {
      const element = board.querySelector(`[data-index="${destinationIndex}"]`);
      if (!element) return;
      const { sourceIndex, isNew } = movement;
      if (!isNew && sourceIndex === destinationIndex) return;
      const oldRect = sourceIndex === null ? null : oldRectsByIndex.get(sourceIndex);
      const newRect = element.getBoundingClientRect();
      const dx = oldRect ? oldRect.left - newRect.left : 0;
      const dy = oldRect ? oldRect.top - newRect.top : -(newRect.height + 8);
      const tileData = tiles[destinationIndex];
      const previousBonus = bonusTransitionByIndex.get(destinationIndex);
      element.style.transition = 'none';
      if (previousBonus && previousBonus !== tileData.bonus) {
        const winningClass = BONUS_CLASSES[tileData.bonus];
        const previousClass = BONUS_CLASSES[previousBonus];
        if (winningClass) element.classList.remove(winningClass);
        if (previousClass) element.classList.add(previousClass);
        void element.offsetWidth;
        element.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease`;
        if (previousClass) element.classList.remove(previousClass);
        if (winningClass) element.classList.add(winningClass);
      }
      element.style.transform = `translate(${dx}px, ${dy}px)`;
      element.classList.add('power-move-animated');
      animated.push(element);
    });
    void board.offsetWidth;
    requestAnimationFrame(() => {
      if (token !== refillToken) return;
      animated.forEach((element) => {
        element.style.transition = `transform ${duration}ms cubic-bezier(.2,.72,.25,1), background-color ${duration}ms ease, color ${duration}ms ease`;
        element.style.transform = 'translate(0, 0)';
      });
    });
    window.setTimeout(() => animated.forEach((element) => {
      element.style.transition = '';
      element.style.transform = '';
      element.classList.remove('power-move-animated');
    }), duration + 40);
  }

  function animateTilePositions(oldPositions, movedTileData, newTileData = [], duration = 300, token = refillToken, bonusTransitionByTile = new Map()) {
    const animated = [];
    tiles.forEach((tileData, index) => {
      const element = board.querySelector(`[data-index="${index}"]`);
      if (!element) return;
      const oldRect = oldPositions.get(tileData);
      const isMoved = movedTileData.has(tileData);
      const isNew = newTileData.has(tileData);
      if (!isMoved && !isNew) return;
      const newRect = element.getBoundingClientRect();
      const dx = oldRect ? oldRect.left - newRect.left : 0;
      const dy = oldRect ? oldRect.top - newRect.top : -(newRect.height + 8);
      element.style.transition = 'none';
      const previousBonus = bonusTransitionByTile.get(tileData);
      if (previousBonus && previousBonus !== tileData.bonus) {
        const winningClass = BONUS_CLASSES[tileData.bonus];
        const previousClass = BONUS_CLASSES[previousBonus];
        if (winningClass) element.classList.remove(winningClass);
        if (previousClass) element.classList.add(previousClass);
        void element.offsetWidth;
        element.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease`;
        if (previousClass) element.classList.remove(previousClass);
        if (winningClass) element.classList.add(winningClass);
      }
      element.style.transform = `translate(${dx}px, ${dy}px)`;
      element.classList.add('power-move-animated');
      animated.push(element);
    });
    void board.offsetWidth;
    requestAnimationFrame(() => {
      if (token !== refillToken) return;
      animated.forEach((element) => {
        element.style.transition = `transform ${duration}ms cubic-bezier(.2,.72,.25,1), background-color ${duration}ms ease, color ${duration}ms ease`;
        element.style.transform = 'translate(0, 0)';
      });
    });
    window.setTimeout(() => animated.forEach((element) => {
      element.style.transition = '';
      element.style.transform = '';
      element.classList.remove('power-move-animated');
    }), duration + 40);
  }

  function useBombAt(row, col) {
    if (!bombMode || bombCharges <= 0 || !roundActive || isPowerActionLocked() || !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= SIZE - 1 || col >= SIZE - 1) return false;
    // Chain protects individual tiles only. Unprotected target tiles still explode,
    // and the cascade compacts/refills around fixed anchored tiles.
    cancelPowerModes();
    bombCharges -= 1;
    setActionsBusy(true);
    showBombExplosion(row, col, 260);
    const targetIndices = [row * SIZE + col, row * SIZE + col + 1, (row + 1) * SIZE + col, (row + 1) * SIZE + col + 1];
    const oldRectsByIndex = captureTileRectsByIndex();
    const rowIndices = targetIndices.filter((index) => !tiles[index]?.isAnchored);
    const bombedElements = rowIndices.map((index) => board.querySelector(`[data-index="${index}"]`)).filter(Boolean);
    // Protected chain tiles do not explode or lend their bonus to a replacement.
    // Each unprotected exploded position resolves its own winning bonus/color.
    const landingBonuses = new Map(rowIndices.map((index) => [index, tiles[index]?.bonus || 'NO']));
    bombedElements.forEach((tile, position) => {
      tile.classList.add('bomb-exploding');
      tile.dataset.winnerBonus = landingBonuses.get(rowIndices[position]) || 'NO';
    });
    selectedIndices = [];
    clearSelectionStyles();
    const token = refillToken;
    // Keep the old board in place for the explosion; mutate/refill only after it finishes.
    scheduleRefillTimer(() => {
      // New tiles entering from above receive independently random letters and no inherited bonus.
      const bombResult = gameLogic.bombClearAndGravity(tiles, SIZE, row, col, () => ({ letter: drawLetter(), bonus: drawBonus() }));
      tiles = bombResult.tiles;
      // Only tiles above the explosion cascade down. Rows below the 2×2 target
      // remain untouched. Each tile landing in the explosion compares its bonus
      // against that exact destination's exploded bonus; never recolor whole columns.
      // Resolve each landing bonus independently in shared logic. This mutates only
      // the bonus field, preserving tile identity, random letters, and the movement plan.
      const bonusTransitionByIndex = gameLogic.resolveBombLandingBonuses(tiles, bombResult.clearedIndices, landingBonuses);
      renderBoard();
      animateBombMovementPlan(oldRectsByIndex, bombResult.movementPlan, 300, token, bonusTransitionByIndex);
      renderActionCharges();
      el('word-feedback').textContent = 'Bomb used · tiles exploded and fell';
      scheduleRefillTimer(() => {
        setActionsBusy(false);
      }, 340, token);
    }, 260, token);
    renderActionCharges();
    return true;
  }

  function useSwap(firstIndex, secondIndex) {
    if (!swapMode || swapCharges <= 0 || firstIndex === secondIndex || !roundActive || isPowerActionLocked() || !Number.isInteger(firstIndex) || !Number.isInteger(secondIndex) || firstIndex < 0 || secondIndex < 0 || firstIndex >= tiles.length || secondIndex >= tiles.length || tiles[firstIndex]?.isWildLetter || tiles[secondIndex]?.isWildLetter || tiles[firstIndex]?.isAnchored || tiles[secondIndex]?.isAnchored) return false;
    const oldPositions = captureTilePositions();
    tiles = gameLogic.swapTiles(tiles, firstIndex, secondIndex);
    // Keep references to the two tile objects that changed positions. Using
    // undefined names here throws after actionBusy is set and leaves the board locked.
    const swappedTileData = new Set([tiles[firstIndex], tiles[secondIndex]]);
    swapCharges -= 1;
    cancelPowerModes();
    selectedIndices = [];
    isSelecting = false;
    setActionsBusy(true);
    const token = refillToken;
    renderBoard();
    animateTilePositions(oldPositions, swappedTileData, new Set(), 220, token);
    el('word-feedback').textContent = 'Swap complete';
    scheduleRefillTimer(() => {
      setActionsBusy(false);
    }, 260, token);
    renderActionCharges();
    return true;
  }

  function setActionsBusy(busy) {
    actionBusy = busy;
    renderActionCharges();
  }

  function pauseRoundTimer() {
    const wasRunning = timerId !== null;
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    return wasRunning;
  }

  function resumeRoundTimer(wasRunning) {
    if (wasRunning && roundActive && timerId === null) timerId = window.setInterval(tick, 1000);
  }

  // Rotate the complete 5x5 matrix 90 degrees clockwise in one 400 ms animation.
  // Tile objects move intact, preserving each letter's bonus type and color.
  function rotateBoardClockwise() {
    if (!roundActive || isPowerActionLocked()) return;
    cancelPowerModes();
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    const timerWasRunning = pauseRoundTimer();
    const chronoWasRunning = pauseChronoComboTimer();
    setActionsBusy(true);

    const rotated = gameLogic.rotateClockwise(tiles, SIZE);

    const token = refillToken;
    const animationDuration = 400;
    const centerIndex = Math.floor((SIZE * SIZE) / 2);

    // Place a non-interactive visual copy above the grid so the center tile's
    // border, letter, and bonus color remain completely stationary during rotation.
    cleanupRotateCenterOverlay();
    const centerTile = board.querySelector(`[data-index="${centerIndex}"]`);
    if (centerTile && boardStage) {
      const tileRect = centerTile.getBoundingClientRect();
      const stageRect = boardStage.getBoundingClientRect();
      const overlay = centerTile.cloneNode(true);
      overlay.classList.remove('action-rotate-counter', 'tile-flip', 'action-tile-flip', 'tile-refill-locked', 'bonus-hit');
      overlay.classList.add('rotate-center-overlay');
      overlay.removeAttribute('data-index');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.tabIndex = -1;
      overlay.style.left = `${tileRect.left - stageRect.left}px`;
      overlay.style.top = `${tileRect.top - stageRect.top}px`;
      overlay.style.width = `${tileRect.width}px`;
      overlay.style.height = `${tileRect.height}px`;
      centerTile.classList.add('rotate-center-hidden');
      boardStage.appendChild(overlay);
      rotateCenterOverlay = overlay;
      rotateCenterOriginal = centerTile;
    }

    board.classList.remove('board-rotate-spin');
    void board.offsetWidth;
    board.classList.add('board-rotate-spin');

    // Remove any leftover flip classes first so a newly-created Wild Letter does not
    // appear to flip during Rotate. All tiles, including Wild Letters, then use the
    // same clockwise board / counter-rotating face animation.
    board.querySelectorAll('.tile').forEach((tile) => {
      tile.classList.remove('tile-flip', 'action-tile-flip');
      tile.classList.add('action-rotate-counter');
    });

    // At the end, move the existing DOM tile nodes into their rotated grid order.
    // Updating each cell's content instead causes a one-frame bonus-color flash when
    // the source and destination colors differ. Reordering preserves each tile's
    // actual letter/bonus styling while the board transform is removed in the same task.
    scheduleRefillTimer(() => {
      const elementsBySourceIndex = new Map(
        Array.from(board.querySelectorAll('.tile')).map((tileElement) => [Number(tileElement.dataset.index), tileElement])
      );
      tiles = rotated;
      tiles.forEach((tileData, destinationIndex) => {
        const sourceIndex = gameLogic.rotateClockwiseSourceIndex(destinationIndex, SIZE);
        const tileElement = elementsBySourceIndex.get(sourceIndex);
        if (!tileElement) return;
        tileElement.dataset.index = String(destinationIndex);
        const letterValue = tileData.isWildLetter ? 1 : (LETTER_POINTS[tileData.letter.charCodeAt(0) - 64] || 0);
        tileElement.setAttribute('aria-label', `Row ${Math.floor(destinationIndex / SIZE) + 1}, column ${(destinationIndex % SIZE) + 1}, letter ${tileData.letter}, ${letterValue} points${tileData.bonus === 'NO' ? '' : `, ${tileData.bonus}`}`);
        board.appendChild(tileElement);
      });
      board.querySelectorAll('.action-rotate-counter').forEach((tile) => tile.classList.remove('action-rotate-counter'));
      board.classList.remove('board-rotate-spin');
      cleanupRotateCenterOverlay();
      setActionsBusy(false);
      resumeRoundTimer(timerWasRunning);
      resumeChronoComboTimer(chronoWasRunning);
    }, animationDuration + 60, token);
    renderActionCharges();
  }


  function activateWildLetter() {
    if (!roundActive || selectedRoundPower !== 'wild-letter' || wildLetterCharges <= 0 || isPowerActionLocked()) return;
    cancelPowerModes();
    wildLetterMode = true;
    wildLetterTargetIndex = null;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    el('word-feedback').textContent = 'Wild Letter: tap the tile to transform';
    renderActionCharges();
  }

  function openWildLetterPicker(index) {
    if (!wildLetterMode || !roundActive || wildLetterCharges <= 0 || isPowerActionLocked() || !Number.isInteger(index) || index < 0 || index >= tiles.length) return;
    wildLetterTargetIndex = index;
    board.querySelectorAll('.power-target-selected').forEach((tile) => tile.classList.remove('power-target-selected'));
    board.querySelector(`[data-index="${index}"]`)?.classList.add('power-target-selected');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay wild-letter-picker-overlay';
    overlay.innerHTML = '<section class="tutorial-card wild-letter-picker" role="dialog" aria-modal="true" aria-labelledby="wild-letter-picker-title"><p class="eyebrow">WILD LETTER</p><h2 id="wild-letter-picker-title">Choose a letter</h2><p>The selected tile will become this letter and be worth 1 point. This uses one charge.</p><div class="wild-letter-choices" role="group" aria-label="Choose wildcard letter"></div><div class="tutorial-actions"><button type="button" class="menu-button" data-wild-cancel>Cancel</button></div></section>';
    const choices = overlay.querySelector('.wild-letter-choices');
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wild-letter-choice';
      button.textContent = letter;
      button.addEventListener('click', () => {
        wildLetterLetter = letter;
        overlay.remove();
        transformTileIntoWildLetter(wildLetterTargetIndex);
      });
      choices.appendChild(button);
    });
    overlay.querySelector('[data-wild-cancel]').addEventListener('click', () => {
      overlay.remove();
      wildLetterTargetIndex = null;
      board.querySelectorAll('.power-target-selected').forEach((tile) => tile.classList.remove('power-target-selected'));
      el('word-feedback').textContent = 'Wild Letter: tap a tile to choose its letter, or tap Wild Letter to cancel';
      renderActionCharges();
    });
    document.body.appendChild(overlay);
  }

  function transformTileIntoWildLetter(index) {
    if (!wildLetterMode || !roundActive || wildLetterCharges <= 0 || isPowerActionLocked() || !Number.isInteger(index) || index < 0 || index >= tiles.length || !wildLetterLetter) return false;
    tiles[index] = { id: `wild-${nextWildLetterId++}`, letter: wildLetterLetter, bonus: 'NO', isWildLetter: true };
    wildLetterCharges -= 1;
    wildLetterMode = false;
    const chosenLetter = wildLetterLetter;
    wildLetterLetter = null;
    wildLetterTargetIndex = null;
    board.querySelectorAll('.power-target-selected').forEach((tile) => tile.classList.remove('power-target-selected'));
    updateTileElement(index);
    const tileElement = board.querySelector(`[data-index="${index}"]`);
    if (tileElement) {
      tileElement.classList.remove('tile-flip', 'action-tile-flip');
      void tileElement.offsetWidth;
      tileElement.classList.add('tile-flip', 'action-tile-flip');
      window.setTimeout(() => tileElement.classList.remove('tile-flip', 'action-tile-flip'), 180);
    }
    el('word-feedback').textContent = `Wild Letter created · ${chosenLetter} · 1 point`;
    renderActionCharges();
    return true;
  }

  function armRandomize() {
    if (!roundActive || isPowerActionLocked() || (randomizeCharges <= 0 && !randomizeMode)) return;
    const wasArmed = randomizeMode;
    cancelPowerModes();
    randomizeMode = !wasArmed;
    selectedIndices = [];
    isSelecting = false;
    clearSelectionStyles();
    el('word-feedback').textContent = randomizeMode ? 'Tap a tile to randomize its letter' : 'Drag across letters to select them';
    renderActionCharges();
  }

  function randomizeTileLetter(index) {
    if (!randomizeMode || !roundActive || isPowerActionLocked() || randomizeCharges <= 0 || !Number.isInteger(index) || index < 0 || index >= tiles.length || tiles[index]?.isWildLetter || tiles[index]?.isAnchored) return false;
    randomizeMode = false;
    randomizeCharges -= 1;
    randomizeWordProgress = 0;
    setActionsBusy(true);
    const token = refillToken;
    const flipDuration = 110;
    const flipCount = 3;
    const pickDifferentLetter = (oldLetter) => {
      let nextLetter = drawLetter();
      if (letterBag.length > 1) {
        let attempts = 0;
        while (nextLetter === oldLetter && attempts < 8) { nextLetter = drawLetter(); attempts += 1; }
      }
      return nextLetter;
    };

    // Three quick flips make the letter shuffle visible without a separate animation system.
    for (let flip = 0; flip < flipCount; flip += 1) {
      scheduleRefillTimer(() => {
        const tile = board.querySelector(`[data-index="${index}"]`);
        if (tile) {
          tile.classList.remove('tile-flip', 'action-tile-flip');
          void tile.offsetWidth;
          tile.classList.add('tile-flip', 'action-tile-flip');
        }
        scheduleRefillTimer(() => {
          const current = tiles[index];
          if (!current) return;
          // Keep bonus metadata (and therefore its theme-specific color) unchanged.
          tiles[index] = gameLogic.withRandomizedLetter(current, pickDifferentLetter(current.letter));
          updateTileElement(index);
          const updated = board.querySelector(`[data-index="${index}"]`);
          if (updated) updated.classList.add('tile-flip', 'action-tile-flip');
        }, Math.round(flipDuration / 2), token);
      }, flip * flipDuration, token);
    }
    scheduleRefillTimer(() => {
      const updated = board.querySelector(`[data-index="${index}"]`);
      if (updated) updated.classList.remove('tile-flip', 'action-tile-flip');
      setActionsBusy(false);
      el('word-feedback').textContent = 'Drag across letters to select them';
    }, flipCount * flipDuration + 10, token);
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
    tileElement.classList.toggle('wild-letter-tile', Boolean(tileData.isWildLetter));
    tileElement.classList.toggle('anchor-word-tile', Boolean(tileData.isAnchored));
    const bonusClass = tileData.isWildLetter ? '' : BONUS_CLASSES[tileData.bonus];
    if (bonusClass) tileElement.classList.add(bonusClass);
    tileElement.dataset.letter = tileData.letter;
    tileElement.dataset.bonus = tileData.bonus;
    tileElement.replaceChildren();
    const letterValue = tileData.isWildLetter ? 1 : (LETTER_POINTS[tileData.letter.charCodeAt(0) - 64] || 0);
    const face = document.createElement('span'); face.className = 'tile-letter'; face.textContent = tileData.letter;
    const value = document.createElement('sub'); value.className = 'tile-value'; value.textContent = String(letterValue);
    tileElement.append(face, value);
    const bonusLabel = ({ '2LS': '2L', '3LS': '3L', '2WS': '2W', '3WS': '3W' })[tileData.bonus];
    if (bonusLabel && !tileData.isWildLetter) { const mark = document.createElement('sup'); mark.className = 'tile-bonus-mark'; mark.textContent = bonusLabel; tileElement.appendChild(mark); }
    if (tileData.isWildLetter) tileElement.dataset.wildLetterId = tileData.id; else delete tileElement.dataset.wildLetterId;
    tileElement.setAttribute('aria-label', `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}, ${tileData.isWildLetter ? 'Wild Letter ' : ''}letter ${tileData.letter}, ${letterValue} points${tileData.isWildLetter ? ', wildcard tile' : (tileData.bonus === 'NO' ? '' : `, ${tileData.bonus}`)}`);
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

  function cleanupRotateCenterOverlay() {
    if (rotateCenterOverlay) rotateCenterOverlay.remove();
    if (rotateCenterOriginal) rotateCenterOriginal.classList.remove('rotate-center-hidden');
    rotateCenterOverlay = null;
    rotateCenterOriginal = null;
  }

  function cancelRefillSequence() {
    cleanupRotateCenterOverlay();
    if (bombBlastEffect) bombBlastEffect.remove();
    bombBlastEffect = null;
    hideBombTargetPreview();
    board.classList.remove('board-rotate-spin');
    board.querySelectorAll('.action-rotate-counter').forEach((tile) => tile.classList.remove('action-rotate-counter'));
    refillToken += 1;
    refillTimers.forEach((timer) => window.clearTimeout(timer));
    refillTimers.clear();
    board.querySelectorAll('.tile-flip, .tile-refill-locked, .bonus-hit, .power-move-animated').forEach((tile) => {
      tile.classList.remove('tile-flip', 'tile-refill-locked', 'bonus-hit', 'power-move-animated');
      tile.style.transition = '';
      tile.style.transform = '';
    });
    lockedTileIndices.clear();
    actionBusy = false;
    renderActionCharges();
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
          renderActionCharges();
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
          renderActionCharges();
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
      .filter(({ tile, index }) => tile.bonus === 'NO' && !tile.isWildLetter && !tile.isAnchored && !used.has(index) && !lockedTileIndices.has(index));
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
    if (!tiles[index] || tiles[index].isWildLetter || tiles[index].bonus !== 'NO' || lockedTileIndices.has(index)) return false;
    const tileElement = board.querySelector(`[data-index="${index}"]`);
    if (!tileElement) return false;
    lockedTileIndices.add(index);
    renderActionCharges();
    tileElement.classList.add('long-word-bonus-transform', 'tile-refill-locked');
    scheduleRefillTimer(() => {
      if (!tiles[index] || tiles[index].bonus !== 'NO') {
        lockedTileIndices.delete(index);
        renderActionCharges();
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
      renderActionCharges();
    }, 620, refillToken);
    return true;
  }

  function startGame() {
    // Persist the chosen configuration on the active round for later power implementations.
    gameScreen.dataset.roundPower = selectedRoundPower;
    hideChronoCombo();
    cancelPowerModes();
    stopTimers();
    cancelRefillSequence();
    makeLetterBag();
    makeBonusBag();
    tiles = Array.from({ length: SIZE * SIZE }, () => ({ letter: drawLetter(), bonus: drawBonus() }));
    selectedIndices = [];
    isSelecting = false;
    actionBusy = false;
    randomizeCharges = 0;
    randomizeWordProgress = 0;
    wildLetterCharges = selectedRoundPower === 'wild-letter' ? WILD_LETTER_CHARGES_PER_ROUND : 0;
    anchorWordCharges = selectedRoundPower === 'anchor-word' ? 1 : 0;
    anchorWordMode = false;
    wildLetterMode = false;
    wildLetterLetter = null;
    nextWildLetterId = 1;
    randomizeMode = false;
    bombCharges = 0;
    bombWordProgress = 0;
    bombMode = false;
    swapCharges = 0;
    swapWordProgress = 0;
    swapMode = false;
    swapFirstIndex = null;
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
    el('pause-overlay').hidden = true;
    isPaused = false;
    pausedComboTimer = false;
    el('pause-button').textContent = 'Ⅱ';
    el('pause-button').disabled = false;
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
    if (!roundActive || isPaused) return;
    secondsLeft = Math.max(0, secondsLeft - 1);
    updateCountdown();
    if (secondsLeft === 0) endGame();
  }

  // Every accepted valid word receives one additive time award from the authoritative rules.
  function awardTimeBonus(indices) {
    const award = scoringRules.calculateTimeAward(tiles, indices, secondsLeft, MAX_TIME_SECONDS);
    const added = award.added;
    secondsLeft = award.newSecondsLeft;
    sessionTimeBonus += added;
    updateCountdown();

    const indicator = el('time-bonus');
    indicator.textContent = added === 0
      ? 'TIME MAX'
      : (award.extra > 0 ? `+${added}s BONUS` : `+${added}s`);
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
    }, 2100);
    return added;
  }

  function stopChronoComboTicker() {
    if (chronoComboIntervalId !== null) {
      window.clearInterval(chronoComboIntervalId);
      chronoComboIntervalId = null;
    }
  }

  // Freeze the Chrono Combo deadline during an action animation, preserving its remaining time.
  function pauseChronoComboTimer() {
    if (chronoComboPausedRemainingMs !== null) return true;
    if (chronoComboLevel <= 0) return false;
    const remainingMs = chronoComboDeadline - Date.now();
    if (remainingMs <= 0) {
      expireChronoCombo();
      return false;
    }
    chronoComboPausedRemainingMs = remainingMs;
    stopChronoComboTicker();
    return true;
  }

  function resumeChronoComboTimer(wasRunning) {
    if (!wasRunning || chronoComboPausedRemainingMs === null || !roundActive || chronoComboLevel <= 0) return;
    chronoComboDeadline = Date.now() + chronoComboPausedRemainingMs;
    chronoComboPausedRemainingMs = null;
    renderChronoCombo();
    stopChronoComboTicker();
    chronoComboIntervalId = window.setInterval(renderChronoCombo, 100);
  }

  function hideChronoCombo() {
    stopChronoComboTicker();
    if (chronoComboClearTimeout !== null) {
      window.clearTimeout(chronoComboClearTimeout);
      chronoComboClearTimeout = null;
    }
    chronoComboLevel = 0;
    chronoComboDeadline = 0;
    chronoComboPausedRemainingMs = null;
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
    chronoComboPausedRemainingMs = null;
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
    if (chronoComboClearTimeout !== null) {
      window.clearTimeout(chronoComboClearTimeout);
      chronoComboClearTimeout = null;
    }
    chronoComboIndicator?.classList.remove('chrono-combo-expired');

    const transition = scoringRules.calculateComboTransition(
      chronoComboLevel,
      chronoComboDeadline,
      now,
      CHRONO_COMBO_WINDOW_MS,
      CHRONO_COMBO_MAX_SECONDS
    );
    chronoComboLevel = transition.level;
    chronoComboDeadline = transition.deadline;
    const requestedReward = transition.requestedReward;
    const rewardPoints = transition.rewardPoints;

    stopChronoComboTicker();
    renderChronoCombo();
    chronoComboIntervalId = window.setInterval(renderChronoCombo, 100);
    return {
      level: transition.level,
      rewardSeconds: transition.rewardSeconds,
      requestedReward,
      rewardPoints,
      secondsRemaining: transition.secondsRemaining
    };
  }

  const ACHIEVEMENTS = {
    amplifier: { title: 'Elder Tongue', detail: 'Find a 7-letter word for a ×2 Amplifier.' },
    combo4: { title: 'Momentum', detail: 'Reach a four-word Chrono Combo.' },
    chronoCap: { title: 'Timekeeper', detail: 'Fill the Chrono Combo timer to 20 seconds.' }
  };

  function unlockAchievement(id) {
    if (stats.achievements[id]) return;
    stats.achievements[id] = true;
    roundMilestones.push(ACHIEVEMENTS[id].title);
  }

  function endGame() {
    if (!roundActive) return;
    roundActive = false;
    isPaused = false;
    el('pause-overlay').hidden = true;
    isSelecting = false;
    selectedIndices = [];
    cancelPowerModes();
    cancelRefillSequence();
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
    const roundRecord = gameLogic.summarizeRound({
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
      durationSeconds: elapsedSeconds
    });
    stats.rounds.unshift({
      ...roundRecord,
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
    el('result-average-score').textContent = roundRecord.averagePointsPerWord.toFixed(1);
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
    if (multiplier <= 1) return '';
    return `WORD AMPLIFIER ×${multiplier.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
  }

  function scoreWord(indices) {
    return scoringRules.calculateWordScore(tiles, indices, LETTER_POINTS);
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
    if (anchorWordMode && selectedIndices.length >= MAX_CHAIN_TILES) {
      el('word-feedback').textContent = `Chain limit: ${MAX_CHAIN_TILES} tiles maximum`;
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
    if (anchorWordMode) {
      if (selectedIndices.length < 2) {
        selectedIndices = []; clearSelectionStyles();
        el('word-feedback').textContent = 'Chain needs at least two connected tiles';
        return;
      }
      const anchoredIndices = [...selectedIndices];
      anchoredIndices.forEach((index) => { tiles[index].isAnchored = true; });
      anchorWordCharges = 0;
      anchorWordMode = false;
      selectedIndices = [];
      clearSelectionStyles();
      renderBoard();
      renderActionCharges();
      el('current-word').textContent = word;
      el('word-feedback').textContent = `Chain created · ${anchoredIndices.length} tiles protected while you wait to extend a word`;
      return;
    }
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
    grantActionCharges(word.length);
    // Keep the round breakdown additive: original scoring first, then Amplifier, then Combo.
    sessionWordAndTileScore += result.baseTotal;
    sessionAmplifierBonus += result.amplifierBonus;
    sessionComboBonus += comboResult.rewardPoints;
    sessionHighestCombo = Math.max(sessionHighestCombo, comboResult.level);
    if (result.amplifierMultiplier >= 2) unlockAchievement('amplifier');
    if (comboResult.level >= 4) unlockAchievement('combo4');
    if (comboResult.secondsRemaining >= CHRONO_COMBO_MAX_SECONDS) unlockAchievement('chronoCap');
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
    el('word-feedback').textContent = 'Word accepted';
    const scoreGain = el('score-gain');
    const scoreGainParts = [`+${result.total.toLocaleString()} WORD PTS`];
    if (result.amplifierMultiplier > 1) scoreGainParts.push(amplifierText);
    if (comboResult.rewardPoints > 0) scoreGainParts.push(`COMBO +${comboResult.rewardPoints}`);
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
    }, 4000);
    selectedIndices = [];
    clearSelectionStyles();
    // Lock only the consumed tiles. All other tiles stay available during refill.
    usedIndices.forEach((index) => {
      lockedTileIndices.add(index);
      const lockedTile = board.querySelector(`[data-index="${index}"]`);
      if (lockedTile) lockedTile.classList.add('tile-refill-locked');
    });
    renderActionCharges();
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

  function showRoundPowerSelection() {
    el('tutorial-overlay').hidden = true;
    el('round-power-overlay').hidden = false;
    updateRoundPowerSelection();
  }

  function updateRoundPowerSelection() {
    const labels = { 'wild-letter': 'Wild Letter · Transform a tile into any letter worth 1 point · 3 charges.', 'anchor-word': `Chain · Protect 2–${MAX_CHAIN_TILES} connected tiles while waiting for letters like S, ER, or ING · 1 charge.` };
    document.querySelectorAll('[data-round-power]').forEach((button) => {
      const isSelected = button.dataset.roundPower === selectedRoundPower;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-checked', String(isSelected));
    });
    el('round-power-status').textContent = labels[selectedRoundPower] || labels['wild-letter'];
  }

  function requestNewGame() {
    if (!stats.tutorialSeen) {
      el('tutorial-overlay').hidden = false;
      return;
    }
    showRoundPowerSelection();
  }

  function dismissTutorialAndStart() {
    stats.tutorialSeen = true;
    saveStats();
    showRoundPowerSelection();
  }

  document.querySelectorAll('[data-round-power]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedRoundPower = button.dataset.roundPower;
      updateRoundPowerSelection();
    });
  });
  el('round-power-start-button').addEventListener('click', () => {
    el('round-power-overlay').hidden = true;
    startGame();
  });
  el('round-power-cancel-button').addEventListener('click', () => {
    el('round-power-overlay').hidden = true;
    showScreen('front');
  });

  el('new-game-button').addEventListener('click', requestNewGame);
  el('tutorial-start-button').addEventListener('click', dismissTutorialAndStart);
  el('tutorial-skip-button').addEventListener('click', dismissTutorialAndStart);
  el('stats-button').addEventListener('click', () => { renderStats(); showScreen('stats'); });
  el('stats-back-button').addEventListener('click', () => showScreen('front'));
  el('settings-button').addEventListener('click', () => showScreen('settings'));
  el('settings-back-button').addEventListener('click', () => showScreen('front'));
  el('theme-classic-choice').addEventListener('click', () => document.body.classList.remove('theme-style2'));
  el('theme-style2-choice').addEventListener('click', () => document.body.classList.add('theme-style2'));
  function pauseGame() {
    if (!roundActive || isPaused || el('countdown-overlay').hidden === false) return;
    isPaused = true;
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
    pausedComboTimer = pauseChronoComboTimer();
    el('pause-overlay').hidden = false;
    el('pause-button').textContent = '▶';
    el('pause-button').setAttribute('aria-label', 'Resume game');
    el('resume-button').focus();
  }
  function resumeGame() {
    if (!isPaused || !roundActive) return;
    isPaused = false;
    el('pause-overlay').hidden = true;
    timerId = window.setInterval(tick, 1000);
    resumeChronoComboTimer(pausedComboTimer);
    pausedComboTimer = false;
    el('pause-button').textContent = 'Ⅱ';
    el('pause-button').setAttribute('aria-label', 'Pause game');
    el('pause-button').focus();
  }
  function returnToMenu() {
    isPaused = false;
    el('pause-overlay').hidden = true;
    roundActive = false;
    hideChronoCombo();
    stopTimers();
    cancelPowerModes();
    cancelRefillSequence();
    showScreen('front');
  }
  el('pause-button').addEventListener('click', () => isPaused ? resumeGame() : pauseGame());
  el('resume-button').addEventListener('click', resumeGame);
  el('game-menu-button').addEventListener('click', returnToMenu);
  el('wild-letter-action').addEventListener('click', () => {
    if (selectedRoundPower === 'anchor-word') {
      if (anchorWordMode) {
        anchorWordMode = false; selectedIndices = []; isSelecting = false; clearSelectionStyles();
        board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover'));
        el('word-feedback').textContent = 'Chain selection cancelled';
      } else if (roundActive && anchorWordCharges > 0 && !isPowerActionLocked()) {
        cancelPowerModes(); anchorWordMode = true; selectedIndices = []; isSelecting = false; clearSelectionStyles();
        el('word-feedback').textContent = 'Chain: drag across connected tiles to protect them';
      }
      renderActionCharges(); return;
    }
    if (wildLetterMode) {
      wildLetterMode = false; wildLetterLetter = null; wildLetterTargetIndex = null;
      board.querySelectorAll('.power-target-selected, .power-target-hover').forEach((tile) => tile.classList.remove('power-target-selected', 'power-target-hover'));
      el('word-feedback').textContent = 'Wild Letter placement cancelled'; renderActionCharges();
    } else activateWildLetter();
  });
  el('rotate-action').addEventListener('click', rotateBoardClockwise);
  el('randomize-action').addEventListener('click', armRandomize);
  el('bomb-action').addEventListener('click', armBomb);
  el('swap-action').addEventListener('click', armSwap);
  el('play-again-button').addEventListener('click', requestNewGame);
  el('results-menu-button').addEventListener('click', () => { el('game-over').hidden = true; showScreen('front'); });

  board.addEventListener('pointerdown', (event) => {
    if (!roundActive || actionBusy || event.button > 0) return;
    event.preventDefault();
    if (bombMode) {
      bombGesturePointerId = event.pointerId;
      bombGestureTarget = captureBombTargetAtPoint(event.clientX, event.clientY);
      if (bombGestureTarget) updateBombTargetPreview(event.clientX, event.clientY);
      else hideBombTargetPreview();
      board.setPointerCapture?.(event.pointerId);
      return;
    }
    const tile = event.target.closest('.tile');
    if (!tile) return;
    if (randomizeMode || swapMode || wildLetterMode || anchorWordMode) {
      board.querySelectorAll('.power-target-hover').forEach((item) => item.classList.remove('power-target-hover'));
      tile.classList.add('power-target-hover');
    }
    if (swapMode) {
      const index = Number(tile.dataset.index);
      if (tiles[index]?.isWildLetter || tiles[index]?.isAnchored) { el('word-feedback').textContent = tiles[index]?.isAnchored ? 'Chained tiles cannot be swapped' : 'Wild Letter tiles cannot be swapped'; return; }
      if (swapFirstIndex === null) {
        swapFirstIndex = index;
        tile.classList.add('power-target-selected');
        el('word-feedback').textContent = 'Swap: select the second tile';
        renderActionCharges();
      } else useSwap(swapFirstIndex, index);
      return;
    }
    if (randomizeMode) { const targetIndex = Number(tile.dataset.index); if (tiles[targetIndex]?.isWildLetter || tiles[targetIndex]?.isAnchored) { el('word-feedback').textContent = tiles[targetIndex]?.isAnchored ? 'Chained tiles cannot be randomized' : 'Wild Letter tiles cannot be randomized'; return; } randomizeTileLetter(targetIndex); return; }
    if (wildLetterMode) { openWildLetterPicker(Number(tile.dataset.index)); return; }
    isSelecting = true;
    selectedIndices = [];
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    pointerTracePoints = [{ x: event.clientX, y: event.clientY }];
    board.setPointerCapture?.(event.pointerId);
    selectTile(Number(tile.dataset.index));
  });
  board.addEventListener('pointermove', (event) => {
    if (bombMode && roundActive && !actionBusy) {
      board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover'));
      updateBombAimIcon(event.clientX, event.clientY);
      if (bombGesturePointerId === event.pointerId) {
        // While the player is pressing, update the captured target only when the
        // pointer is within a bounded acquisition radius of a real intersection.
        const candidate = captureBombTargetAtPoint(event.clientX, event.clientY);
        if (candidate) {
          bombGestureTarget = candidate;
          updateBombTargetPreview(event.clientX, event.clientY);
        } else if (!bombGestureTarget) {
          hideBombTargetPreview();
        }
      } else {
        updateBombTargetPreview(event.clientX, event.clientY);
      }
      return;
    }
    if ((randomizeMode || swapMode || wildLetterMode) && roundActive && !actionBusy) {
      const targetIndex = tileIndexFromPoint(event.clientX, event.clientY);
      board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover'));
      if (targetIndex >= 0) {
        const targetTile = board.querySelector(`[data-index="${targetIndex}"]`);
        if (targetTile) targetTile.classList.add('power-target-hover');
      }
      return;
    }
    board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover'));
    if (anchorWordMode && roundActive && !actionBusy) {
      const hoverIndex = tileIndexFromPoint(event.clientX, event.clientY);
      if (hoverIndex >= 0) board.querySelector(`[data-index="${hoverIndex}"]`)?.classList.add('power-target-hover');
    }
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
  function pointerEnd(event) {
    if (bombMode && roundActive && !actionBusy && event) {
      if (bombGesturePointerId !== null && event.pointerId !== bombGesturePointerId) return;
      const target = bombGestureTarget;
      const isCancellation = event.type === 'pointercancel';
      bombGestureTarget = null;
      bombGesturePointerId = null;
      hideBombTargetPreview();
      if (!isCancellation && isReleaseNearBombTarget(target, event.clientX, event.clientY)) {
        useBombAt(target.row, target.col);
      } else if (!isCancellation && target) {
        el('word-feedback').textContent = 'Bomb cancelled · release closer to the highlighted target';
      }
      return;
    }
    if (!isSelecting) return;
    isSelecting = false;
    lastPointerX = null;
    lastPointerY = null;
    finishSelection();
  }
  board.addEventListener('pointerleave', () => { if (bombMode) hideBombTargetPreview(); board.querySelectorAll('.power-target-hover').forEach((tile) => tile.classList.remove('power-target-hover')); });
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
