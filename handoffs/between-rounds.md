# Between two rounds: ready starts the next one, the round's own result, a final board that agrees with its figures

Three reports from Adrien about the reveal and what follows it. One session.
UI: `impeccable` first, and the direction pages it produces reach Adrien as
**one index link** (global rule 1). Check every screen **full**:
`MAX_PLAYERS_PER_ROOM` seats, long names, phone width, with and without a wall.
Verify muted. Strike each item as it lands, delete this file once none is left.

Run after `handoffs/line-up.md` if both are open — they touch the same reveal.
`handoffs/timer-beeps.md` depends on item 1's choice: settle it here first.

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

## 1. Everyone ready for 5 s starts the next round

**Server done** (commit "Start the next round once every seat is ready…"):
`settleReadyHold` in `round-service.ts`, run from `publishRoom`; the console's
own seat is not awaited (it has its own press); `host.holdReveal` waives both
holds for the reveal, and `host.controlClip` now waives them too; the view
carries `round.isReadyHold`, `READY_HOLD_MS` is in `protocol/room.ts`;
PROTOCOL_VERSION 65; tests in `reveal-hold.test.ts`. **Still owed, screens**:
ask ready on every round but the last and never on the slate (one rule in
`packages/core` for `room-stage.tsx:430` and `BackAtTheTable` in
`player-round.tsx`, which disagree today on nothing but would drift); the bar's
length is `READY_HOLD_MS` when `isReadyHold` (`room-stage.tsx` hold,
`round-clock.tsx`); an **Attendre** press on the console sending
`host.holdReveal`. Direction pages decide the look.

> If everyone has been "ready" for 5 seconds, we start the next round without
> the host clicking "next round"? And the host gets a "pause" button to block
> that? And the host can still click "next round".

**Do it.** It matches the table: the host is often playing too, and the room
should not wait on one screen. Decided shape, open to Adrien's pushback:
- Server-side, as one more way of arming the existing hold: when **every
  connected seat** is ready (a disconnected seat does not block; a seated
  host's own seat counts like any other), set `advancesAt = now + 5 s`, unless a
  shorter hold is already running. A seat un-readying before it fires disarms
  it. No new timer: the hold machinery and its deadline already exist.
- The host's control is **not Pause**: Pause hides the round behind a paused
  card, which is the wrong thing while the table reads the results. Give the
  hold bar a **"Wait"** press that disarms this reveal's auto-start (the next
  round goes back to manual for this reveal), beside the existing "next round",
  which still works at any time. Pause keeps holding everything as it does today.
- Every screen shows the 5 s as the existing `RevealHold` bar, so nobody is
  surprised when the round starts.
- Where ready is not asked (single-game rooms, `room-stage.tsx:430`), weigh
  whether to ask it everywhere now that it does something.

## 2. The round's own result, not only the general standings

> When a round's results come up we only see the general standings. Shouldn't
> it rather be the standings OF THE ROUND that just happened? Or one board on
> the players' devices and another on the host's — but the host can be a
> player. Or two screens after a round: "round result" with a "next" button,
> then the general standings? All of it controllable by the host and by the
> players, to fit the idea above.

Adrien asked for proposals. Recommendation to put to him, as direction pages:
- **One reveal, two readings, no second step.** Lead with *this round*: who
  scored, `+points` (the two halves apart, as the console prints them), sorted
  by what the round paid; then the general standings with each seat's movement
  (↑2, ↓1). Wide screens (wall, desk console) side by side; a phone leads with
  "you: +X, now 3rd (↑2)" and the round's list, the general board below.
- **Against the two-step version**: one more press per round over a forty-round
  evening, and it splits item 1 — which step does "ready" belong to? A second
  screen that advances by itself is a slideshow nobody controls.
- **Against host vs player boards**: the host may be seated and a wall may be
  the only shared screen; every role should read both.

Before designing, look at what `RevealPanel` already shows from `round.awards`
in each game — some games already list scorers, so the gap may be ordering and
emphasis rather than a missing panel.

## 3. The final board ranked 440 above 445

**Core done**: `rankTrackPawns` ties on one case break by score. **Still owed,
screens**: print the case wherever a board orders by case — `Scoreboard` and
`TeamRoster` when a row carries a `board`, and `FinalBoard`, which does not pass
`board` to `Standings`; the winner line says points while the track decided.

> At the end, I had 440 points but appeared ahead of a player who had 445.

Found by reading: every ranking goes through
`packages/core/src/scoring/scoreboard.ts:32-37` (teams: `team/team-board.ts:28-30`),
sorted **by track case first**, then score. `final-board.tsx:99` renders
`Standings` without `board`, so `Scoreboard` prints only points
(`scoreboard.tsx:173`) but orders by the hidden case; `winnersOf` is case-first
too (`final-board.tsx:57`). Cases drift from points by design: per-round floor
(`core/board/one-point-one-case.ts:13`, the speed bonus never makes a case),
the track's length cap and catch-up bonus (`board-strategy.ts:95-99`), the
`rank` strategy's 3/2/1 (`rank.ts:18`). Confirm the room had the track on.

Decision: when the track is on, **the track decides** — it is the game the host
chose, and catch-up and rank payouts exist precisely to make it differ from
points. So every board ordered by case must **show the case** first, points
beside it; nowhere may a list order on a figure it does not print. Also
`rankTrackPawns` (`track-pawns.ts:47`) has no score tie-break: two pawns on one
case keep roster order — tie-break on score. Test in `packages/core`.
