# 55 — The chance pool

Asked 29/10/2026: the dice row under the planned games ("8 drawn, among
Blind test, Quiz" on a French console) is read-only. The host wants to choose which games those
rounds are drawn among, and with which settings — including a game that has no
planned row of its own.

## Today

`scheduledEntryAt` (`packages/core/src/room/running-order.ts`) draws every
round past the running order's last row among the line-up's entries that serve
their own content (`fillersOf` mirrors it in `evening-rounds.tsx`). The pool is
therefore implied by the line-up: an entry cannot be drawn without also owning
a planned row (`dealtOrder` deals every never-played entry one), and a planned
entry that serves its own content cannot be kept out of the draw.

## The model

One array parallel to `lineUp`, remapped with it on every edit exactly as
`runningOrder` is:

```ts
/** What each entry is dealt to: a planned row, the draw past the rows, or both. */
lineUpDeals: z.array(z.enum(['row', 'chance', 'both'])).max(LINE_UP_MAX_ENTRIES)
```

- A new entry defaults to `both` when its game serves its own content, `row`
  otherwise — which is exactly today's behaviour, so an old snapshot or a saved
  evening missing the field reads as that default (a `.default` resolved
  against `lineUp` in one place, not at each reader).
- `chance` is refused by the server for a game whose content the host brings:
  it is played out after one round (`isPlayedOut`), so it cannot be drawn twice.
- `dealtOrder` gives no row to a `chance` entry; `scheduledEntryAt` draws past
  the rows among `chance | both` entries, falling back to the whole line-up
  only when that set is empty (today's "an evening with none of those").
- Not a field on `GameSettings`: a game's settings are the game's, and the same
  settings may sit in the pool and in a row.

Why not a second list of `GameSettings`: `lineUpAt`, `lineUpPlayed`,
`playedPerEntry` and the "write `game` back into its entry" rule all index
`lineUp`; a second list would need a second index on every one of them.

## Where it stands

Steps 1, 2 and 4 landed 29/10/2026: `@melee/core/room/line-up-deals.ts` holds
the default, `dealsHold` and `withEntryDealt`; `nextEntryAt` takes an
`isDrawable` filter, so the draw keeps its "another game first" rule against
the round just played whatever pool it draws from. Three departures from the
model above:

- The default is not a Zod `.default` resolved against `lineUp`: the field
  defaults to `[]`, and a missing index reads as its entry's default through
  `dealsOf`. The server writes the full array back on every frame.
- A game the host brings is refused `both` as well as `chance`, so the rule is
  one sentence: only a game serving its own content is drawn.
- `dealtOrder` keeps the round about to open on a `chance` entry when the host
  or the draw put it there; dropping that row would shift every planned row
  after it by one.

`docs/game-catalogue.md` names no draw rule, so CLAUDE.md's line-up paragraph
is where the pool is said.

Step 3 landed 29/10/2026: `evening-draw-page.tsx`, opened from the dice row.
The shelf takes `isDrawnOnly` and lists only the games a draw may land on,
rather than offering the others greyed out. An entry's page opened from the
draw goes back to the draw. Seen muted at 1400×900 and 375×760 dark: a quiz
switched out, a reflex added to the draw alone, the dice row reading
*among Reflex*. The round drawn on it is the socket suite's
(`[chance-pool] plays an entry in the draw alone`), not replayed in a browser.
Step 5 is what is left.

## Steps

1. **Core + protocol**, with tests broken once: the field, its default, the
   remap in `withoutEntry` / `withEntryDuplicated` / the add path, the dealing
   rules above, `hasEntryLeftToDeal` and `endsTheEvening` counting a `chance`
   entry as still to deal.
2. **Server**: refusal of `chance` on a host-content game, socket suite for a
   pool-only entry drawn past the rows and never given one.
3. **Console** (start with the `impeccable` skill): the dice row becomes a
   button opening a "drawn" page — the pool's games, each opening its
   settings page like a planned entry, a switch per planned entry that serves
   its own content ("also drawn"), and an "add a game to the draw" row reusing
   the shelf, adding a `chance` entry. The dice row's detail lists the pool.
   Verified muted in a browser with a pool-only quiz drawn on round 3.
4. Saved evenings carry the field; `docs/game-catalogue.md` and the CLAUDE.md
   line-up paragraph say what the pool is.
5. **Overwrite a saved evening** (asked 29/10/2026): updating one today means
   deleting it and saving again. `withEveningSaved` in
   `packages/core/src/room/saved-evening.ts` already replaces an evening of
   the same name in place, so the gap is the console's
   (`features/host/use-saved-evenings.ts` and its form): an evening loaded
   from the list, then changed, offers *Save over "<name>"* beside saving
   under a new name, and typing a name already kept says it will replace it
   rather than adding a twin. Done with step 3, `impeccable` first.
