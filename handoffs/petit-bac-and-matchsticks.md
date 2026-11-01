# Petit Bac keeps a half-typed word, and a "+" gives up only its upright

Two small game-logic fixes, independent, one session. No new screen.

## 1. Petit Bac: a word being typed when the sheet closes still counts

> « dans le jeu "petit bac", j'aimerais bien que si quelqu'un a commencé à
> écrire dans un input, on compte sa réponse, même s'il n'avait pas fini et que
> son input est encore focused (je suppose que tu enregistre au blur en ce
> moment ?) »

The premise is half right. The sheet does not save only on blur, but it does
lose words, and focus has nothing to do with it.

### What the triage verified

- **When a line is sent** (`apps/game/src/features/player/petit-bac-sheet.tsx`):
  1. 600 ms after the last keystroke (`SAVE_DELAY_MS` :30, effect :124-132).
     The effect depends on `[drafts]`, so every keystroke restarts the timer:
     it is a **debounce**.
  2. On blur (:192).
  3. On Enter, which moves to the next line (:196-199).
  4. On the stop press, `saveAll()` before `onStop()` (:229-230). This flushes
     the stopper's sheet only.

  The frame is `petitbac.write` (`packages/protocol/src/client-message.ts:281-286`),
  an upsert where `''` clears the line, sent from `player-round.tsx:621-627`.
  The seated console uses the same sheet (`host/room-stage.tsx:299-307`).
- **The server takes repeated writes**: `writePetitBacLine` just sets the value
  (`apps/server/src/domain/round/petit-bac-round.ts:168-176`). It refuses once
  `sheetsClosed` is set (:164-166; test `petit-bac-game.test.ts:256-265`).
- **The clock running out closes the sheets at once**:
  `round-conductor.ts:876-879` → `closePetitBacSheets` sets
  `sheetsClosed = true` (petit-bac-round.ts:319). There is no grace. Only a
  stop press gets one, of 5 s (`round-service.ts:1898-1906`).
- **The client then swaps the sheet for `PetitBacVote`**
  (player-round.tsx:602). The sheet unmounts, its cleanup clears the pending
  timer (petit-bac-sheet.tsx:131), and the draft is gone. A late frame would
  be refused anyway.
- **So what is lost** is everything typed in the last ~600 ms plus the trip,
  and the whole word for anyone who types without a 600 ms pause.
- `6b00485c` (`player.lean`, `features/player/use-lean.ts`) is the same
  problem solved for swatch, atlas and timeline. Its comment at :6-9 names this
  exact bug: *a debounce never fires for someone who keeps going*. It does not
  reach Petit Bac, whose sheets close in `closePetitBacSheets` and not in
  `closeRound`. It isn't needed there either: `petitbac.write` already keeps
  the server's copy current.
- **No WebSocket rate limit** exists (only HTTP room creation is limited).
  Every write calls `publishRoom` (`socket-handler.ts:942`): a full broadcast
  plus a storage write.

### Decided

1. **A trailing throttle replaces the debounce.** Every changed line goes out at
   most every ~300 ms while someone types, following the `use-lean` pattern.
   Keep the blur and Enter flushes.
2. **The screen flushes when time is up.** Each screen knows the deadline on
   the synced clock. When it is reached, the sheet freezes its fields and sends
   every line not yet sent, before it ever unmounts. The same goes for the
   close that follows a stop press's grace: check whether that deadline is on
   the view, and put it there if not.
3. **The server closes the sheets a short grace after the clock**, a named
   constant of about 500 ms, so the flush sent at the deadline lands. The
   server still owns the time: it closes on its own clock, and nothing in the
   frame is trusted to say when it was typed. Writes after `sheetsClosed` stay
   refused, because the vote's rows must not change under the voters.
4. **A write that changes no filled count commits without broadcasting**
   (`commitRoom` rather than `publishRoom` in `answerPetitBacFrame`; the count
   is in `room-view.ts:723-745`). Players never see each other's words before
   the vote, so a broadcast per keystroke tells them nothing. Check first that
   the console's view doesn't show the text live; if it does, keep publishing
   for the host frame only.
5. **Tests**:
   - fake timers: continuous typing sends at least every 300 ms;
   - a line typed and still focused at the deadline reaches the server;
   - a write inside the grace is kept, and one after the grace is refused;
   - the no-broadcast path.

   Break each once on purpose. Server tests go through the socket harness
   (`.claude/rules/test-conventions.md`).

## 2. Matchsticks: lifting a "+" always takes the upright

> « sur le jeu "Allumettes", tout à l'heure la réponse était de changer une
> barre du "+" pour faire un "-" et la mettre autre part. Mais c'est la barre
> horizontale qui a bougé quand je l'ai drag&drop, c'est incohérent, un barre
> verticale n'existe pas en maths, il faut que ce soit que la barre verticale
> qui bouge sur un "+", tout le temps, non ? »

He is right. A "+" without its flat stroke is not a symbol, and the server
already says so: that move can never be paid.

### What the triage verified

- **The model**: `+` is `['h','v']` and `-` is `['h']`
  (`packages/core/src/matchsticks/glyphs.ts:22-25`; the slots are documented at
  `protocol/src/matchsticks.ts:21-26`). Both strokes share **one centre**
  (`apps/game/src/helpers/matchstick-geometry.ts:40-41`).
- **What gets grabbed**:
  - The `.reach` buttons have `pointer-events: none`
    (`matchstick-board.sass:40`). The board handles every press through
    `placeUnder` (`matchstick-board.tsx:204-209`) → `nearestPlace`
    (geometry :194-216).
  - Inside the plus, the distance to `h` is |dy| and to `v` is |dx|
    (:174-186). So the plus is cut along its diagonals: the **left and right
    arms lift `h`**, top and bottom lift `v`.
  - A tie goes to `v` (`<=` at :209, `READING_ORDER` :63-73).
  - The keyboard toolbar also offers `h` as a separate stick
    (board :353-363).
- **What the server pays**: `gradeMove` → `applyMove` (`matchsticks-round.ts:49-74`,
  `one-move.ts:58-76`). Lifting `h` leaves `['v']`, and `glyphWith` matches no
  sign. A lone stroke is never a `1` (that takes `b` and `c`). The result is
  `null`, so 0 points. Every "+ → −" solution has `from.slot: 'v'` by
  construction of `oneStickMoves`. So the drag landed on a side arm, carried
  `h`, and was paid nothing, without a word (`matchsticks-move.tsx:29-34`
  warns nobody, since a warning would be a hint).

### Decided

1. **Core**: `liftableSticksOf(glyph)` in `glyphs.ts` returns `['v']` for `+`
   (every stick for every other glyph). `isPlayableMove` (`one-move.ts:30`) and
   `oneStickMoves` (:88) use it, so a forged `h` lift is refused as
   `invalid_message` (round-service.ts:711).
2. **Client**: a press anywhere on a "+" that still holds both strokes hands
   back `v` (`placeUnder` / `onPointerDown`). The strokes share a centre, so
   the grip doesn't jump. Drop that `h` from the keyboard toolbar. Check the
   case where `v` has already moved and the plus shows `h` alone
   (`shownMoveOf`, `stick-move.ts:19-26`): `h` is then a plain "−" and liftable
   as one.
3. **Tests**:
   - core: lifting a plus by its upright gives `-`; `h` off a `+` is not
     playable; no generated solution ever lifts `h` from `+`;
   - a pure geometry test: a press on the horizontal arm of a whole plus lifts
     `v`. There are no client tests on matchstick geometry today; this is the
     first;
   - `matchsticks-game.test.ts:231-242` builds its `unreadable` fixture from
     `sticksOf`; move it to the new helper.

## Verify

Muted browser (`docs/browser-driving.md`: `melee:volume` = `'0'` by init
script before the first navigation), at phone 9:16.

- **Petit Bac**: type without pausing through the deadline; the vote shows the
  word.
- **Matchsticks**: deal a "+ → −" puzzle, drag the plus by its side arm; the
  upright comes away, and the move is paid.

Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
`-- <paths>`, push.
