# New game — Cinq indices, step 2: the server

Asked by Adrien on 2026-11-12, the third of three new games. Every choice is
weighed by what is more fun at the table, never by what it costs to build.

**Step 1 landed 18/11/2026**: the plan
[`docs/plans/73-five-clues.md`](../docs/plans/73-five-clues.md) holds every
rule as settled — read it first: the ladder, the clue window, one guess a
clue in `typed` and one pick a round in `choice`, the pay by clue. On `main`:
`packages/protocol/src/five-clues.ts` (the clue union, the ladder tuple, the
M49 ids, the window bounds), `packages/core/src/fiveclues/` (`worthOfClue`,
`pointsForClue`, `mayGuess`, `seatAfterGuess`, `opensNextClueEarly`,
`isRaceSettled`) and
`apps/server/src/infrastructure/questions/five-clues-bank.ts` (147
countries, `drawFiveCluesCountry`, `fiveCluesLadderOf`, `fiveCluesAnswerOf`).

## This session: step 2 of the plan

Serve the game end to end, reachable by a settings frame, not on the shelf.
The template is Think alike's serve commit — `git show --stat 9d39e61a`
lists every file a new kind touches.

1. `fiveclues` in `gameKinds` (not `shelvedGames`), its settings arm
   (`clueDurationMs` 5–30 s, 10 s default, the level), ten rounds, `typed`
   and `choice` narrowed in `game-capabilities.ts` with their existing
   attempts and the `single` verdict — `tsc` on the three packages lists
   every `Record` left to fill.
2. `apps/server/src/domain/round/five-clues-round.ts`: the ladder held on the
   round, the open clue and its stamp on the round's own clock, the next clue
   by timer or early, the close once settled, each seat priced by
   `pointsForClue` — never the shared settle's `clockedPay`.
3. The views send only the open clues; `five-clues-game.test.ts` as the plan
   lists it, the anti-leak case over the whole transcript.
4. Update the plan's step 2 with what it settled, the realtime protocol doc,
   the changelog; then write the handoff for step 3 (the screens, which start
   with the `impeccable` skill).
