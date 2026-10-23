# Word Scavenger — Marble Bag Implementation Notes

## Architecture

`js/marble-bag.js` owns the bag definitions, shuffling, drawing, independent replenishment, board-balancing decisions, and weighted Long Word Bonus assignment. `js/game.js` continues to own board rendering, power interactions, scoring flow, and animations. `js/game-logic.js` supplies the Bomb gravity transformation with a projected board so generated replacement tiles can be balanced sequentially.

The active bags are in-memory and are recreated for each new round. Bag state is not written to `localStorage`. Every bag draws without replacement and is replenished only when a draw is requested while that particular bag is empty. Bags replenish independently.

## Letter bags

- Letter category bag: 100 entries (38 vowel, 62 consonant).
- Vowel bag: 96 entries (A 19, E 31, I 16, O 19, U 11).
- Consonant subgroup selector: 154 entries (118 common, 36 uncommon).
- Common consonant bag: 118 entries (T 20, R 17, N 17, S 13, L 10, G 10, D 8, C 8, M 8, H 7).
- Uncommon consonant bag: 36 entries (P 5, B 5, F 5, W 5, Y 5, V 4, K 2, Q 2, J 1, X 1, Z 1).

If board balancing forces a vowel/consonant category, the top-level category bag is bypassed and left unchanged. If balancing forces a common/uncommon subgroup, its selector is bypassed too. The required letter sub-bag supplies the draw.

## Bonus bags

- Bonus category bag: 100 entries (70 normal, 30 bonus).
- Normal tile bag: 175 entries.
- Bonus type bag: 75 entries (2LS 25, 3LS 20, 2WS 18, 3WS 12).

If board balancing forces normal/bonus, the top-level bonus category bag is bypassed. A bonus draw still consumes an entry from the bonus type bag.

## Initial board-balancing thresholds

- Vowels: keep the completed board between 8 and 12 vowels.
- Uncommon consonants: keep the completed board between 2 and 5 uncommon consonants, when consonant draws are available.
- Bonus tiles: keep the completed board between 5 and 10 bonus tiles (20%-40% of the 25-tile board). This is the initial tolerance around the intended 70% normal / 30% bonus distribution and can be tuned later.
- Priority: vowel/consonant first, common/uncommon second, normal/bonus third.
- Wild Letter tiles count as normal tiles for bonus balancing and count as vowels/consonants according to their chosen letter.
- Initial board generation and refills process one tile at a time. Every generated tile is added to the projected board before the next tile is chosen.

## Power interactions

- Ordinary refills and Bomb replacement tiles draw a letter and bonus through the engine.
- Randomize returns the outgoing letter to its corresponding letter sub-bag, then draws one final replacement through the normal letter-selection logic. The same letter is allowed. Its existing bonus is preserved. The existing three-flip visual sequence remains in place; its first two transient preview letters do not consume bag entries.
- Swap and Rotate do not draw from bags.
- Wild Letter bypasses the letter and bonus bags and remains unbonused.
- Long Word Bonus does not consume the bonus bag. Normal tiles receive a weighted bonus assignment with replacement using 2LS 25/75, 3LS 20/75, 2WS 18/75, and 3WS 12/75. Existing 2LS upgrades to 3LS, 2WS upgrades to 3WS, and 3LS/3WS remain unchanged. Wild Letter and anchored tiles are excluded.

## Validation

`tests/marble-bag.test.js` covers pool sizes, forced-draw bypass behavior, replenishment timing, board safeguards, Randomize return behavior, and Long Word Bonus weighting. Existing project regression tests should also be run after changes to the engine or game integration.
