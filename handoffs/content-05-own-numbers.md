# Content, part 5 — Le juste chiffre and Plus ou moins with their own numbers

Read `docs/plans/68-evening-content.md` first. Both games share the quantity
bank, and both have the same gap, so do them together.

## The gap

**No free-text prompt exists.** `estimateQuestionSchema` is
`{ family: <one of 11>, names }` (`packages/protocol/src/estimate.ts:57`). The
sentence comes from the dictionary per family, and the unit is fixed to one of
4 (`UNIT_OF_FAMILY`). The pair in Plus ou moins has the same limit
(`higher-lower.ts:31`).

A deck item needs a new arm on the round's content, `{ prompt, unit, value }`
for an estimate and `{ prompt, unit, left, right }` for a pair, and the screens
have to render it beside the family arm. That is UI work: start with
`impeccable`, verify muted, and film it.

## Build

- **Estimate:**
  - Item: `prompt` (the question as said), `unit` (free, short), and `value`
    (positive, at most `1e15`), with at most 30 items.
  - Seam: `round-conductor.ts:557`, before `drawQuantity`.
  - Players get no value before the reveal (`room-view.ts:632-637`).
- **Plus ou moins:**
  - Item: one `prompt` (the comparison) and `unit`, plus two named sides with
    positive values, with at most 30 pairs.
  - Seam: `round-conductor.ts:591`, before `drawPairs`. The higher side comes
    from `higherSideOf`.
  - Values arrive only in `revealedPairs` (`room-view.ts:644-653`).
- **The scoring trap goes in the validator and in the assistant's paragraph.**
  Estimate pays by ratio (`packages/core/src/estimate/estimate-pay.ts`: spot on
  within ×1.02, nothing beyond ×3).
  - A year, a percentage, a rank or an age near a known value scores
    absurdly: 1990 against 1995 counts as spot on. An assistant will propose
    "in what year…" first.
    - Refuse a `unit` that names a year or a percentage. A value between
      1000 and 2100 with no unit reads as a year: refuse it, and say so.
    - Tell the assistant to ask for quantities: counts, lengths, weights,
      durations, money.
  - A pair whose values sit below a ratio of 1.15 is refused (the bank's own
    fairness floor, `pair-deal.ts:140`), and so are equal values.

## Tests

- `[estimate]` and `[higherlower]`:
  - a deck is dealt first;
  - values are withheld until the reveal;
  - the validator refuses a year-like value and a near tie.
- `[mcp]` round trips for both.

## Done when

Seen in the browser (a family estimate, _how many kilometres did we drive
this summer_, played on two phones; a pair revealed), then the changelog entry,
plan 68's table, this file and its `handoffs/README.md` row ship in one commit,
pushed to `main`.
