# A table that runs itself: ready starts, ends and replays

Starts once `01-replay-and-ready.md` has landed (same files, and replay must
be right first). Read `README.md` first. Mapped read-only on 23/11/2026,
lines from `7ded3593`.

Adrien: "we played on my PC with an HDMI cable to the TV, and I had to get up
to click the start button, or at the end 'Voir les résultats'. Annoying.
Could we have, like 'Prêt' on the player's device, a way to launch when every
player is ready — and the same to see the results and to replay? Maybe not
always, maybe a setting in the table. Not sure."

## Today

- `player.ready` → `sayReady` (`socket-handler.ts:575, 1351`) → `markReady`
  (`room-service.ts:319-342`): dropped in countdown or when
  `hostOpensNextRound` is on, refused in play, **stored in lobby, revealed and
  finished** — but only `settleReadyHold` (`round-service.ts:2081-2106`, run on
  every publish from `room-engine.ts:126`) acts on it, on `revealed` only, and
  it bails on `isFinalRound` (`:2090`). All ready → `advancesAt` = now +
  `READY_HOLD_MS` (5 s), fired by `room-deadlines.ts:130` → `advance`.
- The phone shows Ready only on a non-final reveal
  (`player-round-stage.tsx:386-391`, `packages/core/src/round/asks-ready.ts:10`).
- Lobby start « À table ! »: `lobby-actions.tsx:80-92` → `host.startRound`.
  « Voir les résultats »: `reveal-actions.tsx:89-104` → `host.nextRound` →
  `end` → `finishGame` (`round-service.ts:2238`). « Rejouer »:
  `finished-actions.tsx:35-52` → `host.playAgain` + `host.startRound`.

## Decided

- **No new setting.** `hostOpensNextRound` already says who presses on: off
  (the default), the table drives **every** transition — start, each next
  round, results, replay; on, the host keeps every press. Its label in the
  table panel says that wider meaning.
- **Results**: drop the `isFinalRound` bail and show Ready on the final reveal;
  the deadline and the conductor already finish the game at `advancesAt`.
- **Lobby start**: a Ready press on the player's lobby screen
  (`player-round.tsx:193`), a room-level ready deadline (the lobby has no
  `round.advancesAt`), refused while no game is chosen, and at least two
  seats. A seat arriving after everyone was ready joins unready and holds the
  start until it presses (it is on screen).
- **Replay**: a Ready press on the player's final board and a deadline in
  `finished` (which `room-deadlines` ignores today) that replays the same
  evening.
- **Every self-started transition is shown and cancellable**: the 5 s hold
  draws its countdown on the wall, console and phones, and the host's own
  press (start, results, replay) still goes at once. A seat un-readying
  cancels it.
- A seated console counts like any seat (decided in 01).
- The protocol carries whatever deadline the view needs; state stays a whole
  snapshot. `docs/realtime-protocol.md` and CLAUDE.md _Ready_ follow.

## Done when

Server tests for each transition (all ready → starts / finishes / replays;
one unready holds; host press overrides; `hostOpensNextRound` on → nothing
self-starts), broken once each; seen in a browser with a wall, the console
untouched from lobby to replay, three seats; countdown motions filmed.
Changelog, delete this file and its README row.
