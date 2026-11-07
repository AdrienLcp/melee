# Scoring, part 2 — a room plays on the board or on points, never both

> « À la fin d'une partie il y a des égalités de points entre des joueurs qui
> ne sont pas sur la même case. Je me demande s'il ne faut pas être soit en
> mode plateau, soit en mode point, et jamais les deux en même temps, ça prête
> à confusion, et ça prend de la place de la UI. »

**Run after `scoring-01-one-scale.md` has landed.** Steps derive from its
100-point scale. **`impeccable` first** (global rule 1): it removes UI from
every surface. **Film every changed screen** (project rule 0).

## Why he is right

`settings.board` (`packages/protocol/src/room.ts:232`, `board.ts:19`) is either
`off` or a `track`, and **points are kept and printed in both cases**. The
board ranks by **step, then score, then name** (`buildScoreboard`,
`packages/core/src/scoring/scoreboard.ts:30`; teams use
`team/team-board.ts:27`). Steps drift away from points for several reasons:

- a sum of floors is not the floor of a sum (`onePointOneCase`,
  `board/one-point-one-case.ts:11-15`);
- the catch-up step (`board-strategy.ts:95`);
- the `rank` strategy;
- clamping at the finish;
- host adjustments (`team-service.ts:501-521`).

So two different numbers rank the same people, and they disagree. The
comment on `onePointOneCase` saying the bonus "moves no pawn on its own" is
also wrong today: added to the answer, it does cross step thresholds.

## Decided

- **One mode per room.** Rename the setting to say it: points **or** board.
  On the board, no figure is printed anywhere (console, wall, player,
  reveal, final board): pawns, steps and the finish only. On points, no pawn
  and no track.
- **On the board, steps come from the round's points**, on the 100 scale from
  part 1. Recommended: 0 / 1 / 2 / 3 steps at 0 / ≥33 / ≥66 / 100, or
  `floor(points / 33)`. The `rank` strategy currently gives a podium step to
  any pawn paid more than 0, so it pays a far-off player for being on the
  podium. Either it requires a minimum paid, or it goes. Catch-up and the
  finish stay.
- **Ties on the board are said plainly**: two pawns on one step share the
  place (ex aequo). There is no hidden score to separate them, because the
  table cannot see it. The finish (`board/track-finish.ts`) keeps its own
  rule for who arrived first.
- Host adjustment (`host.adjustScore`) moves steps on the board and points on
  points.

## Where it lives

The scoring audit lists the components on each side:

- **Board**: `features/host/board-setup.tsx`, `board-preview.tsx`,
  `board-moves.tsx`, `track-podium.tsx`, `evening-end-choice.tsx`,
  `presentation/components/board-track.tsx`, `track-strip.tsx`,
  `team-move.tsx`, `use-track-presence.ts`, and the step and pawn parts of
  `round-chrome.tsx`, `standings.tsx`, `score-track.tsx`, `final-board.tsx`
  (the `*OnCase` strings) and `room-stage.tsx:505`.
- **Points**: the 19 users of `shownPoints`, including `scoreboard.tsx`,
  `points-rows.tsx`, `podium-roster.tsx`, `reveal-panel.tsx:587`,
  `player-round.tsx:1085-1162`, `round-podium.tsx`, `seat-podium.tsx`,
  `team-roster.tsx`, `player-teams.tsx`, `counted-board.tsx`, the petit bac and
  black square reveals.

Each one must render the room's mode and nothing of the other.

The board is a host preference remembered once (`HostPreferences`,
`packages/core/src/room/host-preferences.ts`). A stored setup from before the
change must read into the new setting without breaking: migrate it in the
storage reader (`preferences-storage.ts`).

## Verify

- Core tests for the step rule and for the shared place
  (`scoreboard.test.ts`, `board/*.test.ts`, `team-board.test.ts`).
- In a real browser, muted, **full table** (`MAX_PLAYERS_PER_ROOM` seats with
  long names) at 390×844 and 1280×800, with a wall: one evening on points and
  one on the board, through a reveal and the final board. Film the reveal and
  the final board in both modes. Check that no figure is visible in board mode
  and no pawn in points mode.
- Docs: `docs/realtime-protocol.md` L333-401 (board and teams), the Line-up
  and Exits passages of `.claude/CLAUDE.md` if they mention the board,
  `docs/plans/34-the-evening/*`, and the CHANGELOG.
