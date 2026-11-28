# Handoff — the ready countdown stuck, a returning player given a new seat

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 1. Start with the
`engineering-discipline:diagnosing-bugs` skill: both are reported bugs, fix
them on sight, each with a socket-harness test broken once on purpose._

## 1. The countdown runs to zero and nothing starts

Adrien: « Quand tout le monde mettait prêt on a eu quelques petits soucis,
avec l'animation qui se fait en boucle mais rien qui se passe ». Also: « quand
elle a lancé la première partie […] le fait que tout le monde doive être prêt
pour passer n'a pas fonctionné ».

**Not the setting.** Ready is already on by default: `hostOpensNextRound`
defaults to `false` (`packages/protocol/src/room.ts:338, 479`), no ready-made
evening sets it, and it is the Salle tab's « Tu lances tout toi-même » switch
(`setup-tabs.tsx:574-586`). Adrien's « coché par défaut » holds already — say
so in the final reply; the failure is one of these paths.

The server drives it: `publishRoom` → `settleReadyHold` / `settleTableStart`
(`apps/server/src/domain/round/round-service.ts:2093-2140`), the alarm set from
`room-deadlines.ts:41-90`; screens only draw `readyStartsAt` /
`round.advancesAt` (`reveal-hold.ts`, `table-start-hold.tsx`,
`back-at-the-table.tsx:84-124`). Three candidates, all to reproduce:

- **(b) A lobby start that fails keeps its deadline — likely the bug.** The
  `start` handler (`round-conductor.ts:1318-1331`) calls `beginRound`; its
  failure branches (`no_content_available` for quiz, matchsticks, black square,
  timeline, atlas, most likely, five clues, think alike; `spoken_needs_two_teams`
  — `round-conductor.ts:473-538`) tell the host and publish without clearing
  `readyStartsAt`, and `settleTableStart` keeps it while the table stays ready
  (`round-service.ts:2137`). Deadline in the past → alarm re-fires → same
  failure, a countdown stuck at zero on every screen. A reveal is safe
  (`advancesAt` is nulled first, `round-conductor.ts:393-398`). Her first game
  ticked every game, the three host-judged ones included: a refused start
  there is plausible. Fix: a failed start clears the ready of every seat (or
  the deadline) and says why on every screen, not only on the console.
- **(a) The console's socket is gone.** `start` and `advance` deadlines wait
  on `isHostConnected` (`room-deadlines.ts:64-68`) while the screens keep
  drawing the countdown. A TV browser that sleeps or drops its socket does
  exactly this. Fix: a countdown is drawn only while it will be honoured — the
  view says the room waits for its host, and the countdown restarts when the
  console is back.
- **(c) A blind test draw failing in a loop** restarts the countdown each
  `DRAW_RETRY_MS` (`round-conductor.ts:1170-1201`): looks like a loop. Check it
  says what it waits for.

Also: an away seat (`isConnected` false) holds the start up to
`ABANDONED_SEAT_MS` = 10 min (`round-service.ts:2077-2084`,
`seat-presence.ts:44`). Check the screens say which seat is awaited; if they
do not, that is part of the fix.

## 2. A player came back with a new profile at 0, the old one still there

Adrien: « un joueur a été kick. Et en revenant ça lui a créé un nouveau profil,
et l'ancien était encore présent on a dû la kick. Du coup son nouveau profil a
recommencé à 0 point. »

The server reclaims a seat by `sessionId` only (`joinAsPlayer`,
`room-service.ts:46-108`); with none matching it makes a new seat, and the same
name is refused `nickname_taken` (`:83-85, 400-413`) — so she typed another
name. Ways a device comes back with a new `sessionId`
(`session-storage.ts`, `session-memory.ts`): the QR opened in a scanner's
in-app browser then in the real one (two storages), a private window, a
different origin, a fatal refusal voiding the claim. « Kick » here is most
likely her socket dropping (the seat stayed, so it was not `host.removePlayer`,
which deletes the seat).

**Decided: an away seat can be taken back by its name.** When a join is
refused `nickname_taken` and the seat holding that name is away
(`isConnected` false), the form offers « C'est toi ? Reprendre ta place » and
the server hands that seat — score, team, ready — to the new `sessionId`. A
connected seat is never taken this way. At a table, the name is identity
enough; the host still sees everyone and can remove a seat. Strings in all
three dictionaries; protocol message or a flag on `player.hello` per
`.claude/rules/realtime-protocol.md`.

Also find why her claim was lost if the logs or the code say (in-app browser
vs real browser is the usual suspect) and write the finding into
`docs/realtime-protocol.md` beside the session id.

## Verify

Socket-harness tests for: a refused lobby start does not loop; a countdown is
not left running with the console away; a seat reclaimed by name keeps its
score. Then a muted browser pass: two players, one closes its tab and joins
from a fresh profile under the same name, gets its seat back with its points.
Film the ready countdown's start and its cancel. CHANGELOG entries.
