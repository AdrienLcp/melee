# Difficulty, part 3 — flags, capitals, silhouettes, rebus, Atlas

Wave 2, after `difficulty-01-setting.md` (rules and Adrien's words there).
Runs beside part 2: stay in `apps/server`, `packages/core` and the bank
scripts.

## The job: a real three-tier ladder in every country bank

Today only a boolean `isWellKnown` exists, and it is skewed:

- **Flags** — `apps/server/src/infrastructure/questions/flag-bank.json`, 229
  rows, 77 well known (hand-picked list in
  `apps/server/scripts/build-flag-bank.ts:365`). The other 152 include
  territories — Aruba, Anguilla, Åland — that no table knows.
- **Silhouettes** — `silhouette-bank.json`, 173 rows; its well-known flag is
  copied from the flag bank (`scripts/build-silhouette-bank.ts`).
- **Capitals** — `capital-bank.json` via `capital-bank.ts`, 194 rows, 191
  asked (`CITY_STATES` out, `capital-questions.ts:16`), **154 well known**
  (81 %, by French Wikipedia traffic) — so the old switch filtered almost
  nothing. Rows carry `largestCities[].sitelinks`, `region`, `subregion`.
- **Emoji rebus** — 114 rows, all `choiceOnly`; check what it carries.
- **Atlas** — `round-conductor.ts:120-141` draws uniformly from 157 countries
  (`questions/country-bank.ts:11`), 155 capitals (`world-capitals.ts:37`) or
  French cities (`city-bank.ts:169`); no fame data at all.

Give every row a `tier` (`easy | medium | hard`) **written into the bank by
its build script**, from a fame signal ranked and cut in thirds — French
Wikipedia traffic where the scripts already fetch it
(`scripts/frwiki-notability.ts`), Wikidata `sitelinks` otherwise — then
hand-corrected where the ranking is plainly wrong for a French table (France's
neighbours and the G20 are `easy` whatever the traffic; a territory is never
`easy`). The flag and silhouette tiers stay one list. Replace the stand-in
mapping part 1 put in the server.

## `easy` may soften the question, nothing else may

Adrien keeps look-alike decoys ("c'est ok"). In `easy` only, deal decoys from
**other continents** (capitals rows have `region`; flags and silhouettes need
one — `packages/core/src/countries/` or the capital bank's M49 codes), so a
child picks Japan's flag beside Brazil's, not beside Bangladesh's. Decoys are
fixed at build time today (`build-flag-bank.ts:496`, `build-silhouette-bank.ts:196`,
`capital-questions.ts:58`): store a second, easy decoy set rather than
computing one in the Worker. Atlas naming decoys are the 8 nearest
(`packages/core/src/atlas/place-naming.ts:12,18-35`); `easy` widens that ring.

## Capitals "always the same" — diagnose first

> Les capitales j'ai l'impression qu'on tombe toujours sur les mêmes, mais on
> devrait en avoir plus de 200 non ?

There are about 195 sovereign states; 191 asked is the whole world minus the
city-states, so the bank is not short. The feeling still needs an answer:
simulate a few hundred `drawQuestion` calls on the capitals rubric
(`question-bank.ts:171-202`) and count distinct rows; check whether a room
with the old switch on drew from a narrower pool, whether the draw is seeded,
and whether the category-then-question draw (`:197` skips the last category)
starves capitals when several rubrics are ticked. `playedContentIds` only
prevents repeats within one room's life (`new-room.ts:44`), so the famous
capitals coming back across evenings is expected; with `mixed` they will come
back a third as often. Fix whatever the simulation shows is wrong, and write
the finding down.

## Done when

Each bank has tiers by its build script, a server test deals `easy` from each
rubric and finds no row tiered `medium`/`hard`, the capitals distribution is
explained (and fixed if broken), and a muted browser round of each rubric at
Facile and Difficile looks right.
