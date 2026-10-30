# 52 — Black square's answer count, and the map's second direction

**Done 26/10/2026.** Asked the same day. Two games grow out of a fixed shape: guess nine
stops dealing exactly nine, and the world map gains the reverse of every
question it asks — *name what is shown* beside *place what is named*.

Done the same day, before this plan: guess nine renamed **Case noire** /
**Black square** on screen (its French name, *Devineuf*, is an existing
commercial app's, for the same kind of game). The wire id, the translation
prefix and the URL slug were still `guessnine` until step 3.

## Step 1 — Black square: the host picks how many answers (one session)

**Done 26/10/2026.** As settled below, with three changes met on the way:

- **The count travels on the sheet**: `CellsVerdict.cellCount`, because
  `isFullyBanked` and `pointsForCells` take a verdict and nothing else —
  `emptySheet(N)` replaces `EMPTY_SHEET`. `PROTOCOL_VERSION` 59 → 60.
- **Tiers are `floor(cell × 3 / N) + 1`**, which gives the spare cells of an
  uneven N to the cheap end: 4 → 1, 1, 2, 3; 5 → 1, 1, 2, 2, 3; 7 → 3, 2, 2.
- **One tier a row**, which is what the 3 × 3 already said: six tracks, a cell
  spans two, a short row centres (`helpers/guess-nine-cell-place.ts`,
  `styles/_tier-rows.sass`). Five is a 2/2/1 pyramid, three a column of one
  per tier. Browser-checked at 3, 5, 9 and the compact strip, on the seat,
  the gauge and the reveal; the keeper's list shares the mixin and was not
  driven. `guessnine.found` takes the total rather than dropping it — the
  gauge's count reads *2 sur 5*.

**Settled:**

- **`answerCount` on the game's arm, 3–9, default 9**, written with
  `.default(9)` like `doublesLoneFinds` so a stored setup still parses. The
  round deals the theme's **N most read**: the bank is already ordered by
  traffic, so `theme.answers.slice(0, N)` in `round-conductor.ts` at the deal,
  and the answers left off are the obscure ones nobody says — which keeps
  *a true answer not on the board* as rare as it can be.
- **Not above nine.** Asked *5 to 15*; the bank holds nine per theme and the
  build drops a theme that cannot field nine. Fifteen would mean rebuilding it
  with a deeper cut, and most themes would not survive (Tarantino has ten
  films). Revisit only with a rebuilt bank in hand.
- **Tiers split by thirds of N**, by rank: `ceil(N/3)` pay 1, the next third 2,
  the rest 3. `CELLS_PER_TIER` becomes a function of N in
  `packages/core/src/guessnine/sheet-pay.ts`, and so do `loneCellsOf` and
  `isSheetClosed` (closed on all N, not on nine).
- **N on the public arm** of `round.content` (`answerCount`): the player's
  sheet draws N cells before anything is revealed.

**Where nine is written** (mapped 26/10/2026): `GUESS_NINE_CELL_COUNT` in
`packages/protocol/src/guess-nine.ts` stays as the ceiling; every `.length(9)`
becomes `.min(3).max(9)` — `guess-nine.ts:41,79-81`, `room.ts:409,750`, and
the bank schema's literal `9` in `guess-nine-bank.ts:24` stays (the bank still
holds nine). `tickSpokenCell` gains an explicit `cell < answers.length` bound —
the schema's max is its only guard today. The grids are hard 3 × 3
(`guess-nine-sheet.sass:17,88`, `guess-nine-keeper.sass:30`,
`guess-nine-reveal.sass:24`) and `guess-nine-sheet.tsx:27`,
`guess-nine-gauge.tsx:15` build from the constant. The control copies Petit
Bac's `NumberField` (`petit-bac-setup.tsx:92-104`) into `settings-panel.tsx`
beside the duration, with an `itemCount`-style part in
`use-settings-summary.ts`. The copy says nine in `found`, `grid`,
`home.description`, `scoring*`, `tagline` and both heads: drop the number
rather than template it (*The answers*, *Hidden answers. One black word.*).
The grid's layout per N is an `impeccable` pass, browser-checked at 3, 5, 9.

## Step 2 — Atlas: name what the map shows (one or two sessions)

**Done 26/10/2026** — wire, server and screens, checked in a muted browser
(console 1440×900 and 1920×1080, seat 390×844 and 844×390) and held by a
`choice-fits` case per seat. As settled below, with what the build decided:

- **On the wire**: `settings.game.direction` and `places` as a set (a stored
  single kind reads as a set of one). The public arm carries `direction`,
  `choices` (`{ en, fr }` names, four in `choice`, none in `typed`), `shown`
  (`{ kind, point }`, `null` in a `place` round) and `target`, which a `name`
  round holds back as `null` until the reveal. The host arm's `answer` is the
  whole target, unseated console only. `PROTOCOL_VERSION` 60 → 61.
- **Decoys are neighbours by distance**, not by region: three drawn among the
  eight nearest of the same kind (`core/worldmap/place-naming.ts`), which works
  for towns as for countries. A country is shown by the centre of its largest
  piece that falls inside it (`pointInsideCountry`); one with none is passed
  over and spent.
- **Typed matching** is the quiz's, over both languages and *St-* / *Ste-*
  (`spellingsOf`); a pick's `said` is the French name, which a screen finds
  among the choices to say in its own language.
- **Each round draws its kind first**, among the ticked ones, then a place.
- `capabilitiesOf('worldmap').answerModes` is every mode the map may take;
  `answerModesFor(settings)` narrows by direction, and so do `offersAnswerMode`
  and `modeOfferedBy`, which now take the game's settings.

**The screens**, as built: the map sits *inside* the question card like a
quiz flag, so every existing layout holds it unchanged; a shown country is
framed on a least span of 0.08 of the world, or Jordan is lost in a
Europe-to-India view. The map of France is never framed tighter than itself,
in either direction: a city is named, and a cluster of pawns read, by where it
stands in the country. The world map's reveal is grown to a least span of 0.2
of the world — about a continent. Over a tight cluster, pawns closer than their
own width shrink towards the gap (`crowdedPawnScale`, no smaller than 0.6), and
each distance label tries points along its line, then either side of its pawn,
and is left out when none is free (`placedDistanceLabels`) — the list beside
the map prints every distance. The direction control names the map (*Nommer le
lieu allumé sur la carte*): *ce qui est montré* read as a flag. What the pass covered: the direction
control and the places as checkboxes in the setup — today a single choice
written as a set of one; the `name` round on the seat, the console and the wall
(`WorldMap` filling the country around `shown`, a dot for a town, the four
names or a field); the reveal and `said` read back in the screen's language; a
summary part and a scoring line for `name`; the scoring key for a mixed set.

The world map already places three kinds (`settings.game.places`:
`countries | frenchCities | worldCapitals`) on two maps — French cities draw
on France, whose geometry and `MapRegion` are client-side and implied by the
target kind. **What is missing is the other direction**: a country lit on the
map, or a dot on a city, and the table names it.

**Settled:**

- **Renamed *Atlas*** in both locales — it is no longer only the world. Step 3
  carries the id.
- **`places` becomes a set** (checkboxes, at least one), so a table can mix
  France and the world; a round's target kind still picks its map.
  **No locale default**: the language a screen speaks says nothing about where
  the table lives, and a French host who ticks France once has it remembered —
  `places` is on the game's side of `HostPreferences`. Default stays
  `countries`.
- **`direction: 'place' | 'name'`**, a game setting, default `place`.
  *Name* offers `typed` and `choice`; *place* stays `point` alone.
  `game-capabilities.ts`'s `POINT_ONLY` becomes a function of the settings,
  and a mode the direction does not offer is refused like any other.
- ***Name* is scored like the quiz**: right or wrong, speed bonus on top, the
  quiz's whole-line matching and forgiveness, names in both locales counting.
  Choice decoys come from the same bank and the same region (four African
  countries, four Breton towns) — a decoy across the world is a giveaway.
- **The first guarantee holds by sending a shape, never a name.** The
  country's code *is* the answer, so the player arm carries a point inside
  it and the client fills the country containing that point from its own
  atlas; a city sends its point, which is the question. The host arm keeps the
  code. `WorldMap` gains a `highlight` prop drawn while the round is open
  (today a target is drawn only under `revealed`).
- **Microstates stay out** of *name a country*: the bank already leaves them
  out, and a lit pixel is unanswerable.

**Where**: settings arm `packages/protocol/src/game.ts:181-190`, targets
`packages/protocol/src/worldmap.ts:44-66`, draw `round-conductor.ts:99-121`,
withholding `room-view.ts:414-440`, map `world-map.tsx`, region
`helpers/round-content.ts:69`. Cities are `city-bank.ts`'s 137 hand-written
rows, which carry no alternative names — *Saint-Étienne* / *St-Étienne* needs
aliases before typed mode is fair. Scoring by distance stays the *place*
direction's.

## Step 3 — the ids follow the names (short session)

**Done 26/10/2026.** Everything named after the old ids moved with them — files,
symbols, `core/blacksquare/` and `core/atlas/`, the spine tokens — and
`PROTOCOL_VERSION` went to 62. The map component keeps `world-map`: it draws a
map, not the game. One table, `core/room/renamed-game-kinds.ts`, reads the old
ids: the three stores that carry a game (setup, line-up games, saved evenings,
so an exported file too) run through `withCurrentGameKinds` before their
schema, and `useGameParam` replaces an old slug in the URL. A live room stored
by the Durable Object across the deploy is not migrated — it outlives its host
by ten minutes, and a stale tab is closed by the version bump anyway.

`guessnine` → `blacksquare`, `worldmap` → `atlas`: the `GameKind`, the
translation prefix, the URL slug (`/fr/guessnine` is what a shared link
shows). Stored host setups and saved line-ups carry the kind, so the
preferences schema reads the old id as the new one for a release rather than
dropping the setup. Redirect the old slugs.
