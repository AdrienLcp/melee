# 58 — Estimate (le juste chiffre)

**Step 1 done** 29/10/2026 — the bank, the protocol and the core. **Step 2a
done** 29/10/2026 — the kind served end to end; the screens are next.

A question whose answer is a number goes up on every screen — *how many people
live in Japan? how high is Mont Blanc? how long is the Loire?* — every seat
types its estimate, and the reveal lines every seat up against the true value,
nearest first.

The fifteenth game, **everyone at once** in the catalogue's shapes, swatch's
family: one answer per seat, sent once, measured by the server. Nobody needs to
know the answer for it to be fun, which is the point.

Kind `estimate`, translation prefix `estimate.*`, answer mode `number`.
*Le juste chiffre* in French, *Close enough* in English.

## Rules, as settled

- **The gap is a ratio, not a difference**: `|ln(guess / truth)|`. Saying 100
  million for Japan's 124 is as good as saying 10 000 for a 12 400 town, and a
  difference would make every population question a question about the zeros.
  A guess of zero or below is refused by the schema.
- **Paid by place, not by an absolute curve** (`placesFromBest`, 3, 2, 1, ties
  sharing): a room where nobody knows still has a closest seat, and the
  closest is who the table cheers. **Beyond a factor of ten, nothing** — an
  answer that far is a guess at the zeros, and in a room of three it would
  otherwise take a podium place.
- **Spot on** — within 2 % — is what `isFullyBanked` reads, and the reveal
  says so.
- **No speed bonus.** An estimate is not a reflex; rushing one is guessing.
  `isPaidForSpeed` answers `false` for the verdict, like swatch's.
- **One shot per seat.** `roundDurationMs` 15–60 s, **30 s by default**; the
  round closes early once every seat it opened on has sent.
- **The question travels, the value does not.** The player arm carries the
  question's label and its unit; the value and the source arrive with the
  reveal. Rule one, encoded through the player schema as everywhere else.
- **The unit is the question's**, shown beside the field (*habitants*, *m*,
  *km*, *km²*), so nobody loses a round to metres against kilometres. The
  field is react-aria's `NumberField` with the locale's grouping, because
  124 000 000 must be readable while it is typed.

## The bank

`apps/server/src/infrastructure/questions/quantity-bank.json`, built by
`apps/server/scripts/build-quantity-bank.ts` (`quantities:build`) on the
capital bank's pattern (`wikimedia-client.ts`, the `question-source.ts`
cache, `wikidata-names.ts` now shared with the capitals): one row
`{ entity, family, isWellKnown, names: { en, fr }, value }`, unique per
family and entity — a country's population and its area are two rows of one
entity.

Families, each a SPARQL query in the bank script. **The sentence is the
dictionary's, not the bank's** (changed from the plan): French puts an article
before most country names and Wikidata's label carries none, so the question
travels as `{ family, names }` and each dictionary words it with the name after
a colon. The unit is `UNIT_OF_FAMILY` in `@melee/protocol/estimate`, derived
rather than sent.

| Family | Property | Entities |
|---|---|---|
| `population.country` | P1082 | sovereign states |
| `population.city` | P1082 | cities over 500 000, plus every French city over 100 000 |
| `area.country` | P2046 | sovereign states |
| `elevation.mountain` | P2044 | summits with a French and an English article |
| `length.river` | P2043 | rivers with a French and an English article |
| `height.building` | P2048 | towers and skyscrapers with both articles |

`isWellKnown` from French Wikipedia traffic, as the capital bank reads it. A
value is rounded to three significant figures in the bank — Wikidata's
population of Japan is a census figure no table should be paid on to the unit.
The rows are **shared with stage 59**, which pairs them.

**As built**: 4 578 rows, 980 well known — countries 195 each (all well
known), cities 955 (369), mountains 1 072 (87), rivers 1 876 (100), towers
288 (36). Every entity needs an English and a French article and 20 sitelinks.
The query runs with `hint:Query hint:optimizer "None"`: planned by the service
it walked every English article first and timed out. Values are read
normalised to SI (`psn:`), so a summit filed in feet lands in metres. China
is renamed from its official label; the Jeddah Tower and the second World
Trade Center are refused as unbuilt (`P5817`).

**The verdict carries the place**, not only the ratio: `numberVerdictSchema`
is `{ ratio, placesFromBest }`, `placesFromBest` counting the seats strictly
closer (two tied firsts, then a third) and `null` beyond a factor of ten —
pay by place needs the whole room, so the server settles every seat at once
with `estimateVerdictsOf` in `@melee/core/estimate/estimate-pay`.

## Steps

1. **Bank, protocol, core.** The build script and its JSON; `estimate.ts` in
   protocol (the question shape, the unit enum, `numberVerdictSchema` with
   `ratio`), `@melee/core/estimate/` (`gapOf`, the factor-ten floor, the
   place pay, `isSpotOn`), each tested and broken once.
2. **The kind, end to end, then the screens.** Adding `estimate` to
   `gameKinds` breaks every exhaustive table at once, so it lands served: the
   tables listed in stage 56's *where it lands*, `estimate-round.ts`, the
   draw in `round-conductor.ts`, the socket suite (a value leaked on no frame
   before the reveal, a second answer refused, a zero refused). Then the
   shelf, the spine, the dictionaries, the `NumberField`, the reveal as a
   number line with every seat's pin on a log scale. Seen muted on a wall, a
   seated console and two phones.

**Step 2a, as built**: the answer arm is `{ kind: 'number', guess }`; the
player's round carries `question`, `value`, `revealedGuesses` and `yourGuess`,
the last three `null` until the reveal (the reader's own guess excepted); the
console's `currentContent` is `{ kind: 'estimate', value }`, the value `null`
while it holds a seat. The draw is `drawQuantity` in `quantity-bank.ts`: a
well-known row the room has not played first, any unplayed row next, `null`
once the bank is spent. The pay is `payEstimatesByPlace` in
`estimate-round.ts`, a `closeRound` branch of its own like most likely's. Not
on `shelvedGames` yet — it goes on with its screens.

## How to tell it is done

- A room opened on *Le juste chiffre* deals a question with its unit, takes a
  number from every seat, and reveals the value with every seat's guess
  nearest first, paid 3, 2, 1.
- No frame to a player carries the value before the reveal.
- A guess eleven times too high is paid nothing even in a room of two.
- `pnpm validate` green.
