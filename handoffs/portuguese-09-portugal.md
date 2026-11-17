# Portuguese 09 — Portugal's own content

Series: `handoffs/README.md`. Needs 08 landed. Read
`docs/plans/72-portuguese.md` (session 01's "room's country" decision) and the
Atlas plans in `docs/plans/`.

## The work

1. **Atlas — `portugueseCities`**, beside `frenchCities`, never in its place
   (`protocol/atlas.ts:32`):
   - a city bank like `city-bank.ts`: the eighteen district capitals, the
     two autonomous-region capitals left out with their islands, and towns a
     table knows (Sintra, Óbidos, Guimarães, Nazaré, Lagos…), tiered;
   - a `MapRegion` `portugal` (`infrastructure/map/world-geometry.ts`):
     mainland frame, its own projection, Madeira and the Azores cropped the
     way France's overseas territories are;
   - the dispatch branch (`round-conductor.ts:164`), distance pay
     (`core/atlas/distance-pay.ts`), the place set's dictionary keys in three
     languages, `mcp/game-notes.ts`.
2. **Ready-made evenings**: `ready-made-line-ups.ts:138` picks French cities;
   a Portuguese host gets Portuguese cities.
3. **Blind test**: the decade source pairs an international Deezer playlist
   with a French one per decade (`deezer-client.ts:316`). Add a Portuguese
   editorial playlist per decade and deal it to a Portuguese table, the way
   session 01 decided. Check each playlist plays from Portugal.
4. Screens touched here start with `impeccable`, are checked muted in a
   browser and filmed where they move.

## Done when

A Portuguese table plays Portuguese cities on its own map and Portuguese
decades in the blind test, `pnpm validate` is green, staging shows it, this
file is deleted and the series' rows struck from `handoffs/README.md`.
