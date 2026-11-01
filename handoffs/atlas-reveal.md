# Atlas reveal: frame the answer tightly, and cross the date line the short way

> « quand on voit le résultat de Atlas, avant, c'était trop zoomé et on voyait
> pas où c'était, tu as dézoomé, mais trop dézoomé je trouve. Quand la réponse
> est en Europe on pourrait par exemple avoir juste l'Europe de visible ? Enfin,
> si tous les joueurs ont répondu en Europe bien sûr, sinon on dézoome pour voir
> toutes les réponses des joueurs. »
>
> « quelqu'un a répondu toute à droite de la map, et la réponse était tout à
> gauche. Mais du coup elle était pas si loin que ça je pense, la terre est
> ronde, non ? Il faudrait repenser ça, le trait traversait toute la terre. Je
> sais pas trop comment faire. Couper le trait sur les bords ? Faire une planète
> en 3D ? Autre ? Je te laisse faire des propositions. »

Both are drawing bugs. **The score is right**: the server measures on a sphere
(see below). Nothing on the wire changes. One session.

## What the triage verified

- **Stack**: hand-built SVG with `d3-geo`, `topojson-client`, `world-atlas`
  (`apps/game/package.json`). The only browser module allowed to import them is
  `apps/game/src/infrastructure/map/world-geometry.ts`
  (`.claude/rules/abstraction-boundaries.md`). Lazy-loaded through
  `presentation/components/lazy-world-map.tsx`.
- **Projection**: `geoEqualEarth().fitWidth(1000, Sphere)` at
  `world-geometry.ts:282`, so 1000 × 486.7 map units. France has a conic
  conformal (`:301-326`). Projected paths are cached per region (`:328-343`).
  Data is `world-atlas/countries-50m.json` (756 KB). The server reads the same
  file.
- **One framing for every screen**: wall (`wall-page.tsx:249` → `RoomStage` →
  `reveal-panel.tsx:359-365`), console (`host-console-page.tsx:776, 836`) and
  player (`player-round.tsx:1251`) all go through `MapReveal`
  (`presentation/components/map-reveal.tsx:98`), and so through `MapSurface`.
  Only the frame's aspect differs.
- **The reveal's framing** is the initial state of `useEasedMapView`, at
  `world-map.tsx:184-202`:
  `framedOn({ box: atLeastSpanning({ box: boxAround(...), span: map.width * REVEAL_LEAST_SPAN }), frame })`.
  - `REVEAL_LEAST_SPAN = 0.2` (`world-map.tsx:69`); `SHOWN_LEAST_SPAN = 0.08`,
    `SHOWN_CONTEXT = 3` (`:61-63`); `CONTROLS_INSET = 56` (`:55`).
  - `FRAMING_MARGIN = 0.15` per side and `MAX_ZOOM = 24`
    (`helpers/map-view.ts:46`, `:14`).
  - `atLeastSpanning` (`map-view.ts:26-43`) grows **both axes** to the span,
    so the smallest box is a 200 × 200 square. `boxAround`
    (`world-map.tsx:457-482`) is a flat min/max over projected points.
- **Why it is too far out now**: Europe is about 105 × 65 map units (Lisbon
  477,104; Moscow 582,53; Helsinki y 42; Athens y 107). A 200 × 200 floor is
  twice Europe's width and three times its height. On a 16:9 frame the height
  binds, so the view shows about 508 × 286 units: half the world, from the
  Arctic to the equator.
- **History of the zoom**:
  - `16262c3e` framed the target and every pawn with no floor, so a tight
    cluster zoomed 24× (« trop zoomé »).
  - `8bb2c5eb` added the square floor and fitted France whole. Its reason:
    *"A tight cluster zoomed the reveal onto a corner of France, its labels
    stacked… the world no tighter than a continent."* (also in
    `docs/plans/52-black-square-and-atlas.md:94-95`). Keep that guard against
    stacked labels; it is the floor's **shape** that is wrong.
- **The line**: a straight SVG `<line>` in screen pixels
  (`world-map.tsx:555-564`). It runs from the projected pawn to
  `nearestVertex(target.vertices, at)`, a flat Euclidean distance over projected
  points (`world-geometry.ts:346-357`). There is no great circle, no split at
  the edge and no date-line handling anywhere.
- **Panning**: one fixed world, no wrap. `clampedView` keeps the map's edges in
  the frame (`map-view.ts:65-88`).
- **Scoring is spherical and wraps**: `greatCircleKm`
  (`packages/core/src/atlas/distance.ts:48`) and `distanceToRingsKm`
  (`:83-104`) work in 3D vectors. `distanceToCountryKm` (`:115-122`) uses d3's
  spherical `geoContains` (server `world-atlas.ts:130-131`), called from
  `apps/server/src/domain/round/round-service.ts:921-937`. Run with the real
  code: 179°E against 179°W at 65°N gives 94 km. **No test crosses the date
  line** (`distance.test.ts`, server `world-atlas.test.ts`).

## Decided

1. **Frame the answer and every pin, with a floor sized to the frame and not
   a square.** Grow the box to the frame's aspect first, then require only
   the *longer* side to reach a floor of about 0.12 of the world's width. That
   is Europe with its 15% margins. So everyone in Europe shows Europe, and one
   pin in Brazil zooms out until it is in. Same fix for France mode? No: France
   keeps its whole-country fit. Touch `map-view.ts:26-43`, `world-map.tsx:69`
   and `:194-197`, and rewrite `map-view.test.ts:188-198`. Pick the exact
   floor by looking: a cluster of three pins around Paris on the world map
   must not stack its labels. That is the case `8bb2c5eb` fixed.
2. **The date line: turn the map, don't build a globe.** When the shortest
   longitude span covering the answer and every pin crosses ±180°, the reveal
   projects with `geoEqualEarth().rotate([-centreLongitude, 0])`, centred on
   that span. d3 clips the seam itself, so countries, graticule and outline
   stay right, and the flat `boxAround`, `nearestVertex` and framing work
   unchanged. The usual Greenwich-centred map stays in every other case,
   placing included.
   - This needs a cache entry per rotation in `mapGeometryOf`. It re-projects
     the 1:50m data once per reveal, an estimated tens of ms. **Measure it on
     a throttled CPU.** If it hurts, project the rotated geometry once when the
     round opens, while the pins are still being placed.
   - Rejected: **cutting the line at the edges**. It still reads as two strokes
     flying off the map, and the framing would still span the whole world.
   - Rejected: **a second world copy (unwrap ±360°)**. d3 wraps longitudes
     before projecting, and Equal Earth's curved edges leave gaps at high
     latitude.
   - Rejected: **a 3D globe (`geoOrthographic`)**. Panning becomes rotation,
     which re-projects every path on every frame on a phone. `MapView` and
     `use-map-gestures` are flat scale-and-translate. A table spread over more
     than a hemisphere cannot be framed on one face.
3. **Draw the line as the great circle, ending where the server measured.**
   - Draw `geoPath(projection)` of a `LineString` from the pin to the border
     point. It curves and splits at the edge on its own.
   - End it on the true spherical nearest point, not the flat nearest vertex:
     extend `angleToArc` (`core/atlas/distance.ts:56-80`) to return the foot
     point, and expose geographic rings from `countryOutlineOf`.
   - Today the line can end on a different border point from the one the
     server scored, even away from the date line.
4. **Tests**: a `[distance]` date-line case in `distance.test.ts` (Fiji and
   Samoa, or 179°E against 179°W); `map-view` framing at 16:9 and 9:16 (a
   European cluster gives a Europe-sized view; one far pin widens it); the
   rotation choice as a pure helper (the shortest longitude span crossing ±180°
   says rotate, otherwise not), each broken once on purpose.

## Verify

Muted browser (`docs/browser-driving.md`: `melee:volume` = `'0'` by init
script before the first navigation).

- A European target with pins all in Europe: Europe fills the frame.
- The same with one pin in South America: zoomed out just enough.
- A Pacific target (Samoa, Tonga or Fiji) with a pin in New Zealand or eastern
  Russia: the map is turned, and a short curved line crosses where the seam
  used to be.

Check each at phone 9:16 on the player, the console, and the wall at 16:9.
Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
`-- <paths>`, push.

`impeccable` first if anything visual beyond the framing and the line moves:
labels, a seam, a legend.
