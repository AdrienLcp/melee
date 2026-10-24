# 48 — Capitals

**To do.** Asked 24/10/2026. Capitals across three games at once: guess nine
themes on capitals, a capitals chip in the quiz, and world capitals to place on
the map. One bank feeds all three, and each step ships on its own.

## Step 1 — one bank, three readers (one session)

`apps/server/src/infrastructure/questions/capital-bank.json`, read through
`capital-bank.ts`, written by `scripts/build-capital-bank.ts`
(`pnpm --filter @melee/server capitals:build`). One row per country code:

- `capital`: its Wikidata id, `names { en, fr }`, `aliases { en, fr }` from
  `wikidata-aliases.ts`, its `point`, and `isWellKnown`
- `seats`: other capitals a table may give and be right (Bolivia's La Paz
  beside Sucre, South Africa's Cape Town and Bloemfontein beside Pretoria)
- `largestCities`: up to five cities of the same country that are not a
  capital or a seat, most populous first, with names, aliases, Wikidata id
  and sitelinks
- `subregion`: the UN M49 code, from the UN's own M49 table, read at build time

Decisions:

- **On the server, not in `packages/core`.** It holds no rule, and the map's
  points are answers: a bundle carrying every capital's coordinates is the
  answer key shipped to every player. Country names stay in
  `core/countries/`, because the app prints those; a capital's name reaches a
  screen in the frame that asks it.
- **This is the second-case test passed, not a shape invented early**: the
  quiz reads names, aliases and `largestCities`; the map reads names and
  points; the guess nine build reads ids, `largestCities` and `subregion`. No
  type is shared beyond the row itself.
- **Sovereign states only**: the atlas codes the build finds as a current
  state on Wikidata (`Q6256`/`Q3624078`, no `P576`). A territory has a seat,
  not a capital, and a question about Nuuk can come later as one line.
- **`P36` with no `P582`**, then `CAPITAL_OVERRIDES` written by hand in the
  build, because Wikidata holds several capitals for some states and a past
  one for others. Each override is read: Bolivia (Sucre, seat La Paz), South
  Africa (Pretoria), Netherlands (Amsterdam), Malaysia (Kuala Lumpur, seat
  Putrajaya), Ivory Coast (Yamoussoukro; Abidjan stays a city, it is the
  mistake the question tests).
- **Left out where a reference work would argue**: Israel and Palestine. A
  party game does not referee Jerusalem. Further cases go in the same list
  with one line saying why.
- **`isWellKnown` from the capital's article traffic**, the measure the quiz
  already uses, rather than from the flags' hand-picked list: a well-known flag
  is not a well-known capital.

Tests (`capital-bank.test.ts`, and the atlas test beside the city bank's):
every capital stands inside its country's atlas shape within the city bank's
coastal slack; no `largestCities` entry is a capital or a seat; every row has
names in both languages; no two rows share a capital. Break the atlas test
once with a swapped latitude and longitude. Nothing changes on screen, so
there is no browser pass.

— cut here: bank committed, `pnpm validate` green —

## Step 2 — a capitals chip in the quiz (one session)

The flags road ([37](37-flags.md)): a **rubric, not a game**. `capitals` joins
`questionCategories`, and `capital-questions.ts` deals the rows from the bank
on the first draw, appended by `bankedQuestions()` so every corpus sweep
already covers them. `PROTOCOL_VERSION` goes up: a player tab parses
`category` as an enum.

- **Prompt per language**: *What is the capital of Australia?* / *Quelle est
  la capitale de l’Australie ?*, built from `withArticle` through a small
  helper that contracts *de le* to *du* and *de les* to *des* (*du Brésil*,
  *des États-Unis*), tested on all three forms.
- **Decoys from the country's own cities first** — Sydney, Melbourne,
  Brisbane for Canberra — keeping only cities with enough sitelinks to be a
  name a table has heard; any slot left is filled by the capitals of the
  nearest countries, the flags' fill rule. A seat is never a decoy.
- **Accepted**: the capital's aliases and every seat. A former capital stays a
  fair decoy (Rio de Janeiro for Brazil).
- **City-states out** (Singapore, Monaco, Vatican): the question names its
  answer. A capital that merely shares its country's root (Luxembourg,
  Djibouti, Tunis) stays: an easy question, not a broken one. Test: typing the
  country's own name (*Tunisie* for *Tunis*) is never forgiven into the
  capital.
- **`choiceOnly: false`** everywhere: a capital is an answer a table produces
  from nothing.
- **The chip, the twelfth.** Ten tiled five by two and the rebus made eleven;
  how twelve tile on the console and at 390 is a layout question, so it opens
  with the `impeccable` skill before any CSS.

Seen muted (`melee:volume` = `'0'` before the first navigation, see
[`browser-driving.md`](../browser-driving.md)): a capitals round alone in
choice mode at 1280×800 and typed at 390×844, both languages, the reveal on
console and phone.

— cut here: the chip in the quiz setup, `pnpm validate` green —

## Step 3 — world capitals on the map (one session)

A third value of `settings.game.places`: `worldCapitals`, on the world
projection the country rounds already draw.

- **Which capitals**: those of `BANKED_COUNTRIES`, the list already chosen as
  large and known enough to have a chance at, so the map's sense of fair is
  not decided twice. A micro-state's capital would be a fine point — a point is
  never a pixel the way an outline is — but the countries were left out for
  being unknown too, and that holds.
- **A target kind of its own**, `capital`: `names { en, fr }`, because London
  is *Londres* and every screen reads its own locale, where a French city's
  one `name` serves both; `point` and `countryCode` both `null` until the
  reveal. The prompt names the capital alone: naming its country would turn
  *place Canberra* into *place the capital of Australia*, a quiz question the
  map does not need to ask. The reveal dots and rings it as a city, and names
  the country.
- **Tiers 3/2/1 under 100, 300 and 1 000 km.** The French cities' 25/75/150
  sit on a map of France at the same screen size, roughly a fortieth of the
  world's width, but the map zooms to 24×, so a player who knows the city
  can land on it. 100 km is the right spot inside the right country; 300 km
  is the right region — Sydney for Canberra (250 km) pays 2, and Zurich for
  Bern (95 km) pays 3, which is a confusion the tiers cannot separate and do
  not try to; 1 000 km keeps a pawn in the right part of the world paid —
  Toronto for Ottawa (350 km), Lagos for Abuja (530 km) and São Paulo for
  Brasília (870 km) each pay 1. Mistaking a capital for the big city always
  costs at least one tier, which is the round's point. Data in
  `DISTANCE_TIERS.capital`, tested at each edge.
- No-repeat ids `worldmap:capital:<code>`, beside the countries' and the
  cities'. The settings panel's *À placer* gains *Capitales du monde* /
  *World capitals*, and the closed setup names it.
- `docs/realtime-protocol.md` and the CHANGELOG follow; `PROTOCOL_VERSION`
  goes up.

Test: a player's whole transcript holds neither the capital's point nor its
country before the reveal, seen red with the guard removed. Seen muted at
1280 and 390: a capital round in each language, then a country round after it.

— cut here: the map asks for capitals, `pnpm validate` green —

## Step 4 — guess nine on capitals (one session)

Read [45](45-guess-nine.md) first. Capitals do not go through a `P36` query:
plan 45 lost eight `countries-bordering` themes to polluted truths, and the
bank already holds a checked list. Two templates whose truths are a `VALUES`
list the build writes from the capital bank, so labels, aliases and traffic
still come through the existing pipeline:

- **`capitals-of`**: the capitals of a list of countries — a continent or an M49
  subregion from `subregion`, or a list written by hand. Candidates for the
  black word are those countries' `largestCities`, which is exactly the
  doctrine: the big city everyone takes for the capital.
- **`countries-listed`**: countries written by hand, candidates likewise.

Rules kept from 45: nine most-read are the board, a true answer outside them
costs nothing, a line matching nothing is silent. Europe's forty-odd capitals
are therefore a fair theme, and so is every continent. Europe is M49's
(Russia in, Turkey and Cyprus out); a table that names Ankara loses nothing.

Themes, each black word read by hand:

| Theme | Black word | Why it bites |
|---|---|---|
| Capitals of Europe | Zurich | Switzerland's largest city; Bern is the capital |
| Capitals of South America | Rio de Janeiro | Capital until 1960 |
| Capitals of Africa | Lagos | Nigeria's largest city; Abuja since 1991 |
| Capitals of Asia | Istanbul | Turkey's largest city; Ankara is the capital |
| Capitals of Oceania | Sydney | Australia's largest city; Canberra is the capital |
| Capitals of North and Central America | Toronto | Canada's largest city; Ottawa |
| Capitals of Western Europe | Geneva | Bern again, and Geneva hosts the UN |
| Capitals of Northern Europe | Gothenburg | Sweden's second city |
| Capitals of Southern Europe | Milan | Italy's business capital |
| Capitals of Eastern Europe | Saint Petersburg | Russia's capital until 1918 |
| Capitals of South-eastern Asia | Yangon | Myanmar's capital until 2006 |
| Capitals of the countries bordering France | Geneva | On the border; Switzerland's capital is Bern |
| Countries whose capital is not their largest city | Italy | Rome is its largest city too; Milan is only its richest |

- **Bolivia**: Sucre's cell accepts *La Paz* through `SPOKEN_ALIASES`, which
  already takes a hand-written name per entity.
- **Bordering France counts overseas**: Brazil and Suriname by French Guiana,
  the Netherlands by Saint-Martin, so eleven true capitals and Andorra la
  Vella or Paramaribo fall outside the nine.
- **Capital-not-largest is a hand list**, not a population query: Delhi or
  Mumbai, Beijing or Shanghai is a fight over city limits no rule settles, so
  those stay off the list. Switzerland, Turkey, Australia, Canada, Brazil,
  Nigeria, Morocco, the United States, New Zealand, Vietnam, Pakistan,
  Kazakhstan, Tanzania, Ecuador — the nine most read are the board.
- A subregion under nine states (Central America, Northern America) is not a
  theme; the build already refuses it.

Test: the bank test's existing sweep (nine answers, one black word matching
none) covers the new themes; add one that *La Paz* banks Sucre's cell. Seen
muted: a typed *Capitals of South America* round at 1280 and 390, *La Paz*
banking Bolivia and *Rio* voiding the sheet.

— cut here: themes banked, `pnpm validate` green —
