# Between two rounds: ready starts the next one, the round's own result, a final board that agrees with its figures

Three reports from Adrien about the reveal and what follows it. Server, core
and the screen halves of items 1 and 3 have landed (commit "Ask ready on every
reveal, count its five seconds, and print the case a board ranks by"). **What
is left, one session**: item 2. Run
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

## 2. The round's own result — direction B, chosen 2026-10-31

Mock (local, git-excluded): `C:/git/melee/.handoff/reveal-directions/b-one-list.html`
(A and C beside it in `index.html`, for reference only). B: a **headline
strip** — the answer and the round's podium — over **one list**, the general
standings, each row carrying its round gain (`+35`) and its movement (↑2).

Adrien's brief on top of the mock, settled:
- **The strip is the round's podium, not its whole list**: the top three by
  what the round *paid* (the mock shows the three fastest — fix that), plus the
  tally ("14 sur 24 ont trouvé"). Fewer at smaller sizes: three, then the
  first alone with "+ N autres", then the tally alone.
- **Movement is shown by motion, not only by a stamp**: the standings first
  appear in the order **before** the round for ~1.5 s, then the rows travel to
  their new places (FLIP), keeping their `+X`. 1.5 s rather than 2 because the
  ready hold is 5 s and a ready table must still see the rows land. Within a
  column a row slides; a row that changes column fades out and in at its new
  place rather than flying across the others — DESIGN.md limits
  `standing-moves` to one column for exactly that crossing. Reduced motion:
  the final order straight away. `Scoreboard` already has `rankedBefore` and
  `placesClimbedBy`; the console's `useStandingBeforeTheReveal`
  (`room-stage.tsx:146`) gives the order before.
- **What goes when room runs out, in this order**: (1) the ↑2/↓1 stamp — the
  animation already says it; (2) the `+X` tag on each row — the strip says who
  scored most; (3) the ready mark last. Adrien hesitated on 2 vs 3: ready goes
  last because it now *starts the round* — the table needs to see who is still
  holding it up, and nothing else on the screen says that.
- **Every role, every shape** — the contract is `.claude/rules/screen-roles.md`
  (written 2026-10-31 from Adrien's brief, read it first): only the **wall**
  never scrolls, 9:16 included; the console (with or without a wall) and the
  player may scroll, an answering screen never does, and a console with no wall
  keeps the podium, the head of the standings and the next-round press in its
  first viewport. **That changes `apps/game/DESIGN.md`**, whose *The console
  held in a hand* says the console's stages never page-scroll, and
  `e2e/choice-fits.spec.ts`, which measures the console's reveal and final
  board for overflow: bring both in line with the rule (keep the answering
  screens' checks; add the 9:16 wall at 24 seats). Check each role at 24 seats
  with long names.

**Read before building the strip** (mapped 2026-10-31, nothing written yet):
- The strip's podium replaces `.said` in `Outcome` (`reveal-panel.tsx:414`),
  shared by console and wall — one chip per seat, which is bug 2 at 24 seats.
  But `.said` is also where each seat's *own answer* is drawn: a moved stick
  (`MatchstickRow`), a rebuilt colour (`SwatchChip`), the atlas's list (its own
  size rule, `reveal-panel.sass` `&[data-game='atlas']:not(.bare) > .said`).
  Decide per game whether the podium shows the answer beside the name or the
  grouped `.tally` carries it — the tally is `display: none` above the split
  today (`reveal-panel.sass` `.tally` › `layout.wide`), so the wide screens
  would lose the answers unless it comes back there.
- `.said`/`.scorers` rows are sized by `dealtRows` (`--outcome-rows/-columns`)
  inside a size container (`reveal-panel.sass:465-468`); a three-row podium
  needs its own sizing and the size fallback (three → first + "+ N autres" →
  tally alone) is a container query on that box.
- `e2e/choice-fits.spec.ts` measures these chips at sixteen viewports; expect
  to rewrite those expectations, not just add the 9:16 wall.
- `Scorers` (no answers to show — buzzer, most likely) is the same podium
  without words; one component can serve both.
- New shell strings go in `round.*` (`{found:number} sur {total:number} ont
  trouvé`), both dictionaries.

Code hooks: `reveal-panel.tsx` `Outcome` lists answers in `revealedInOrder`
order, not by points; the player's `RoundBoard` (`round-board.tsx`) is already
B's list without the stamps; `holdUntilTheCountdown` on the player side
subtracts `countdownMs` from the hold — check it against a 5 s one. New strings
(French in the mock): "{n} sur 24 ont trouvé", "Tout le monde est prêt · la
suite dans {s} s", "… · on attend ton signal", "Attendre", "Classement
inchangé", "Sans réponse", "gagne case {case} · {points} points".

## 3. The final board ranked 440 above 445 — landed

Core tie-break and screens landed. Remaining: verification (section 0).
