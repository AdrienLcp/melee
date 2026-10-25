# 51 — Who plays

**Half done** — step 1 landed 25/10/2026. Asked 25/10/2026: the host's *I play too* switch (home) and the
*A judge runs the room* switch (Table tab) ask the wrong question in the wrong
place. A TV that only shows the code is offered a seat it will never use, and a
seated host who picks a judged game loses the seat — and its score — without a
word, for the rest of the line-up.

## The model

The pattern every room-and-QR party game converged on (Jackbox, Kahoot,
AirConsole): **the screen that opens the room is not a player; playing is
joining, with a name.** A host who plays is a player with controls.

- **Home asks nothing.** *Open a table* is one press; no seat switch.
- **Playing is offered in the lobby**, beside the QR code where everyone else is
  giving a name: *Play from this screen*, with the name. A display ignores it.
- **There is no judge switch.** Whether the host judges follows from two facts:
  the console holds no seat → it can judge anything; it holds one and the round
  is judged (`isJudgedByHost`) → it **sits that round out** and judges it.
- **Nothing is hidden or blocked.** Picking a judged game or mode while seated
  says the consequence at the moment of choice: *you judge this one, you don't
  play it*. The seat, and its score, come back on the next round that needs no
  judge.

## Steps

1. **Done.** **A seat sits out a round it must judge** (server, and the
   console's stage and seat line follow it). The console's seat is
   never removed for judging: it keeps its player and its score, is left out of
   the stamp of a round `isJudgedByHost` says the host judges, and the host view
   carries the answer for that round (`seatId` read as `null` there). Aloud
   teams stay as they are — no seat at all. Replaces `unseatConsolesThatMustJudge`
   and the `hello` refusal. Tests: a seated host across quiz → buzzer quiz →
   quiz keeps one player and its points, gets the answer on the buzzer round
   only, is not waited for there.
2. **`hasJudge` goes.** Its readers move to *the console holds a seat*: the
   remembered mode per game in a line-up (`movedToEntry`, `restoredSettings`),
   Petit Bac's judged sheet. `PROTOCOL_VERSION` bump; stored preferences drop
   the field. `JudgeSwitch` and its strings go.
3. **Screens** (through `impeccable`, example pages first): home without the
   switch; the lobby's *Play from this screen*; the warning on a judged game or
   mode for a seated host; the seat's *sitting this one out* line replacing the
   `host.seat.withheld.*` sentences.

## Decisions

- **Sitting out, not unseating.** Unseating wiped the points a host earned on
  the games before; a line-up mixing a quiz and the bare buzzer made the host a
  spectator for the rest of the evening.
