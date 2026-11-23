# Points into squares, the board's numbers, two reveal glitches

Read `README.md` first. Diagnosed read-only on 23/11/2026, lines from
`7ded3593`.

## 1. A perfect answer must walk further than an imperfect one

Adrien, on a Timeline reveal (photo): "Adrien has 'in order' but moves one
square; Marinette and Bichette have 2 inverted pairs and also move one
square. Wtf? We keep touching the points system, something is off. Someone
who got everything right should get more points and/or move more squares."

**What happened that round (probable)**: Adrien stood on 99 and earned 3
squares, capped to +1 by the finish (`board-strategy.ts:101`,
`min(move + bonus, length - from)`); the two others honestly earned +1. But
**all three ranked "1" is a bug (confirmed)**: `RoundPodium` ranks by
squares walked after the cap (`round-podium.tsx:93-103`, `walkedBy` →
`board.move`), so 1 = 1 = 1, and the stable sort even lists the only perfect
answer last.

**The audit found real flaws beyond that round** (all confirmed in code):

- Points → squares is `onePointOneCase` (`packages/core/src/board/one-point-one-case.ts:131`,
  default at `packages/protocol/src/board.ts:87`): `floor(answerPoints / 30)`.
  Timeline pays 100 / 66.7 / 33.3 / 0 for 0 / 1 / 2 / 3+ swapped pairs
  (`packages/core/src/timeline/order-pay.ts:217-229`), so 3 / 2 / 1 squares —
  and 2 swaps lands on exactly 30 000 through `Math.round(29999.7)`, a
  rounding edge.
- **Catch-up** (`board-strategy.ts:97`): a lone last pawn gets +1, so one swap
  + catch-up = 3 = perfect; on the `rank` strategy second place + catch-up
  equals first.
- **Games not paid for speed** (`packages/core/src/scoring/verdict.ts:197-203`:
  colour, place, number, count, cells, match) and every game when
  `paysForSpeed` is off: anything ≥ 90 walks 3, the same as perfect — a
  swatch within ~0.029 (`swatch/colour-pay.ts:26-33`), an estimate or a pin
  near enough.
- Coarse buckets: 29 scores and walks 0; 30 and 59 both walk 1.

**Decided rule**:

- The top step is reserved for a perfect answer:
  `squares = isPerfect ? 3 : min(2, floor(answer / 30))`. The award carries a
  `perfect` flag — each game already knows it (`isPerfectOrder`,
  `isExactColour`, an exact count, a right pick…). Protocol addition.
- Catch-up never lifts a pawn level with a better answer of the same round:
  it applies only to a pawn that scored but walked 0, or is capped below the
  next better answer's move.
- Ranking and display read the **uncapped** move and the answer
  (`award.points - award.speedBonus`, speed breaking ties), never
  `board.move`. A capped move says it reached the finish (a string of its
  own, e.g. "Arrivée") rather than "+1 case".
- Write the rule's table into `docs/` beside the board's doc and test it game
  by game in core (perfect > every imperfect answer, on both strategies, with
  and without `paysForSpeed`). Break each test once.

Weigh whether `rank` and catch-up still earn their place once this lands, and
say so in the plan record rather than silently keep them.

## 2. The board's numbers sit in a corner

Adrien: "the square numbers are not centred in them, is it on purpose?"
(mostly on the host/wall). It is deliberate today: `.number` is
`position: absolute; inset: 0.3em auto auto 0.45em`
(`apps/game/src/presentation/components/board-track.sass:176-184`) to leave
room for bottom-anchored pawns (`:216-224`; `pawnScaleFor`,
`board-track.tsx:391`). **Decided**: centred on an empty square; on a square
holding a pawn (`.case:has(> .pawns > .standing)`) it moves to top-centre,
with a transition (rule 0). Keep the glyph-hiding rule at `:209`. Check the
smallest squares: a 390 px wall at length 100.

## 3. Shades reveal: a card without a "+N cases" line drops

Photo: Ben's card sits lower than the others. Ben scored between 0 and 30, so
walked 0; `AwardFigure` returns `null` on a track when `walked === 0`
(`round-podium.tsx:205-206`) — the `'0'` fallback only fires on
`points === 0` — and the cell's `grid-template-rows: minmax(0,1fr) auto auto`
(`swatch-guesses.sass:81`) lets the chip slide down (`:98`). **Fix**: reserve
the line (`1lh` row or a `min-block-size` placeholder), and say "+0" to a
seat that walked nothing. The same null in `RoundPodium` and `SeatedResult`
(`apps/game/src/features/host/reveal-panel.tsx:797`) can unbalance other
reveals: check them.

## 4. The reveal repeats its rows in a second list

Adrien's note during play, which he no longer remembers the reason for:
"correct the squares in a second list instead of putting them in the line
already present above". **Best reading (confirmed in code)**: `Outcome`
(`reveal-panel.tsx:531-536, 670-723`) draws `RoundPodium`, whose rows already
print what each seat said (`round-podium.tsx:150-155`, `wordsOf`), then a
second `<ul className='tally'>` of ticked chips grouped by answer
(`:706-723`) — on the Timeline photo it repeats "2 paires inversées" and
"Dans l'ordre" under rows that already say it. **Decided**: drop the tally
when every chip's text is already on a podium row; keep it where it carries
something the rows don't (a blind test nobody found: the chips are the only
place the wrong answers appear).

## Done when

Core tests hold the rule; a Timeline round with a perfect and an imperfect
answer, near the finish and far from it, shows the right ranks and moves on
wall and phones; numbers centred and filmed moving aside for a pawn; Shades
reveal aligned with a 0-square seat; no repeated list. Changelog, the board's
doc, delete this file and its README row.
