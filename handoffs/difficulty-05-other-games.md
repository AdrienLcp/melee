# Difficulty, part 5 — the timeline and every other game that can take a level

Wave 3, beside part 4, after parts 1–3 (rules and Adrien's words in
`difficulty-01-setting.md`). The last session of the series: it also closes
it (see the end).

## Timeline — leave `mixed` alone

> Pour la frise je trouve ça normal d'avoir des évènements proches, ça pour le
> coup je ne remets pas la difficulté de ce jeu en question.

So `mixed` and `hard` deal exactly as today (`packages/core/src/timeline/deal.ts:27-51`,
`MIN_YEARS_APART = 5` at `:8`). Only `easy` changes, for a table of children:
events at least ~30 years apart, drawn from an `easy` tier. The bank
(`timeline-bank.json`, 214 events, 7 themes) has no fame field: tier the
events — by hand is fine at 214, or from French Wikipedia traffic as part 3
does. Grow the bank if `easy` ends up too thin to fill five events thirty
years apart for an evening.

## Every other game — audit, then wire what fits

For each, decide whether a level means something, and wire `difficulty` (part
1's schema, part 2's picker) only where it does:

- **Petit Bac** — `easy` deals only common letters (no K, Q, W, X, Y, Z);
  check what the letter draw does today.
- **Shades** — `easy` shows the colour longer; the pay curve does not move.
- **Matchsticks**, **emoji rebus** if part 3 left it — do their banks carry
  anything that orders them? Tier if so.
- **Black square** — not here: `black-square-01-shape.md` rebuilds its bank
  with tiers and wires its level.
- **Most likely**, **Buzzer**, **Reflex**, **Slate**, **Challenge**, **Inner
  clock** — no dealt content of their own, or the host brings it: no level,
  and they stay out of the evening-wide picker's count.

Write down in `docs/game-catalogue.md` which games take a level and why the
others do not, so the next game knows.

## Closing the series

- `pnpm validate` once, here, after everything has landed (the series runs one
  validate at the end; CI covers each push).
- Record the stage as `docs/plans/62-difficulty.md` (what it bought, the
  decisions in part 1, the capitals finding from part 3) and add its row to
  `docs/plans/README.md`.
- Delete the `difficulty-*` handoffs and their README rows in that commit.
