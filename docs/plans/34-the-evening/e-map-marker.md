# e — World map: the marker

**Goal.** GeoGuessr's gesture on a phone and on an 86" touch wall: pinch-zoom
and pan, a tap or a drag places a marker, the marker moves until the player
confirms; the host reveals; every screen shows the answers and *à 480 km*.

Start this step with the `impeccable` skill: it is a new interaction and a new
set of screens, inside the stage-29 world.

## What d left to the screens

Step d landed the game server-side (see the README's row): the protocol, the
judging, the bank of 157 country codes and the atlas on the Worker. Everything
Gamenight drew moves here, from `apps/web/src/features/world-map/` in
`C:/git/gamenight`:

| Gamenight file | Lands in | Change |
|---|---|---|
| `world-projection.ts` | app `features/worldmap/` | Unchanged: Equal Earth, fitted to the frame. Only the app projects, so it stays out of core; inverting it gives the `point` a marker sends |
| `world-atlas.ts` | app `features/worldmap/` | The app's half of the TopoJSON read; the codes table is already `@melee/core/worldmap/atlas-country-codes` |
| `country-hit-test.ts` + test | app `features/worldmap/` | Display only — *which country is under the marker* — with the tolerance divided by the zoom |
| `country-marks.ts` + test | app `features/worldmap/` | The ring around a small country becomes the reveal's |
| `country-names.ts` + the dictionary entries | `presentation/i18n/` | Names under `worldmap.country.*`, with the article form the prompt needs (*Place la France*); English as a dictionary too (decision 7) — 157 codes in `apps/server/src/infrastructure/questions/country-bank.ts` |

`d3-geo`, `topojson-client` and `world-atlas` get an app row in
`abstraction-boundaries.md` beside the server's. The spine tokens
`--spine-worldmap` / `--on-spine-worldmap` are owed in both palettes, the
shelf's tagline and description keys once it is shelved, and
`worldmap.scoring`'s sentence is a placeholder to reread with the screens.
Decision 14: add `'map'`-the-game (`worldmap`) to `ROOM_PRESETS.christmas` in
`apps/game/src/features/home/room-presets.ts` once it is shelved.

## The interaction

- **One SVG, a transform.** Pinch and pan with pointer events over Gamenight's
  `world-map.tsx`; `d3-zoom` is the candidate if two-finger handling gets
  hairy, from the `d3` family already imported. Double tap or a button resets.
- **Marker** — a tap places it, a drag moves it, a second tap elsewhere moves
  it there. It is a pawn in the seat's colour (the team's when Teams is on).
- **Confirm** — one press sends the point; a mis-tap must not cost a race. The
  marker locks and says *sent*.
- **Wall** — the same surface at room scale when the wall answers for a team
  (step c); targets sized for a standing adult's finger, and a
  swipe never scrolls the page (Gamenight's rehearsal note).
- **Weight** — the 1:50m atlas stays out of the join page and the lobby: loaded
  by the round's lazy chunk, measured on a throttled phone.

## The reveal

- Every marker on the map with a line to the answer, each labelled with its km
  (`Intl.NumberFormat` through the i18n layer: *à 480 km* / *480 km away*).
- The target country ringed (`country-marks.ts`), small ones included.
- Results ranked by distance, ties by arrival, in the reveal's chip shape.

## Screens

Console (the host's phone: the prompt, the target, the answers arriving, the
reveal), wall (16:9 and 9:16), player phone (the map, the marker, confirm,
sent, the reveal) — all inside the no-scroll spec's sixteen viewports plus the
two of step g.

## Done when

A simultaneous map round played from two real phones on the LAN dev server and
the wall: zoom, pan, place, move, confirm; the reveal draws both markers with
their km. Checked muted in a browser at 390×844, 1920×1080 and 1080×1920, and
the game reaches `shelvedGames`.
