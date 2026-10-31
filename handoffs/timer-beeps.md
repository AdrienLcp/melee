# The timer's beeps: an early second beep, and beeps out of nowhere

Two audio reports from Adrien. One session, after `handoffs/between-rounds.md`
item 1 (it changes when a countdown runs over a reveal). **Never listen**:
volume 0 before the first navigation, and count the cues instead — see
`docs/browser-driving.md`, "A cue that cannot be heard can still be counted".
Strike each item as it lands, delete this file once none is left.

## Where the beeps come from (one source)

- `apps/game/src/presentation/audio/timer-cue.ts:99-121` — `useTimerCue` plays a
  1320 Hz Web Audio tick at `context.currentTime` (1980 Hz on the last second)
  for each of the last 5 s (`TICKING_FROM_SECOND`, :13), plus a two-tone "time
  up" at the end of a round or floor (:74-91, :112-116).
- Mounted on the speaker only: `features/host/host-console-page.tsx:227` (no
  wall speaking, :211) and `features/wall/wall-page.tsx:106`. Players never beep.
- Timing: `apps/game/src/presentation/timing/last-seconds.ts`. `currentDeadline`
  (:46-90) returns `countdown` (from `startsAt` + clock offset), `round`
  (`playing` with `durationMs`, `durationMs - roundElapsedMs`) or `floor`
  (`buzzed`, `expiresAt`). `useLastSeconds` (:114-195) is a `setTimeout` chain.

## 1. The first two beeps are too close together

> Sometimes the first two beeps feel too close, compared with the next ones,
> which feel a real second apart.

Suspects, likeliest first:
1. **The first tick lands mid-second.** `check()` runs as the effect starts
   (:189) and ticks for `Math.ceil(leftMs / 1000)` (:167, :178-183). The default
   countdown is 3000 ms (`packages/protocol/src/room.ts:331`); the snapshot lands
   L ms late, so "3" plays at 3000−L and "2" only 1000−L later.
2. **The clock offset is re-estimated mid-countdown**: a ping every 5 s
   (`infrastructure/messaging/use-room-socket.ts:80,180`), each pong `setClock`
   (:137) → re-render → `endsAt` re-anchored (:160).
3. **The deadline is computed during render** (`remainingMs`, :63, a dependency
   at :194), so the effect re-runs on most renders of the busy console.

Fix shape: compute the deadline once per snapshot / `startsAt`, schedule every
tick on `AudioContext` time against whole seconds of the deadline, and skip a
first second already more than ~150 ms gone rather than play it late.

## 2. Beeps in the middle of a round or of the results

> Sometimes in the middle of a Petit Bac, or another game, or on a game's
> results, we hear the timer's beeps (3 or 4) for no reason.

Every way the sequence fires outside an obvious countdown:
1. **The next round's countdown runs over the reveal.** With a hold, the server
   opens the next round a countdown before `advancesAt`, on purpose
   (`apps/server/src/domain/round/round-service.ts:1604-1621`): the phase turns
   `countdown` while results are still on screen. Likely "on the results".
   Decide with item 1 of `between-rounds.md`: the beeps are fine **if the
   reveal visibly counts down with them** — make it, or stop ticking there.
2. **Last-seconds ticks of a timed round** (Petit Bac included): five ticks +
   time-up on any `playing` round with `durationMs` (:67-77). Probably what was
   heard "in the middle" — check nothing on screen says time is running out;
   if so, show it (the ticks are useful, the surprise is not). The anchor
   ignores snapshot latency and `endsAt` resets on every snapshot (:160), so a
   game sending many snapshots (Petit Bac answers) jitters.
3. **Pause / resume, or the host leaving and returning, replays them**: a null
   deadline clears `marksRef` (:136-144), the next mark starts at `+Infinity`
   (:149-158); a resumed countdown restarts with a new `startsAt`
   (`round-service.ts:1431-1435`); a null deadline within 400 ms of the end
   fires time-up (:98, :136-141).
4. **A remount of the speaker** (reload, reconnect, speaker moving to another
   wall) starts with no marks and ticks whatever seconds remain.
5. **The buzz floor** ticks the last 5 s of `answerWindowMs`.

Keep marks across a pause and a remount (keyed by round id + deadline kind),
and a test per source in the timing module.
