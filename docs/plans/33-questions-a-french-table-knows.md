# Stage 33 — questions a French table knows

Played at a French table, *Rester grand public* still dealt Tallahassee,
Russell Westbrook's second NBA team and the creator of *Bored to Death*. Two
of the four French sources are not French: Mintaka is written in English by
American crowdworkers and translated, PolyFact is generated from Wikidata
relations. Their well-known flag is French Wikipedia traffic, and an American
subject clears that bar as easily as a French one.

## What was measured

A seeded sample of the French bank — 200 Mintaka rows, 200 PolyFact rows, and
80 each from OpenQuizzDB and Vikidia as a control — read row by row and labelled
French culture, known everywhere, anglophone only, or obscure for anyone:

| Source | French | everywhere | anglophone | obscure | broken |
|---|---|---|---|---|---|
| Mintaka | 4 % | 62 % | 22 % | 13 % | 7 % |
| PolyFact | 9 % | 17 % | 22 % | 54 % | 4 % |
| OpenQuizzDB | 53 % | 39 % | 1 % | 8 % | 8 % |
| Vikidia | 28 % | 23 % | 3 % | 48 % | 25 % |

- **Mintaka's sport is American**: fourteen of eighteen sampled rows.
  Elsewhere Mintaka is one in five — minor presidents, state capitals.
- **PolyFact's trouble is obscurity more than America**, and its well-known
  rows were no better: 31 of 56 anglophone or obscure.
- **Traffic does not sort them.** Raising Mintaka's answer bar to ten thousand
  views drops 30 of 123 rows known everywhere and keeps 25 of 44 anglophone
  ones; 411 Mintaka answers have no measured traffic at all. The signal that
  works is the source and the subject.

## What was built

Option one of three, chosen by Adrien: no row is dropped, the flag moves.

- **No PolyFact row is well-known** (`IS_WELL_KNOWN` in `polyfact-source.ts`).
- **No Mintaka sport row is well-known** (`AMERICAN_SUBJECTS` in
  `mintaka-source.ts`).

732 rows lose the flag, and nothing else in the bank changes. Well-known French
rows per subject, before → after: arts 679 → 479, cinema 999 → 879, everyday
431 → 340, science 342 → 340, sport 364 → 126, video games 456 → 375;
geography 654, history 570 and quotes 349 are untouched. 4 844 → 4 112 in all,
every subject far above the evening floor of forty.

## Done after, in a second session

Both items this stage left open, by reading every row rather than sampling.

- **Vikidia's broken quarter.** All 922 French rows read: 70 dropped, 149
  repaired in `question-repairs.json`, 41 added to
  `choice-only-questions.json`. The bank goes to 12 388 rows.
- **The census of the rest of Mintaka.** All 1 824 well-known French rows
  outside sport read: 512 lose the flag through a new census,
  `not-well-known-questions.json` (same shape as the choice-only list, read in
  `build-question-bank.ts`), 100 are dropped, 205 repaired, 30 made
  choice-only. Rows that repairs made identical collapse to one under the
  reissue guard, and the twins that resurfaced were read too. The bank goes to
  12 282 rows; well-known French rows 4 112 → 3 440, cinema 672, geography 490,
  history 422, video games 254.

## The English half, 15 October 2026

The same reading for the English bank, whose flag was Open Trivia DB's difficulty: all 3 883 well-known English rows read, 1 922 demoted through `not-well-known-questions.json`. The bar is a general adult audience, except cinema and video games, which are judged by a casual viewer or player — a first pass by the non-gamer bar left video games 33 well-known rows, which is not what a table ticking that chip asks for. 46 broken rows dropped or repaired; a repair can now set `accepted`. English sport is the thinnest at 52 well-known rows, above the floor of 40.

## Done when

- `pnpm validate` is green, the bank differs from the previous one only in
  `isWellKnown`, on PolyFact rows and Mintaka sport rows.
