# Replay, the seated host's ready, the next-round press

Three bugs Adrien hit on 22–23/11/2026. Read `README.md` first. Diagnosed
read-only on 23/11; line numbers are from `7ded3593`.

## 1. « Rejouer » after a Mêlée générale plays blind test on buzzer only

Adrien: "when we finish and press replay, every time it launched only blind
test in buzzer mode. It did not relaunch a Mêlée générale. Big bug."

**Cause (confirmed in code).** The server keeps the line-up and the running
order (`restartGame`, `apps/server/src/domain/round/round-service.ts:2254-2266`).
Two things combine:

- `rewoundToFirstRow` (`packages/core/src/room/running-order.ts:195-211`) goes
  back to row 0, which is always the first decade's blind test (`grandMixFor`
  lists entries in `shelvedGames` order, blind test first;
  `withSavedEvening` opens on `first = 0`, `saved-evening.ts:166-167`).
- Its mode is `modeOfferedBy({ game: entry, preferred: settings.mode })`
  (`running-order.ts:210`): `settings.mode` is the **last round's** mode
  (point, order, colour…), which blind test does not offer, so it falls back
  to `answerModesFor(game)[0]` = `SERVED_MODES[0]` = `'buzzer'`
  (`game-capabilities.ts:6-9`). That bypasses `rememberedOnReadyMade` /
  `movedToEntry`, which would have opened the entry on its own mode (choice).
- **It then sticks**: the next settings frame the console sends files
  `games.blindtest.mode = 'buzzer'` into the stored `HostPreferences`
  (`packages/core/src/room/host-preferences.ts:250-260`), so later blind tests
  drawn by `useLineUpDraw` keep buzzer — and buzzer needs the host to judge.
  Consoles in the wild already hold that stored value.

**Fix.** Rewinding (and `withNextEntryDealt`, `running-order.ts:168`, the
same pattern) opens the entry on the mode `movedToEntry` would give it — the
entry's own mode (`openedSetup(...).mode`), not the last round's. Decide how a
ready-made entry ignores a remembered `buzzer` that a bug wrote: a
ready-made line-up's entries carry their mode, and the remembered per-game
setup must not override it on a ready-made evening. Test in
`line-up.test.ts`: an evening ending on an atlas round replays its blind test
on `choice`; a console holding `games.blindtest.mode = 'buzzer'` from the bug
still opens Mêlée générale's blind tests on their entry's mode. Break each
test once.

**Decided**: a replay keeps the same running order (CLAUDE.md, _Line-up_:
"a replay plays it again from its first row") — content differs anyway, and a
host who dragged the order wants it back.

## 2. A seated host is never waited for

Adrien: "the host was playing, plus one player. When the player pressed
ready it launched at once, the host wasn't waited for. Fix it."

**Cause (confirmed, by design).** `seatsAwaited`
(`round-service.ts:2060-2066`) leaves out `consoleSeatId(room)`
(`console-seat.ts:8`) because "the console starts the next round with a press
of its own". With one other seat, that seat's ready arms the round in
`READY_HOLD_MS`.

**Decided**: when the table drives the next round (`hostOpensNextRound`
off), a seated console is a seat like any other — it gets the Ready press on
its seated reveal and is awaited. Its own « Manche suivante » press still
overrides everyone at any time. With `hostOpensNextRound` on, nothing changes.
Update CLAUDE.md's _Ready_ sentence.

## 3. The next-round press is broken on a TV (photos)

Adrien: "the next-round button with the next game's name is buggy, redo it."
On a 1920×1080 console the blue spine « Quiz · Géographie » overlaps the left
of the red « Manche suivante », and the blind test's « Depuis le début »
(`blindtest.audio.replay`) is cut behind it.

**Component**: `apps/game/src/features/host/next-round-press.tsx` + `.sass`,
rendered in `reveal-actions.tsx:146`. **Probable cause** (measured off the
photos, not seen in a browser): the press is laid out counting the spine at
its min-content (name wrapped) while the spine draws full width — the spine
has `flex-shrink: 0` (sass `:35`), the press `justify-content: flex-end`
whenever the spine is open (`:23`) and `padding: 0` (`:10`), so whatever
squeezes the press (the footer's wrapping row and container query,
`host-console-page.sass:361-391`, or the size glide's fixed-pixel landing)
pushes the spine out over its neighbour.

**Do**: reproduce at 1920×1080 on a blind test reveal (clip controls present)
and on a quiz reveal first, then fix so the press never overlaps — the spine
wraps or the press keeps its full width; `flex-end` only during a glide.
Adrien said "redo it": if the spine-on-the-press idea cannot hold at every
width, the `impeccable` skill draws alternatives (the next game said above
or beside the press). Film the spine opening and the rename between two
reveals.

## Done when

Replay of a finished Mêlée générale plays the whole line-up on each entry's
mode, seen in a browser with three seats; a seated host plus one seat waits
for both; the press is clean at 1920×1080 and at phone width, filmed.
Changelog, CLAUDE.md _Ready_, delete this file and its README row.
