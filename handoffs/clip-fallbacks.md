# Clip fallbacks: retry once, then swap the track before it starts

> « fais 1 + 2. Mais l'écran se recharge genre on voit carrément le navigateur
> reload la page entière ? ça fait cheap non ? »

Follows `dd4f8836` (*Tell the console when the speaker's clip plays no music*):
the speaker already detects a silent clip and reports it with
`speaker.reportClip`; the console shows it. Nothing yet *recovers*. Two
fallbacks, both decided:

1. **The speaker retries once, on its own.** Never a page reload: Adrien asked
   explicitly, and a reload would also lose the gesture that arms the audio.
   Only the hidden `<audio>` element reloads its source, seeks to where the
   round is, and plays. Nothing on screen moves.
2. **A clip that fails before the round starts is replaced.** During the
   countdown the server gets a fresh preview URL — or draws another track —
   and the round opens on music that loads. Once the round is `playing`, no
   swap (it would change what players are already answering): the current
   message stays.

## Where things are

- `apps/game/src/features/host/round-audio.ts` — `clipFault` state, the
  element `error` listener, the stall watchdog (`isClipStalled`,
  `CLIP_STALL_MS` in `packages/core/src/blindtest/clip-audio.ts`), the
  `refuse` closure inside the main effect (`NotSupportedError` on a real clip →
  `unreachable`, screen stays armed), `loadClip` / `moveTo` / `seekTargetMs`.
  `loadedRef` is keyed by `roundId` only: a new `audioUrl` on the **same**
  round would not reload today — key it on the URL too for step 2.
- `apps/game/src/features/host/silent-clip-report.ts` — sends a fault on
  change only.
- Server: `reportClip` in `apps/server/src/infrastructure/messaging/socket-handler.ts`,
  `room.sound.silentClip`, `silentClipOf` in `domain/room/room-walls.ts`, the
  tests in `apps/server/src/__tests__/wall.test.ts` (`[wall] …silent…`).
- The draw: `round-conductor.ts` (`drawPlayableTrack` →
  `domain/round/track-pool.ts`, `openRound`, `blindtestContent`), the signed
  preview URL from `fetchHostTrack` in `infrastructure/music/deezer-client.ts`.

## Steps

1. **Retry in `round-audio.ts`.** On the first `unreachable` or `stalled` of a
   round: `loadClip(deck, previewUrl)`, seek to `roundElapsedMs`, `play`. Set
   the fault (and so the report) only if that retry fails too. Pure rule in
   `clip-audio.ts` with a `[clip]` test (e.g. "retries once per round, then
   reports").
2. **Replace before start, on the server.** In `reportClip`, when the fault is
   `unreachable` / `stalled` and the phase is `countdown`: refresh the track's
   preview URL first (fetch again by id — the URL is signed and may have
   expired); if that fails, draw another track. Decide and write down whether
   a swap keeps the round id. With the `choice` mode, a new track means new
   candidates: check what players already see during the countdown before
   swapping them. Hold or extend the countdown if the draw takes longer than
   what is left. Server tests through the socket harness (stub Deezer as
   `wall.test.ts` does), each broken once on purpose.
3. **Client follows a new `audioUrl`** on the same round (see the
   `loadedRef` note above).
4. Strings only if a new state is shown (e.g. "Another track, this one would
   not load"); both dictionaries; `impeccable` first for any UI.
5. Muted browser check, as in the previous session: a standalone Playwright
   script (the Playwright MCP may be held by another session), `--mute-audio`
   plus `melee:volume` = `'0'` by init script, contexts in `en-US` locale,
   `context.route(/dzcdn\.net|\.mp3(\?|$)/…)` to 403 or hang the clip — the
   first request only, to show the retry recovering.

## Gotchas from the previous session

- The pre-push hook (`.githooks/pre-push`: lint:ci, spell, typecheck) reads
  the **working tree**, so another session's unfinished files can block a
  push. Push from a clean `git worktree add --detach ../wt-push HEAD` (then
  `pnpm install`), and remove it afterwards.
- A shared dictionary or `CHANGELOG.md` can carry another session's
  uncommitted lines: check `git show HEAD -- <file>` after every commit.
- `choice-fits` e2e flakes under the full run (see `fix-red-validate.md`).

## Done when

Retry and swap are in place with tests, checked in a muted browser,
`pnpm validate` green, CHANGELOG updated, this file deleted, pushed.
