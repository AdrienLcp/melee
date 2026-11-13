# New game — Pense comme la table, step 2: the server

Asked by Adrien on 2026-11-12 (one of three new games, with
`games-03-five-clues.md`). Every choice is weighed by what is more fun at the
table, never by what it costs to build.

**Step 1 landed 13/11/2026**: the plan
[`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md) holds every
rule as settled — read it first, it answers the questions this handoff used to
leave open (the same answer, the host's merge at the reveal, the pay, no
speed). On `main`: `packages/protocol/src/think-alike.ts`,
`packages/core/src/thinkalike/` (`crowdKey`, `crowdGroups`, `matchesOf`,
`pointsForMatch`, `isWholeTable`) and
`apps/server/src/infrastructure/questions/think-alike-bank.{json,ts}` (187
prompts, `drawThinkAlikePrompt({ language, playedIds })`).

## This session: step 2 of the plan

Serve the game end to end, reachable by a settings frame, not on the shelf.
The template is Make the number's serve commit — `git show --stat 79124e0c`
lists every file a new kind touches — and the closest round to copy is the
estimate (`payEstimates`, one answer a seat priced at the close), with
Petit Bac's `host.strikeRow` as the model for a console action that re-pays a
revealed round.

1. `thinkalike` in `gameKinds` (not `shelvedGames`), its settings arm
   (`language`, `roundDurationMs` 10–60 s, 20 s default), ten rounds, the
   `match` mode, attempt `{ kind: 'match', answer }` and verdict
   `{ kind: 'match', matched, others }` — `tsc` on the three packages lists
   every `Record` left to fill.
2. `apps/server/src/domain/round/think-alike-round.ts`, the deal in
   `round-conductor.ts`, the views in `room-view.ts` (own answer, who has
   sent, `groups` at the reveal), `host.mergeGroups` / `host.splitGroup`.
3. `apps/server/src/__tests__/think-alike-game.test.ts` as the plan lists it.
4. Update the plan's step 2 with what it settled, the realtime protocol doc,
   the changelog; then write the handoff for step 3 (the screens, which start
   with the `impeccable` skill).
