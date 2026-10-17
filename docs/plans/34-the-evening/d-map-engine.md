# d — World map: engine and judging

**Goal.** The seventh game, `worldmap`, judged on the server: a player sends a
point on the map, the server says how far it is from the answer. This step is
everything but the touch interaction ([e](e-map-marker.md)).

## What moves from Gamenight (`apps/web/src/features/world-map/`)

| Gamenight file | Lands in | Change |
|---|---|---|
| `world-projection.ts` | `packages/core/src/map/` | Unchanged: Equal Earth, fitted to the frame |
| `atlas-country-codes.ts`, `country-codes.ts` | `packages/core/src/map/` | Unchanged: atlas id → ISO alpha-3, the four id-less shapes folded |
| `world-atlas.ts` | app `features/worldmap/` and server bank | The TopoJSON is read twice: drawn in the app, measured on the server |
| `country-hit-test.ts` + test | app `features/worldmap/` | Kept for display only — *which country is under the marker* — with the tolerance divided by the zoom (Gamenight's step 4) |
| `country-marks.ts` + test | app `features/worldmap/` | The ring around a small country becomes the reveal's |
| `country-names.ts`, `country-names-fr.ts` | `presentation/i18n/` | Names under `worldmap.country.*`, with the article form the prompt needs; English owed (decision 7) |
| `world-map-questions.ts`, `question-kinds.ts` | `apps/server/src/infrastructure/questions/` | The bank leaves the browser: no phone ever downloads the answers |

`d3-geo`, `topojson-client` and `world-atlas` get rows in
`abstraction-boundaries.md`: one module each side.

## The judging changes nature

Gamenight judges a tap in projected map units (inside a country, or the
nearest within 24 px). A movable marker and *à 480 km* need geography:

- **Answer** — `player.answer { kind: 'point', longitude, latitude }`, inverted
  from the screen by the projection on the device. A point, not a country id:
  the server decides what it hit.
- **Distance** — `core/map/distance.ts`: great-circle km to a city's point; to a
  country, **0 inside** (`geoContains`) and otherwise the distance to its
  nearest border segment. Tested on known pairs (Paris–Rennes, a point in the
  sea off Brittany to France, a point inside Lesotho to South Africa).
- **Points** — distance tiers as data, `core/map/distance-tiers.ts`, working
  values in decision 6. In a simultaneous round the speed bonus still applies
  on top, capped by the tier as everywhere else.
- The kind *name the marked country* is a quiz shape (choice or typed) over the
  map rather than a marker; it stays in the bank with its own arm.

## Protocol

- `gameKinds` gains `worldmap`; `shelvedGames` only at the end of step e, as
  every game has done.
- `settings.game` arm: `{ kind: 'worldmap', questionKinds, roundDurationMs }`.
- `round.content` arm: the prompt and the kind; the **host and reveal views**
  alone carry the target. The reveal carries each answer's point, distance and
  tier so every screen can draw markers and lines.
- `PROTOCOL_VERSION` bump.

## Bank

Gamenight holds about forty questions; a December evening needs teams ×
sets of map questions plus spares, and per-room no-repeat. Grow it to 150
countries in French and English (decision 6).

## Done when

A socket suite plays a map round from two seats sending points: one inside the
country (0 km, top tier), one in the sea (its km, a lower tier); the player
view carries no target until the reveal, broken once on purpose. Distance
tests in core.
