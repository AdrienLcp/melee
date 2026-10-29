# 58 — Estimate (le juste chiffre)

**To do.**

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
cache): one row `{ id, family, entity, labels: { en, fr }, value, isWellKnown }`.

Families, each a SPARQL query and a sentence per language held in the bank
script:

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

## How to tell it is done

- A room opened on *Le juste chiffre* deals a question with its unit, takes a
  number from every seat, and reveals the value with every seat's guess
  nearest first, paid 3, 2, 1.
- No frame to a player carries the value before the reveal.
- A guess eleven times too high is paid nothing even in a room of two.
- `pnpm validate` green.
