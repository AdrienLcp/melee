# 36 — Matchsticks

**To do.** Two kinds of puzzle (below). A matchstick equation on the wall — `6 + 4 = 4` drawn in sticks,
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
