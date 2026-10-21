# 36 — Matchsticks

**Session A done.** Served and shelved 21/10/2026 (A1, A2 below); the stick
moved under the finger (B) is owed. Two kinds of puzzle (below). A matchstick equation on the wall — `6 + 4 = 4` drawn in sticks,
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

## A2 — the screens (done 21/10/2026)

- `MatchstickRow` (`presentation/components/`) draws any glyphs in sticks from
  `sticksOf`, in an SVG whose geometry is `helpers/matchstick-geometry.ts`:
  each match pale pine with a red head, every empty place printed as a faint
  groove so the seven segments read before a stick moves. Given a move it
  draws the stick travelling from its old place to its new one — the old place
  dashed in coral, the moved stick ringed in green — so the move reads with
  the motion collapsed too.
- `MatchsticksPrompt` puts the goal in words over the sticks
  (*Move one match to make it true*, *…the biggest number*, *…the smallest
  number*), on the console and wall card, above a player's buzzer, and with
  the solution at the reveal on every screen.
- **The puzzle stays up while the floor is taken** (`VerdictPanel`'s
  `stimulus`), since whoever buzzed points at a stick; the console prints every
  solution beside the two verdicts.
- The settings fold ticks the goals (unticking the last is not sent, since the
  room is dealt at least one) and the time per puzzle, 30, 60 or 120 s.
- Shelved last with a plum spine, `oklch(45% 0.14 305)`, the tagline *One match
  moves. Say which.*; **not in the game night preset** — it is judged by the
  host like the buzzer, and the preset already carries one game of that kind.
- Match tokens (`--match-wood`, `--match-edge`, `--match-head`) are printed
  pieces, the same in both palettes, and always laid on paper: the edge on
  `--card` is what `tokens-contrast.test.ts` holds to 3:1.
- Seen muted at 1280×800 and 390×844, light and dark, through a Playwright
  script (the MCP browsers were down): the shelf, the settings fold, an
  equation and a biggest-number round, the judge's view, the player's floor,
  and the reveal mid-move and settled. **Not seen**: a paired wall's floor,
  which draws the same stage without the verdicts.
