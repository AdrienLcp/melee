# 69 — Make the number

Six number tiles and a target are dealt to every screen. Each seat builds a
calculation from the tiles, one operation at a time, and the server checks it.
The nearest to the target wins, an exact hit is the only perfect answer and the
clock settles exact ties. The reveal shows every seat's calculation beside the
shortest one the draw allowed — _it was there_ — which is the moment the table
argues.

The nineteenth game, **everyone at once**, the numbers twin of
[67](67-longest-word.md): a draw dealt to every screen, many submissions a seat
with the best kept, every seat's result public and its working hidden until
the reveal. Kind `makenumber`, translation prefix `makenumber.*`, answer mode
`calculation`. _Le compte est bon_ in French, _Make the number_ in English.
Not `countdown`: that word is a room phase here.

## Rules, as settled

- **The tiles**: six drawn without replacement from a bag of twenty-four — 1 to
  10 twice each, then 25, 50, 75 and 100 once. They are not the answer and
  travel to every screen.
- **The target**: 101 to 999, uniform. 100 is left out because a 100 tile
  would make it a round with nothing to do.
- **The draw keeps only targets the tiles reach exactly**, and only targets
  that need at least three tiles. A draw with no exact solution would turn the
  reveal's _it was there_ into _nobody could_, which is the duller round; and a
  target one operation away is over before the table has read it. Redrawn until
  both hold, giving up after 500 draws as `no_content_available`.
- **A calculation** is one to five steps, each `{ left, operator, right }`
  over `+ − × ÷`. An operand is an index into the values so far: 0–5 are the
  tiles, 6 onward the results of the steps before, in order. Each value is used
  at most once, every result is a whole number above zero — a subtraction that
  reaches zero or below, or a division that leaves a remainder, is refused. The
  calculation's **value** is its last step's result. A refusal costs nothing.
- **Built by tapping, never typed**: tap a tile, an operator, a tile, and the
  two tiles merge into their result, which is a tile like the others. It is how
  the game is played on television, it reads on every device, and it makes an
  invalid step unreachable on a screen: the server's refusal only meets a
  forged frame.
- **The seat's calculation** is its nearest to the target; a later one at the
  same distance does not replace it.
- **The pay**: an exact hit is perfect and races for the clock's tenth, timed
  when it was sent. A miss of `d` keeps `(10 − d) / 10` of the answer's nine
  tenths — 1 away pays 81 printed points, 3 away 63, 9 away 9 — and 10 or more
  away pays nothing. Six tiles reach within ten of almost any target, so the
  spread lives in the last few units, where being close is the skill.
- **No level**: the content is a draw, as on the swatch and the longest word.
- **`roundDurationMs`** 30–120 s, **60 s by default**: building on a phone takes
  longer than typing a word. The round closes on the clock or when every
  stamped seat holds an exact hit.
- **During the round** every view carries the tiles, the target and each seat's
  best **value** — never its calculation. _812_ on the wall is the pressure the
  game wants; the steps would be a copy.
- **The reveal** carries every seat's calculation and one shortest exact
  solution, fewest steps first.
- **Duels**: yes.

## The solver

Dynamic programming over the 63 non-empty subsets of the six tiles: each subset
maps every value it reaches to one way of reaching it, built by combining the
maps of two disjoint subsets that partition it. Subsets are walked by size, so
the first subset holding the target gives a fewest-tiles solution. It answers
both questions the draw asks — is the target exact, and does it need three
tiles — and the reveal's solution, in one pass.

## Steps

1. **Served.** `@melee/core/makenumber/` — the draw, the solver, the
   calculation check and the pay, with tests; protocol arms, the round builder
   and grader, the views, `GAME_NOTES`, the socket suite (no seat's
   calculation on another's frame before the reveal, a tile used twice
   refused, a nearer calculation replacing a farther one and an equal one not,
   the early close timed at the exact hit). `makenumber` in `gameKinds`, not
   `shelvedGames`.
2. **On the shelf.** `/impeccable` first, an example page per direction behind
   one link: the tiles, the operators and the merge on a seat, the wall's
   target with every seat's value, the reveal with the solution. Then screens,
   setup, spine, dictionaries, `shelvedGames`, catalogue and `CLAUDE.md` rows;
   seen muted at full seats, the draw's entry and a merge filmed.

## How to tell it is done

A round in each language: a division with a remainder is refused, a nearer
calculation replaces a farther one and an equal one does not, the wall shows
values and no calculation, and the reveal shows the draw's shortest solution
beside every seat's calculation.
