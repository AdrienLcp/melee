# 36 — Matchsticks

**To do.** A matchstick equation on the wall — `6 + 4 = 4` drawn in sticks,
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
