# Between two rounds: ready starts the next one, the round's own result, a final board that agrees with its figures

Three reports from Adrien about the reveal and what follows it. Items 1 and 3
have landed, and item 2's first slice. **What is left, one session**: the
list under item 2. Run
`pnpm validate` once at the end. UI: `impeccable` first. Check every screen
**full**: `MAX_PLAYERS_PER_ROOM` seats, long names, phone width, with and
without a wall. Verify muted. Delete this file once nothing is left.

## 0. Browser pass of items 1 and 3 — done 2026-10-31

**Bug 1 fixed** (teams' trays running past the console's stage inside a track
ring): the trays scroll inside the standings box, with no sideways bleed. The
e2e test `[layout] room, … inside a track with a full table: nothing leaves the
stage` (`e2e/choice-fits.spec.ts`) runs green and was seen failing with the
scroll removed.

**Bug 3 fixed**: the player's reveal (`RevealBoard`, `player-round.tsx`) now
passes `marksReady` (same `asksReady` as `BackAtTheTable`) and a read-only
`TeamMove` per team on a track; `TeamFinish` (`player-teams.tsx`) prints the
case on each tray; `RoundBoard` takes `marksReady` and draws `ReadyMark`.
`TeamMove` moved to `presentation/components/` (both surfaces use it), with its
own `.team-press` rule. Seen at 390×844: 12 ready marks, "Case 0 sur 20" on
the three trays, reveal and final. **Still missing**: the case on the player's
own headline on the final board (`your-placing`, "2e · 8 points") and on a
seat row of `RoundBoard` in a room with a track and no teams — its row grid
has no column for it; decide with direction B, whose list carries it.

**Bug 2** (answer grid squeezing names to a letter at 24 seats) is left for
direction B, which replaces that panel.

Two driving traps met here are now in `docs/browser-driving.md` (*Seats
driven from raw sockets*).

What was checked, for the record:
- a reveal with every seat ready: the bar runs 5 s, labelled "Tout le monde est
  prêt" (`RevealHold` `label`, `round-progress.tsx/.sass` — a flex item before
  the groove; check it does not squeeze the groove at phone width), on the
  console, the wall and the player (`holdUntilTheCountdown` subtracts the
  countdown from 5 s — the player's bar may be very short; judge it);
- **Attendre** (`reveal-actions.tsx`, outlined, before Manche suivante, only
  while `round.advancesAt !== null`) stops it, the next round waits;
- ready asked on single-game rooms now (`asksReady`, `packages/core/src/round/asks-ready.ts`),
  never on the slate nor the last counted round;
- final board over a track: `Standings` gets `board` → `TrackPodium`/`TeamMove`
  print cases; the winner line reads "gagne case N · X points"; check the final
  board's height budget (`standingsRowsOf` now counts the team case row) at 24
  seats, and `choice-fits.spec.ts`'s final-board-over-a-track viewports;
- `Scoreboard` prints `Case N` before points on a row with a `board`
  (`.case`, `scoreboard.sass` `li:has(> .case)`).

Dropped from item 1, on purpose: the console line "… · on attend ton signal".
The view does not say a hold was waived, and the stage grids have no row for a
line; direction B's restructure (item 2) is where the ready line gets its own
place, and `isHoldWaived` can join the round view then if the line is wanted.

Also landed: a round stored by the Durable Object before the ready hold lacked
`isHoldWaived`/`isReadyHold`/`settingHoldEndsAt` and **every view of that room
failed `encodeChecked`** (seen live on `wrangler dev`): `withHoldFields`,
`apps/server/src/domain/room/stored-round.ts`, applied in `room-object.ts`.

## Where things are

- **Ready**: `player.ready` sent at `apps/game/src/features/player/player-page.tsx:278,324`
  → `socket-handler.ts:524` → `markReady`, `apps/server/src/domain/room/room-service.ts:265-284`;
  stored `Participant.isReady`, cleared as a round opens (`round-service.ts:205-206`);
  shown by `ReadyMark` (`presentation/components/scoreboard.tsx:158`,
  `features/host/track-podium.tsx:64,80`); asked only when the line-up has more
  than one entry and this is not the last round (`features/host/room-stage.tsx:430-431`).
- **Auto-advance (reveal hold)**: `settings.autoAdvanceMs`, 2–30 s or `null`.
  `revealRound` (`round-service.ts:1462`) → `startAutoAdvanceHold` (:1483-1495)
  sets `round.advancesAt`; `advanceDueAt` (:1605-1620) opens the next round a
  countdown early; the deadline is `room-deadlines.ts:115-119`, fired from
  `round-conductor.ts:749` → `beginRound` (:816). Client bar `RevealHold`,
  `room-stage.tsx:422-428,492`.
- **Pause**: `host.pause` → `pauseRound` (`round-service.ts:1373-1416`), allowed
  in `revealed`; a pause already holds the hold (`room-deadlines.ts:51-54`);
  resume restarts the hold in full (:1453-1459).
- **Reveal screens**: host and wall share `RoomStage` (`room-stage.tsx:444-493`:
  `ScoreTrack`, `RevealPanel` from `round.awards`, `Standings`). Player:
  `features/player/round-board.tsx:79-85` + `Scoreboard` (`player-round.tsx:420,477`),
  own award :978. Final: `FinalBoard` (`room-stage.tsx:501`).
- **This round's points already travel**: `round.awards[]` = `{playerId, points,
  speedBonus, verdict}` (`packages/protocol/src/scoring.ts:216-228`). Ranks
  before the reveal are client-side only (`useStandingBeforeTheReveal`,
  `room-stage.tsx:146`).

## 1. Everyone ready for 5 s starts the next round — landed

Server in "Start the next round once every seat is ready…", screens in the
commit above. Remaining: verification (section 0).

## 2. The round's own result — direction B, first slice landed 2026-10-31

**Landed** (commit "Put the round's podium over the reveal and its gains on
the standings"): `RoundPodium` in `reveal-panel.tsx` replaces the per-seat
`.said` chips and `Scorers` — the top three by points (answer beside the
name via `wordsOf`), then `.found` "Trouvé : N sur M" (`round.found`, M =
`openedWithPlayerIds.length`). Fallback by `@container` on the stage's height
(`reveal-panel.sass`): `< 20rem` first alone + `round.othersScored`, `< 12rem`
the count alone. `.tally` is shown above the split again, third grid row,
`overflow-y: auto`. `Scoreboard` takes `gains` (a `.gain` column, `+X`,
`with-gains` grid), fed from `round.awards` by `room-stage.tsx` → `Standings`.
The rows' travel now waits `slow × 3` (~1.5 s) before moving
(`scoreboard.sass`). Seen at 1280×720, 1920×1080, 1080×1920, 390×844, 844×390
on the console at 24 seats via a throwaway copy of `choice-fits.spec.ts` with
24 names (deleted).

**Wall at a full table — landed 2026-10-31** (commit "Fit a full table on
the wall's reveal and cut the tally in whole chips"): the wall's standings
divide their own box (size container, `--rows-per-column`,
`--row-width-cap`), two columns past twelve seats lying down and on a narrow
wall (`two-ranked-columns` in `wall-page.sass`); the tally is clipped on
every screen and `useWholeChips` (`features/host/use-whole-chips.ts`) hides
each chip from the first one cut; on a phone the console's `.reveal-panel` is
a size container so the podium's fallback fires. New test `[layout] wall,
the reveal of a full table` (24 seats, every wall viewport, rows against the
answer). The base round fixture lacked `isReadyHold`, so every `playing`
screen of `choice-fits` had been failing to decode — fixed, 49 of 51 green.

**Left, in order:**
1. **Two `choice-fits` failures, now visible** (rule 4, fix them):
   - `[layout] room, reflex, the finishing order` at 320×568 and 360×640: the
     row `Anne-Charlotte` + "parti trop tôt" spills its list (`spills`).
   - `[layout] wall, board` at 768×1024: a team tray `li.team` runs to 1049px
     (`3 Bleus 0 Case 7 sur 30 …`) — the final board of teams on a track on
     an upright tablet wall.
   Run: `npx playwright test -c e2e choice-fits -g "reflex, the finishing|wall, board"`.
2. **Gain on teams and the track**: `gains` reaches `Scoreboard` only; a room
   in teams (`TeamRoster`) or on a track (`TrackPodium`) prints none yet.
3. **Fallback order on the console's standings** per `screen-roles.md`: the
   wall hides `.gain` when its column is narrow; the console does not yet.
4. **Player side**: `RoundBoard` (`features/player/round-board.tsx`) already
   is B's list; check it gets the same 1.5 s hold, and the case on
   `your-placing` and on a `RoundBoard` row with a track and no teams.
5. **Answering screens at 24 seats** (found last session, not fixed): with 24
   names in `table` (`choice-fits.spec.ts` ~line 240) every `[layout] … the
   question and its four choices never scroll` test failed. Likely the score
   track's rows over the question. Make a 24-seat variant of those tests
   rather than editing `table`, which the 8-seat reveals also read.
6. **Docs**: `apps/game/DESIGN.md` — *The console held in a hand* (says the
   console never page-scrolls; `screen-roles.md` allows it), *Results chips*
   and *The standings moving* (delay is `slow × 3`) describe the old chips;
   add the wall's two columns and the whole-chip tally.
7. `pnpm validate`, then delete this file.

The fixture's award points (3–6) are not in `POINT`s, so screens print
"0 +0" and "+0" — a fixture artefact, not a bug.

## 3. The final board ranked 440 above 445 — landed

Core tie-break and screens landed. Remaining: verification (section 0).
