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

   **Done** 13/11/2026. `makenumber` is in `gameKinds`, not `shelvedGames`:
   `roundDurationMs` 30–120 s (60), eight rounds by default, the reveal held
   for the host. The answer mode is `calculation`; `player.answer` carries
   `{ kind: 'calculation', steps }`, one to five `{ left, operator, right }`,
   `operator` one of `add`, `subtract`, `multiply`, `divide`, an operand
   0–9 (`protocol/make-number.ts`). **Core** `@melee/core/makenumber/`:
   `tile-draw` (`TILE_BAG`, `drawNumbers`), `shortest-solution` (the subset
   DP, each subset a `Map` of value to its first way, merged from the
   partitions that hold the subset's lowest tile so each pair is met once,
   the larger operand first for `−` and `÷`; a tile that is the target is a
   solution of no step), `playable-draw` (`drawPlayableNumbers`, injectable
   drawer, `FEWEST_TILES_A_SOLUTION_USES` 3, `MOST_DRAW_ATTEMPTS` 500),
   `calculation-check` (`combined`, `calculationValue`) and
   `calculation-pay` (`pointsForCalculation`, `isExactHit`,
   `MISS_THAT_PAYS_NOTHING` 10), each with a test. **Timing** on Node, this
   machine, over 300 draws: a solve 1.6 ms on average (it stops at the first
   subset holding the target), 24 ms at worst — a target no subset reaches,
   which walks all 63; 93 % of raw draws are exact; a playable draw 1.8 ms
   on average, 1.07 attempts, 14 ms at worst. The shortest solution took 3
   tiles 15 times, 4 tiles 75, 5 tiles 146 and 6 tiles 64. **The refusal**
   is one code, `invalid_calculation` (an operand out of reach or used twice,
   a subtraction to zero, a remainder), free. **The verdict** `calculation`
   is `{ value, distance }`, and — unlike 67's — it is sent to its own seat
   during the round, since the value and the target are on every screen
   already. `raisesVerdict` takes a nearer distance, ten away or more
   included, and `bank` re-stamps `scoredAfterMs` on it as on 67
   (`isPaidOnItsBest`, letters or calculation), so the clock reads the
   seat's nearest; an equal distance replaces nothing. `calculation` joins
   the retry gate, `isFinal` holds on an exact hit — a further calculation
   is `already_buzzed`, and the round closes once every stamped seat holds
   one. **Views**: every screen reads `tiles`, `target` and `values` (each
   seat's nearest value), the reader its own `yourCalculations` in the order
   sent, the reveal `revealedCalculations` and `solution`; the console reads
   `currentContent.solution` while it holds no seat, `null` seated; the
   wall's arm is bare. The server keeps each seat's accepted calculations
   with their values on the round (`calculations`,
   `domain/round/make-number-round.ts`), and `said` writes the kept one out
   as `75 + 25 = 100, 100 × 7 = 700` for the console's list. The conductor
   calls core's `drawPlayableNumbers` directly — no bank, nothing to
   `playedContentIds`. The game app compiles with the dictionary keys
   (`makenumber.name`, `play`, `tagline`, `scoring`, `home.description`,
   `host.answerMode.calculation`, `error.invalid_calculation`, both
   locales), `CLOCK_PAID_SCORING`, the line-up entry name (seconds), the
   `Calculator` icon and a provisional spine `oklch(43% 0.11 88)`, in the
   gap between the reflex's hue (75) and the timeline's (100) — step 2 may
   move it. No `PROTOCOL_VERSION` bump: every change is a new arm.
   `make-number-game.test.ts` (six tests, each mutation seen red) deals
   `75 25 7 3 10 10` → 703 through the real solver and covers the leak over
   a seated console, four refusals at no cost, a nearer calculation
   replacing a farther one and an equal one not, the pay order, and the
   early close timed at the exact hit. **Settled after**: `makenumber` joins
   `estimate` and `higherlower` in the `numbers` family of `spaced-cycle.ts`,
   because two rounds of figures back to back read as one game played twice;
   and **the calculation left on a seat's screen counts at the close**, as
   67's row does (`ddfdf70a`) — a seat that merged its way to 703 and ran out
   of clock before _Envoyer_ would otherwise lose a round it won. That lean
   arm is step 2's, built with the seat.
2. **On the shelf.** `/impeccable` first, an example page per direction behind
   one link: the tiles, the operators and the merge on a seat, the wall's
   target with every seat's value, the reveal with the solution. Then screens,
   setup, spine, dictionaries, `shelvedGames`, catalogue and `CLAUDE.md` rows;
   seen muted at full seats, the draw's entry and a merge filmed.

   **First half done** 13/11/2026 — the seat, its reveal, the lean and the
   shelf; the wall, the unseated console and their reveal are owed. **The
   lean**: `player.lean` takes `{ kind: 'calculation', steps }`
   (`calculationAnswerSchema`, shared with `player.answer`); `leanCalculation`
   in `round-service.ts` keeps it while the seat holds no exact hit, refuses a
   calculation the tiles cannot make `invalid_calculation`, and
   `takeUnsentLeans` banks it at the close when nearer than what was sent —
   `isUnsent`, no speed; an equal one replaces nothing. **Core**
   `makenumber/rack.ts` is the rack the seat builds (`openedRack`,
   `mergedRack` — `null` where the rule refuses, which is what dims a tile —
   `undoneRack`, `rackPlaces`, `rackLines`, `calculationAt`, renumbering the
   merges behind one made tile for the wire, `nearestMadePlace`);
   `calculation-check.ts` gained `OPERATOR_SIGNS` (the server's writer reads
   it now) and `calculationLines`. **The seat**
   `features/player/make-number-answer.tsx`: A's look reordered as Adrien
   asked — the target card (the sends listed by value, the kept one marked
   _à 3_ / _Le compte est bon !_), then the calculation so far and the figure
   it reaches, then the rack and the operators together, then undo, start
   over and _Envoyer_. A merge auto-lifts its result; the first tile's
   `.ghost` slides onto the second (`--ghost-from` read off the places'
   columns and rows) and the result's face fuses (`number-tile-fuses`); a
   face is keyed by its source, so an undo sets the tiles back on
   `page-enter`. `presentation/components/number-tile.{tsx,sass}` is the
   tile face for the wall to reuse (`NumberTile`, `.number-tile`, `[data-made]`
   with its printed `.made-mark`, `[data-empty]` the socket,
   `--tile-font-size`). **The reveal** `make-number-revealed.tsx`: B's sheets,
   the seat's kept calculation and _Le plus court, pour 703_, a line a step,
   one column under 30rem. **Shelf**: `shelvedGames`, 45/60/90 s in the setup,
   the document head, the spine `oklch(36% 0.085 200)` with
   `--spine-edge-makenumber` `oklch(23% 0.06 200)`, Grand mix bare.
   **Browser**, muted, a console at 1280×800 and seats at 390×844, 360×640
   and 1280×800 (`.playwright-mcp/make-number-run.mjs`): a merge, its undo,
   the dimmed tiles, a far send then a nearer one replacing it on the
   console's values and an as-near one not; the clock run out with an exact
   count unsent on one seat (paid 90, `isUnsent`, no speed), a 1-off unsent
   on another (81) and a far one on the third (0); no answering screen
   scrolls or overflows at the three sizes nor at 844×390; the merge filmed
   (`mn-merge-film.png`): the ghost slides 60–200 ms, the result fuses.
   **Settled**: Grand mix at 60 entries owed the blind test's 20 a gap of 3,
   a third of the evening exactly, and an exhaustive search found no order
   spacing every game. The blind test on every decade at once left (59
   entries, 19 blind tests), and `spacedCycle` now backs out of a dead end
   instead of dealing nearest-first, which the nearest-first deal never
   found at 59.

## How to tell it is done

A round in each language: a division with a remainder is refused, a nearer
calculation replaces a farther one and an equal one does not, the wall shows
values and no calculation, and the reveal shows the draw's shortest solution
beside every seat's calculation.
