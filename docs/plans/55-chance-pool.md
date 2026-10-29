# 55 — The chance pool

Asked 29/10/2026: the dice row under the planned games ("8 au hasard, parmi
Blind test, Quiz") is read-only. The host wants to choose which games those
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

## Steps

1. **Core + protocol**, with tests broken once: the field, its default, the
   remap in `withoutEntry` / `withEntryDuplicated` / the add path, the dealing
   rules above, `hasEntryLeftToDeal` and `endsTheEvening` counting a `chance`
   entry as dealable.
2. **Server**: refusal of `chance` on a host-content game, socket suite for a
   pool-only entry drawn past the rows and never given one.
3. **Console** (start with the `impeccable` skill): the dice row becomes a
   button opening a "Au hasard" page — the pool's games, each opening its
   settings page like a planned entry, a switch per planned entry that serves
   its own content ("aussi au hasard"), and "Ajouter un jeu au hasard" reusing
   the shelf, adding a `chance` entry. The dice row's detail lists the pool.
   Verified muted in a browser with a pool-only quiz drawn on round 3.
4. Saved evenings carry the field; `docs/game-catalogue.md` and the CLAUDE.md
   line-up paragraph say what the pool is.
