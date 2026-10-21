# 36 — Matchsticks

**Session A and B1 done.** Served and shelved 21/10/2026 (A1, A2 below); the
stick moved on a screen is served (B1), and its screens (B2) are owed. Two kinds of puzzle (below). A matchstick equation on the wall — `6 + 4 = 4` drawn in sticks,
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

## B1 — served (done 21/10/2026)

The stick moved on a screen, server, protocol and core only; the app holds what
compiles. Built on decisions taken for Adrien, listed here for him to settle:

- **A mode of its own, `move`, offered by matchsticks alone**, beside
  `buzzer`: `answerModes` is `['move', 'buzzer']`, and `move` is the default a
  room opens on (`DEFAULT_ANSWER_MODE`), so *play right away* works and a
  remembered buzzer is traded for it. `buzzer` is unchanged and host-judged.
  `isJudgedByHost` says no for `move` without a line of its own — the rule
  already keys on `buzzer`. `playsAloud` stays true (the buzzer still serves a
  table with no screens); **no team turns and no wall answer** this session,
  `playsInTeamTurns` and `wallAnswers` stay false.
- **`player.answer` `{ kind: 'move', move }`, one shot** like a pick or an
  order. `applyMove({ glyphs, move })` in `core/matchsticks/one-move` applies
  it — no stick where it is lifted, one already where it is laid, or a glyph
  left that is no digit or sign returns `null` — and `oneStickMoves` is now
  written as every stick place pair `applyMove` accepts, so the solver and the
  server cannot disagree; `one-move.test.ts` checks every pair of places both
  ways. **An illegal move is `illegal_move`, a new error code** (translated in
  both locales), and spends nothing: the shot is still the seat's.
- **The verdict is a fifth shape, `{ kind: 'move', placesFromBest }`**: `0` for
  a true equation or the best number, `1`, `2`… for the next distinct numbers
  one stick makes that improve on the dealt one, best first (two moves to the
  same number share a place), `null` for a false equation, a number no better,
  or no number at all. `core/matchsticks/move-pay` pays 3, 2 and 1 `POINT`s for
  places 0, 1 and 2, nothing below, the clock on top capped by the answer as
  everywhere. An equation has no second place: a true one is 3, anything else
  nothing.
- **The round closes when every stamped seat has moved, or on its
  `roundDurationMs`**, like the timeline. No lockouts.
- **What travels.** Before the reveal a seat reads back its own move as
  `yourMove` on the public arm, which survives a reload; nothing else of any
  seat's move, and **not its own `yourVerdict`** — the one departure from the
  timeline, which sends a seat its own pair count at once: a seat told its
  move was right could whisper it on with confidence. At the reveal
  `revealedMoves` carries every seat's `{ playerId, move, glyphs }` (the puzzle
  as the move left it), beside `revealedSolution`; a seat's `said` is those
  glyphs too. The host arm keeps every solution, `null` while seated. The wall
  arm is the kind alone. `PROTOCOL_VERSION` 41.
- **Tests.** `move-pay.test.ts` (ranks for biggest and smallest, the equation,
  the pay; seen red with the ranking reversed), `one-move.test.ts` (applyMove
  against the solver both ways; seen red with the empty-place check dropped),
  the room rules (judged on the buzzer only, play right away, the default).
  `matchsticks-game.test.ts` deals one fixed equation (`6+4=4`: a dealt one may
  have no wrong move at all, `4-1=2` among them) and plays a move round: a
  right move paid above a wrong one and the faster of two right ones more, an
  illegal move refused without spending the shot and a second refused, the
  round closing once all three have moved, a seated console paid, and every
  player's and the wall's whole transcript free of a solution, another seat's
  move and any verdict before the reveal — seen red with `revealedMoves`
  unguarded, with `yourVerdict` sent early, and with the illegal move answered
  `invalid_message`.
- The app names the mode (*Move the match*) and its scoring line in both
  dictionaries. **A room opens on `move` with nothing drawn for it yet** —
  that is B2.

## B2 — the stick moves under the finger (owed)

- A player's screen picks a stick up and puts it down (pointer, finger and
  keyboard), with `applyMove` refusing a drop before anything is sent, and
  sends it once; `yourMove` drawn after a reload.
- The reveal draws every seat's move from `revealedMoves`, ranked by
  `placesFromBest` beside the solution.
- The shelf's description and tagline still describe the buzzer
  (*First to buzz says which match moves…*, *Say which.*).
- Team turns and the wall answering, if the table wants them.
