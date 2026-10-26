# Word Scavenger — Authoritative Scoring and Timer Rules

This document is the single source of truth for scoring and time calculations in the browser game. The matching pure calculation functions live in `js/scoring-rules.js`; deterministic regression tests live in `tests/scoring-rules.test.js`.

## Word score calculation

1. Add each selected letter's existing custom point value.
2. Apply the tile's letter multiplier to that letter only: `2LS` ×2 or `3LS` ×3.
3. Multiply the resulting letter subtotal by the product of any used word multipliers: each `2WS` ×2 and each `3WS` ×3.
4. Apply Word Amplifier once to that subtotal and round the final word score to the nearest integer.
5. Word Amplifier tiers:

| Word length | Score multiplier | Main-timer length reward | Maximum total time reward for the word |
|---|---:|---:|---:|
| 3 letters | ×1.0 | +2 s | 10 s |
| 4 letters | ×1.25 | +4 s | 15 s |
| 5 letters | ×1.5 | +6 s | 20 s |
| 6 letters | ×1.75 | +8 s | 25 s |
| 7+ letters | ×2.0 | +10 s | 30 s |

The score breakdown is additive: `base letter/word-bonus score + Word Amplifier bonus + Chrono Combo score reward = total points earned for the accepted word`. The amplifier bonus is the rounded final word score minus the pre-amplifier subtotal. Combo score is tracked separately and is never multiplied by Word Amplifier.

## Main timer rewards

- Starting timer: 120 seconds.
- Overall timer maximum: 180 seconds.
- The word-length reward is +2 seconds for 3 letters, +4 for 4, +6 for 5, +8 for 6, and +10 for 7+ letters. There is no separate universal +2-second reward.
- Each used `2LS` tile adds +2 seconds; `3LS` adds +3 seconds; `2WS` adds +2 seconds; `3WS` adds +3 seconds.
- Sum the word-length reward and applicable bonus-tile rewards, apply the per-word cap for that word length, then apply the overall 180-second cap.
- The game records `timeBonusSeconds` as the actual number of seconds added to the main timer after both caps, accumulated across the round. It is not the current timer value and is not the Chrono Combo countdown reward.
- A word that would exceed the overall timer cap records only the seconds actually added. If the timer is already at 180 seconds, that word adds zero seconds to `timeBonusSeconds`.

## Chrono Combo

- The first valid word starts a 7-second combo countdown and awards no combo score.
- Level 2: +100 points and +3 seconds added to the remaining combo countdown.
- Level 3: +300 points and +4 seconds added to the remaining combo countdown.
- Level 4 and later: +500 points and +5 seconds added to the remaining combo countdown per accepted word.
- The combo countdown is capped at 20 seconds. A new streak after expiry starts at level 1 with 7 seconds.
- Chrono Combo time never increases the main timer.
- Invalid words do not score, grant time, advance the combo, or earn power charges.

## Exactly-once processing and saved metrics

- Only a dictionary-accepted word can enter the scoring/reward path.
- Word score, main timer reward, combo transition, and power-charge progress are processed in the valid-word submission path, not in refill-animation callbacks.
- Refill animations must not reapply score, timer rewards, combo rewards, or charge progress.
- Each saved round's `timeBonusSeconds` is the cumulative actual main-timer seconds awarded. `durationSeconds` is derived as `max(0, startingSeconds + timeBonusSeconds - secondsRemaining)`; it estimates active round time from the timer equation and must not be presented as cumulative bonus time.
- The score breakdown fields `wordAndTileScore`, `amplifierBonus`, and `comboBonus` must sum to `finalScore` for a completed round.

## Power-charge long-word conditions

- Bomb: one charge for a qualifying word of 6 or more letters, or on the regular 10-word milestone; maximum 3 stored charges.
- Swap: one charge for a qualifying word of 7 or more letters, or on the regular 15-word milestone; maximum 3 stored charges.
- **Words of 6 or more letters do not count toward either the Bomb 10-word or Swap 15-word milestone.** They can award an immediate long-word charge when they meet that power's threshold, but they do not advance or reset the regular milestone progress.
- Regular milestone progress is tracked independently for Bomb and Swap and advances only on accepted valid words shorter than 6 letters.
- A single accepted word awards at most one charge to each power. A 6-letter word can award Bomb but does not award Swap; a 7+ letter word can award one charge to each power. If a power is already at its 3-charge cap, it earns no charge and its milestone progress remains reset while full.

## Marble Bag letter balance

- During ordinary tile generation, the engine prefers letters that would not exceed four copies of the same ordinary letter on the projected board.
- Wild Letter tiles are excluded from this ordinary-letter count.
- This is a soft cap: if no eligible letter remains in the selected letter sub-bag, a fallback draw is allowed so generation cannot stall. Letter and bonus bags remain independent and depleted bags replenish only when a draw is requested.


## Wild Letter selector and timer policy

- Activating Wild Letter arms the power but does not select a board tile. The player must perform a separate, completed pointer gesture that starts and ends on the same tile, stays within the 12 CSS-pixel movement threshold, and occurs after the 450 ms activation guard.
- The target-tile gesture must not also choose a letter in the picker. Letter selection requires a fresh pointer-down on an enabled picker letter button before its click is accepted.
- The main timer and Chrono Combo continue while the player is choosing a target tile. They pause when the letter picker opens and resume only if each timer was running before the picker opened. Cancelling the picker does not spend a Wild Letter charge or reserve a letter.
- Wild Letter letters are unique within a round. A letter is reserved only after successful creation, remains unavailable if its tile is later consumed or destroyed, and becomes available again in the next round.

## Deterministic verification

Run `node tests/scoring-rules.test.js` from the project root. This checks scoring arithmetic, word-length tiers, additive time rewards, per-word and overall caps, combo progression/expiry, charge milestone exclusion/progress, and static animation-lock/timer-policy guards. These tests do not replace interactive browser regression testing.


## Round summary and persistent records

- A completed round stores `finalScore`, `wordsFound`, `longestWord`, `highestWord`, `highestWordScore`, `averagePointsPerWord`, `highestCombo`, `timeBonusSeconds`, and the additive score-breakdown components.
- `averagePointsPerWord` is `finalScore / wordsFound` (zero for a round with no valid words); it includes Chrono Combo score because the metric is average total points per accepted word.
- The score breakdown must satisfy `wordAndTileScore + amplifierBonus + comboBonus = finalScore`.
- Main-menu personal best, Stats, Recent Games, and Round Complete must read the same persisted `wordScavengerBrowserStats` record. A new round resets transient counters and armed powers but must not erase that persistent record.

## Board-power invariants

- Rotate maps the 5×5 matrix 90 degrees clockwise using tile-object identity, so letters and bonus metadata move together; the center tile maps to itself and four rotations restore the original arrangement.
- Randomize replaces only the chosen tile's letter. The tile object is copied with all other properties, including bonus metadata, and one charge is deducted once per accepted activation.
- Bomb clears the selected 2×2 block, lets tiles above fall into those positions, generates replacements only in the newly empty cells above, and leaves all other columns and tiles below the block unchanged.
- Swap exchanges two tile objects and leaves every other board position unchanged.
- Ending a round invalidates scheduled refill/action callbacks so they cannot mutate the completed board after game-over.
