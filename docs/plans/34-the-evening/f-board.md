# f — The board

**Goal.** With Board on, the wall puts the round in the middle and runs a
track of cases around it; each team's pawn advances with its points. The first
scoring mode, built as one replaceable strategy so others follow as a file
each.

Start with the `impeccable` skill: the layout is new on every surface it
touches.

## Start from what was removed

Stage 29 ringed the console and the wall with a 50-square track
(`b4d509e`, `3bbb15d`) and removed it a day later (`ca612c2`): 120 px a side
on a wide screen for nothing the standings did not say. Both halves of that
verdict change here — the track *is* the score, and it is drawn on the wall,
not on a console held in a hand. Restore `score-track` ring code from those
commits as the starting point rather than redrawing it from Gamenight's
mock-ups, which share the idea and none of the code.

Gamenight's directions (`.impeccable/review/directions/` in its checkout,
gitignored) are the reference for the round-in-the-middle composition and the
pawn race; `apps/game/DESIGN.md` stays the authority on materials.

## Scoring strategy (`packages/core/src/board/`)

- `board-strategy.ts` — `(board, teamResults, progress) → { moves, isOver }`.
  Pure, run on the server when a round settles, so every screen draws the
  same moves; the host corrects with `host.adjustScore`.
- First strategy, `one-point-one-case.ts`: a team moves as many cases as it
  scored `POINT`s this round, floored — the speed bonus moves no pawn on its
  own (decision 3). Fixed track length, fixed or open round count; the
  evening ends when the host ends it or a team finishes.
- Seat scores keep counting underneath, for the podium and the booby prize.

## Protocol

- `settings.board`: `{ kind: 'off' } | { kind: 'track', strategy, length }`.
- `team.position` beside the team's score; the round's settled view carries
  each team's move so the pawns can walk rather than teleport.

## Screens

- Wall, 16:9 — the track around the round. 9:16 — the track down both long
  sides and across the top, the round between; checked on both.
- Console — the moves under the reveal, editable before *Next round*.
- Phone — a strip of the track with its own pawn, between rounds.
- Final — a podium on the wall and the phones.

## Done when

The strategy simulated in a core test over a 6-round, 3-team evening, from
team results to positions and the end; then played muted in a browser with
pawns walking on the wall at 1920×1080 and 1080×1920.
