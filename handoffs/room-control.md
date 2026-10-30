# The host's hand on the room: sound and pause

Two features Adrien asked for, both about the console steering every screen
from the snapshot. One session; strike each as it lands, delete this file and
`room-control.wip.patch` once none is left.

## 1. Pick the speaker and set the room's volume

### What Adrien asked

> Control the volume from the host's screen, and have it update the sound on
> whichever screen is playing it. With walls, the wall plays — I want to choose
> to play from one wall or another, or from my own device (the one running the
> table), and set the volume for the whole game from there.

### Today

- The console is the speaker unless a wall is connected
  (`isSpeaker = view?.isWallConnected !== true` in
  `apps/game/src/features/host/host-console-page.tsx`); the server makes the
  first wall to arrive the speaker (`wallRoomViewSchema.isSpeaker`).
- Volume is per device: `melee:volume` in
  `apps/game/src/infrastructure/storage/preferences-storage.ts`, read by
  `useRoundAudio` (`features/host/round-audio.ts`) and the cue audio
  (`presentation/audio/`).

### Shape to build

- A host-chosen **speaker** — the console, or one wall by a stable id — and a
  **room volume** the host sets; both travel in the snapshot to the speaker,
  which applies them. A chosen wall that leaves falls back (next wall, then
  the console).
- Walls need a label the host can pick by (a number shown on the wall).
- Decide what becomes of the per-device `melee:volume` (likely: the console's
  own slider becomes the room volume; a wall has none of its own).
- UI on the console (Salle tab / menu): `impeccable` first.

### Work already started (unverified, server and protocol only)

`room-control.wip.patch` (`git apply handoffs/room-control.wip.patch`)
holds a half-built server side from a stopped agent: `packages/protocol/src/sound.ts`
(`speakerSchema` console | wall, `roomVolumeSchema`, `wallScreenSchema` with a
`number`), `apps/server/src/domain/room/room-walls.ts`, and edits to the room,
its view, the connections and the socket handler. It stopped before the
election, the outbound views and any client code. Read it as a draft: keep
what fits, nothing in it was typechecked.

### Testing

Muted, always — and this feature *sets* a volume: keep the room volume at 0 in
every browser check, and verify it by reading `audio.volume` (instrument
`HTMLMediaElement`) rather than by listening. Pair two walls from
`http://localhost:5273/wall` to test switching.

## 2. Pause the whole game mid-round

### What Adrien asked

> A "pause" button for the host that pauses the whole game. The question, the
> choices and so on are hidden — say somebody has to go to the toilet in the
> middle of a round.

### Shape to build

- A `host.*` action that freezes the round where it is, and its resume.
- The server already knows how to freeze a round: `holdRoundClock` in
  `apps/server/src/domain/round/round-service.ts` (used while the host is
  away), the round conductor's wake-ups, and `advancesAt` set to `null`.
  Reuse that seam rather than patching sixteen games.
- While paused: the round clock stops, the clip pauses on the speaker
  (`round-audio.ts`), buzzes and answers are refused with a code of their own,
  and **every** screen — host stage, wall, players — hides the question, the
  choices, the clue, and shows a paused state instead. A game with nothing
  hidden still shows the paused state. Resume picks up clock and clip where
  they were.
- State travels in the snapshot (a field on the room or round view), never a
  per-event message.
- Do not confuse with `host.controlClip` (commit `0a04cc4`): that pauses only
  the clip under a blind-test *reveal*, and must keep working.
- UI: `impeccable` first; strings in both dictionaries.

### Testing

Tagged server tests for the freeze and the refusals, each broken once. In the
browser (muted): pause mid-round in a blind test and a quiz, check the host,
a raw-socket player and a wall all hide the question, then resume and check the
clock and the clip continue from where they stopped.

## 3. The host can always move a stuck round on

> If nobody presses the buzzer after counting to 36 (inner clock), nothing
> happens? The host must be able to decide to move on in every game that could
> get stuck. Unless there is already a limit?

Found so far, not yet confirmed in a browser: the inner clock has no round
clock (`roundDurationMsOf` returns `null` for it in
`packages/protocol/src/game.ts`) and no cap anywhere in
`packages/core/src/innerclock/` or `innerclock-round.ts`. And during `playing`,
`host-actions.tsx` hides `RoundActions`, the host's *reveal* press, for
`innerclock`, `reflex` and `challenge`. So a round nobody presses in waits
forever.

To do: list every game whose round can wait on a press that never comes (inner
clock, the reflex race, a slate or a sheet nobody sends, a buzzer nobody
takes…), and give the host a way out in each. Either the existing reveal press
(`host.reveal`, scoring only what was sent), or a cap the server enforces
(e.g. inner clock: target plus a margin), or both. The press must not give the
answer away where the stage hides it — that is why it was hidden for the inner
clock (the target is the answer). Tagged server tests for whatever closes the
round.
