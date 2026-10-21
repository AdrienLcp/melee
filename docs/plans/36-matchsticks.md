# 36 — Matchsticks

**Half done.** Served 21/10/2026 (A1 below); the screens (A2) and the stick
moved under the finger (B) are owed. Two kinds of puzzle (below). A matchstick equation on the wall — `6 + 4 = 4` drawn in sticks,
seven-segment digits — that turns true when one stick moves. Asked for the team
evening on 21/10/2026.

## Session A — a bank, judged by the host

- A bank of about thirty puzzles, each an equation, its one-move solution and
  any other one-move solution that is also true (a second answer is not wrong).
- The wall and every screen draw the equation in sticks; the solution is
  host-only, withheld from players and the wall like every answer.
- Played as the buzzer is judged: the first to buzz says the move aloud, the
  host grants or refuses, the reveal draws the stick moving.
- A new `GameKind`, shelved, joinable to a line-up.

## Session B — the stick moves under the finger

- Each screen lets its player pick a stick up and put it down; the move is sent
  as two stick positions, never as an equation, and the server judges whether
  the result is a true equation reachable in one move.
- Everyone at once, scored by the clock like `choice`, so the host has nothing
  to judge.
- Only worth building once session A has been played at a table.

## A second kind of puzzle — the biggest number

Asked 21/10/2026. A number of several digits in sticks (`5 0 8`), and one
stick to move so the number becomes **the biggest it can be**.

- *Bigger than the original* is too easy — a stick off an `8` often does it —
  so the puzzle asks for the biggest, and the smallest is its twin.
- **No bank to write**: the server can deal any number and work out the best
  move itself, by trying every one stick move over the seven-segment digits.
  The puzzles never run out and every solution is known.
- **Every puzzle dealt is solvable**: a number is dealt only when at least one
  move gives a bigger one, and redrawn otherwise; the same holds for the
  equations, each banked with a solution.
- In session A the host judges against the best answer the server shows them.
  In session B the server measures the number each player made, so a move
  that is not the best can still be paid by how close it came.

## A1 — served (done 21/10/2026)

What was built, and where it left the plan above:

- **No bank for the equations either.** The server takes a true equation of
  two single digits, knocks it false with one random move, and the solver
  lists every move that makes it true again — so every equation is solvable by
  construction (moving the stick back) and the evening never runs out.
  `@melee/core/matchsticks/`: `glyphs.ts` (the seven-segment shapes; a `+` is
  two places `h` and `v`, a `-` the `h` alone, `=` never moves), `one-move.ts`
  (every one-stick move, the equation and number readers, `solutionsOf`) and
  `deal.ts`.
- **The smallest number is dealt too**, the twin the plan named: `goal` is
  `equation`, `biggest` or `smallest`, and the setting `goals` ticks which a
  room is dealt, one drawn per round (all three by default).
- **A number never takes a zero in front**, in an equation or as an answer: a
  smallest-number puzzle would otherwise always answer `0…`.
- **A round has a clock**, `roundDurationMs` (60 s by default, 10–180 s), and
  runs out into the reveal like a quiz question.
- `matchsticks` is in `gameKinds`, not `shelvedGames`; buzzer only, playable
  aloud, no team turns, the wall never answers. The host arm carries every
  solution (`null` for a seated console, which buzzer mode never grants), the
  public arm the puzzle and `revealedSolution`, the wall the kind alone.
  `PROTOCOL_VERSION` 37. `matchsticks-game.test.ts` checks the transcript of a
  player and of the wall, and was seen red with the move leaked.
- The app holds only what compiles: the name, the scoring line and the icon
  (a flame). Everything a screen draws is A2.

## A2 — the screens (to do)

- A stick-drawing component in `presentation/components/` drawing glyphs from
  `sticksOf`, used on the wall, the console and the phone; the reveal draws the
  moved stick leaving its place and landing in the new one.
- The console shows every solution beside the judging panel; the goal is said
  in words above the sticks (*make it true*, *make it the biggest*).
- The settings fold ticks the goals and sets the clock; then `shelvedGames`,
  the shelf page and its spine colour, tagline and home copy, and whether the
  game night preset takes it.
