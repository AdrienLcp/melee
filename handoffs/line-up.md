# The line-up: refused switches, a looping draw, stuck removals — and Atlas's name round

Reported by Adrien after an evening played with **every game ticked, one variant
of each** (quiz rubrics included). One session. Strike each item as it lands,
delete this file once none is left. Verify muted (`docs/browser-driving.md`).

The four bugs below most likely share **one root cause**, found by reading the
code (nothing was run yet). Prove it with a failing test first.

## The suspected root cause: `movedToEntry` builds settings the server refuses

- `packages/core/src/room/room-settings.ts:315-350` — `movedToEntry` spreads the
  host's remembered setup for the game *kind* (`...setup`, :339). The answer
  mode comes from that setup and is only fitted to teams (`modeFittedToTeams`,
  :343, :352-361), never to **the entry it moves to** (`offersAnswerMode`). The
  teams fallback is `opened.mode`, which suits the default game, not the entry.
- Modes depend on the entry for Atlas: `packages/core/src/room/game-capabilities.ts:251-263`
  (`answerModesFor`) — `direction: 'name'` offers `typed`/`choice`, `place`
  offers only `point`. So an Atlas variant whose direction differs from the
  remembered (or default `place`, `packages/protocol/src/game.ts:201`) setup
  gets a mode it does not offer.
- The server refuses the frame: `reconfigure`,
  `apps/server/src/infrastructure/messaging/socket-handler.ts:1856-1869` →
  `invalid_message`. Other `invalid_message` refusals there: teams (:1871),
  `lineUpHolds` (:1883, rule `packages/core/src/room/line-up.ts:30-49`).

Check every game whose modes depend on its settings, not only Atlas.

**Adrien's exported evening backs it** — `C:/Users/AdrienLacourpaille/Downloads/melee-parties.json`
(a `melee-host-export`, "Soirée Noël", 36 entries, `roundCount` 40, every deal
`both`, no entry carrying a `mode`). Atlas appears six times: `place` at 2, 18,
27 and **`name` at 13, 23, 30**. In the running order, entry 13 `atlas(name)`
comes right after 12 `quiz[flags]` — a refused switch to 13 replays 12, which is
exactly "two flags in a row". Load this file as the fixture of the regression
test and of the browser run.

## 1. "On n'a pas compris, réessaie" on the host screen

> Sometimes a message "we didn't understand, try again" appears on the host's
> screen — what is that?

`error.invalid_message` (`apps/game/src/presentation/i18n/dictionary-fr.ts:454`,
EN :474), shown at `apps/game/src/features/host/host-console-page.tsx:563/779/837`.
Most likely the automatic draw frame of item 2, refused as above. Beyond fixing
the cause: a refusal the host did not provoke by a press should not surface as
"try again" — there is nothing to retry. Decide what it says, or whether the
console recovers silently, and log the refusal reason during dev.

## 2. The draw after the programme plays the same game in a loop

> When we got to "random games after the programme", we had the same game on
> a loop.

The draw runs on the console: `apps/game/src/features/host/use-line-up-draw.ts:71-92`
→ `scheduledEntryAt` (`packages/core/src/room/running-order.ts:21-66`) →
`movedToEntry`. Pick: `next-game.ts:43-60` (least-played, other games first,
`Math.random`). Suspected loop: the drawn entry's frame is refused, so
`settings.lineUpAt` stays on the round just played, which replays; the client
never retries that round (`drawnForRoundId`, :49-53); the refused entry never
opens, so its play count (`lineUpPlayed`, `room-view.ts:87`) stays lowest and it
is drawn again every reveal. Play counting itself was ruled out
(`next-game.ts:130-160`, `round-service.ts:240-242`).

Test shape: a line-up holding an Atlas `name` variant with an Atlas setup
remembered as `point`.

## 3. Removing games in the lobby jams after two or three

> I removed several games from the evening one after the other; after 2 or 3
> it broke, I couldn't remove any more and had to close the room.

`takeOut`, `apps/game/src/features/host/evening-rounds.tsx:200-215` (enabled by
`canTakeOut`, :178), sends `withoutEntry` built from `view.settings`; a second
remove for draw-only entries at `evening-draw-page.tsx:126-136`. `withoutEntries`
(`line-up.ts:235-293`) moves on through `movedToEntry` when the removed entry is
the one `lineUpAt` points at (:285-292). Once refused, the server state is
unchanged and every later click rebuilds the same refused frame. The client
shows only the generic error, sets the undo state anyway (:209), and never
rolls back.

If the room had no Atlas variant, the cause is elsewhere: run the removal of the
entry `lineUpAt` points at, with every game ticked, against `line-up.test.ts`
(:122, :170, :339 expect `invalid_message`).

## 4. Two "flags" rounds in a row

> Every time we got two "flags" rounds back to back (maybe my config was bad).

Quiz rubrics are categories inside one `quiz` kind
(`packages/protocol/src/question.ts:25-39`), and "another game first" compares
`kind` (`next-game.ts:41, 49-58`). Ways it still repeats:
1. A refused draw (item 2) replays the same quiz entry — likely.
2. `dealtOrder` (`running-order.ts:114-170`) keeps host-placed and earlier rows
   as they are (:147-152) and checks adjacency for new rows only (`dealtInTurn`,
   :193-225); a removal closing the list up, or a drag, can put two quiz
   entries side by side.
3. Within one entry, `drawQuestion` skips the previous round's category
   (`apps/server/src/infrastructure/questions/question-bank.ts:189-191`).
4. Flags (quiz) followed by Atlas or silhouettes reads as a repeat although
   they are different games. Weigh whether "another game first" should
   compare rubrics too.

Reproduce Adrien's evening (every game, one variant each), let the planned rows
and the draw run, and log the sequence of `game.kind` + rubric.

## 5. Atlas: "name the country lit up on the map", asked several times

> In Atlas's "name a country" mode, I want a country (or a city of France,
> depending on the mode) to stand out in colour on the map, and the players
> have a field or four choices to find it. The map must be visible and
> touchable like in the "find a country" mode. I've asked you several times.

By the code this **already exists** (`91d3c65`, plan
`docs/plans/52-black-square-and-atlas.md:64-146`): `MapQuestion`
(`apps/game/src/presentation/components/map-question.tsx:22`) draws
`LazyWorldMap` with the country filled `--map-target` or the city dotted,
gestures on (`world-map.tsx:219`), above the four tiles or the field. A previous
session concluded the same and only relabelled the setting (`40bbd69`) —
Adrien still has not seen it, so **don't conclude it again from the code**.

Likeliest explanation: the root cause above — an Atlas `name` entry refused at
every switch never plays, and the table only ever saw `place` rounds. After the
fix, in a browser, muted:
- play an Atlas `name` round reached **through the line-up** (not from Atlas's
  own front door), world and France, `typed` and `choice`, at 390×844 and desk;
- check the map is big enough to read and pinch beside the tiles/field
  (`map-question.sass`, `minmax(0,1fr)`) — if it is a strip, fix the layout
  (`impeccable` first);
- send Adrien screenshots of the player screen. If what he describes still
  differs, ask him with the screenshot in front of him.
