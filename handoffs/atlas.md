# Atlas

Everything Adrien reported about Atlas. One session; strike each item as it
lands and delete this file once none is left. UI: `impeccable` first. Verify
muted, France and world, both answer modes, at phone and desk widths.

## 1. Name the place shown on the map

### What Adrien asked

> It feels like "naming" a country in Atlas is about its flag? What I wanted:
> a country stands out on the world map (or a city on the map of France,
> depending on the mode), and everyone writes what it is in a field — or picks
> among four, depending on the answer mode.

### To do

1. Find out what Atlas's "name it" direction does today on the host stage, the
   wall and a player's screen — in the code (`docs/game-catalogue.md`, the Atlas
   plan in `docs/plans/`, `presentation/components/lazy-world-map.tsx`) and in
   a browser. Nothing was checked yet.
2. Make it match: the place highlighted on the map (country on the world map,
   city on the France map), answered `typed` or `choice` (four candidates),
   judged by the server, the answer never sent to a player before the reveal.
   Reuse the quiz's typed/choice matching and the country names in
   `packages/core/src/countries/`.
3. If it already works that way, find what misled him (a flag rubric in the
   quiz, a label) and fix the wording.


## 2. The reveal's framing and its results list

### What Adrien asked

> On the result of "place a city in France", when everyone is fairly close to
> the target it zooms in too far: keep the whole of France visible and draw the
> pawns with their distance smaller, or find a middle ground — a better UI.
> I have never seen it for a country of the world, but it may have the same
> problem.

> There is also a UI problem in the list of players and their results in the
> result block of "place a city in France": it cut off from the second player.

### To do

- The reveal's map frame must never zoom so far that the region loses its
  context: the whole of France stays visible on the France map; pick a
  sensible minimum frame for the world map too (no tighter than roughly a
  continent). Pawns and distance labels scale so a tight cluster stays legible
  — smaller labels, collision handling, or a compromise you choose.
- The results list beside the reveal clips after the first player: find where
  (host stage, wall, player screen — check all three) and fix the layout.
- The answer's fill was re-inked in `e578d1c` (`--map-target`, warm oxblood);
  keep it.

