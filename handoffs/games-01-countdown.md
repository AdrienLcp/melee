# New game — Le compte est bon

Asked by Adrien on 2026-11-12, one of three new games he picked
(`games-02-think-alike.md`, `games-03-five-clues.md`). Every choice in it is
weighed by what is more fun at the table, never by what it costs to build.

## The game

Six number tiles and a target from 100 to 999 are dealt to every screen. Each
seat builds a calculation from the tiles (`+ − × ÷`, whole numbers at every
step, each tile used at most once) and the server checks it. The nearest to
the target wins, an exact hit pays the most, and the clock settles exact ties.
At the reveal the wall shows the best calculation the draw allowed, found by a
solver in `@melee/core`.

## Where to start

1. Read `docs/game-catalogue.md` and `docs/plans/67-longest-word.md`. This is
   the numbers twin of _Mot le plus long_: a draw dealt to every screen, many
   submissions a seat with the best one kept, every seat's result public and
   its working hidden until the reveal. Take its shape before inventing one.
2. Write the stage's plan in `docs/plans/` (the next free number) and add its
   row to `docs/plans/README.md` and to the catalogue table.
3. Then build it: an answer mode of its own, the draw and the solver in core
   with tests, the server, the screens (`impeccable` first) and the
   translation prefix.

## Open for the session

- How a calculation is built on a screen: tapping tiles and operators fits
  every device better than a typed expression.
- How a near miss pays. Being 3 away should still be worth something, and
  "the answer comes first, the clock settles near-ties" applies.
- The draw: keep only the draws the solver can hit exactly, or allow the
  occasional draw that has no exact solution.
