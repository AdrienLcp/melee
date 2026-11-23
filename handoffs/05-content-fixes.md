# Content: wrong-kind decoys, the two Congos, flags

Read `README.md` first. Diagnosed read-only on 23/11/2026, lines from
`7ded3593`.

## 1. Generated decoys of the wrong kind

Adrien: "a question 'which US president is the tallest' offered only one US
president, the others from Russia or elsewhere, so the answer was obvious."

**Cause (confirmed)**: `question-bank.json:91573`, id `mintaka-f59ffaa0`:
Lincoln beside Karl Marx, Lenin and Catherine II. Mintaka ships no wrong
answers; the build generates them — `poolFor`
(`apps/server/scripts/mintaka-source.ts:474`) takes the answer's widest
Wikidata occupation (politician) and `decoysFor` (`:333`) picks three of that
kind close in notability and era. Nothing checks the constraint the prompt
names (nationality, office, team, sex).

**Spread**: 1 918 fr Mintaka rows + 551 `pt-mintaka-*` translations (same
decoys). 93 fr prompts say "président", most mixing foreign leaders (Biden
beside Xi and Saddam Hussein); also Simone Biles beside Michael Jordan,
"American actor" with Irish and British actors, Reagan beside Eminem. The other sources
(OpenQuizzDB, Open Trivia DB, PolyFact, Vikidia) carry human-written decoys.

**Do**: at build, fetch the answer's and decoys' Wikidata P27 (citizenship),
P39 (position held), P21 (sex), P54 (team), and refill a decoy from a pool
narrowed to the property the prompt names; drop the row if three can't be
found. Rebuild the fr and pt banks. Then a suite check beside
`packages/core/src/quiz/decoy-checks.ts` (or a build audit) so it can't come
back. Report how many rows changed and how many were dropped.

## 2. « Congo » beside « République démocratique du Congo »

Adrien: "in Five clues we had Congo and DR Congo as choices — isn't that the
same country? Fix it."

They are two countries (COG, Brazzaville; COD, Kinshasa) — no duplicate. But
the short French and Portuguese name for COG reads as the same place.
**Decided**: COG becomes « République du Congo » (`withArticle`
« la République du Congo ») in `packages/core/src/countries/country-names-fr.ts:58`
and its Portuguese equivalent (with its article) in
`country-names-pt.ts:60-64`; English already says Republic of the Congo.
« Congo » / « Congo-Brazzaville » stay accepted answers
(`apps/server/src/infrastructure/questions/country-answers.ts:42,57`). The
names are shared by Atlas, flags, capitals, silhouettes and Five clues; the
`atlas.country.COG.name` dictionary entries follow. Rebuild what bakes names.

## 3. Flags feel always hard

Adrien: "flag rounds are hard — are you sure all the world's flags are there?
We always land on something hard. I'd like any flag at random."

**The draw is already near-uniform** (confirmed): `flag-bank.json` holds 229
flags (194 states + 35 territories), tiers 78 / 76 / 75; Mêlée générale plays
flags on `mixed` (`ready-made-line-ups.ts:150`), and `drawByDifficulty`
(`packages/core/src/round/difficulty-draw.ts:29`) picks a tier then a flag —
practically uniform over 229. So one round in three is well known.

**What makes it feel hard**: the 35 territories (Greenland, Puerto Rico,
Hong Kong… all but one medium or hard), and the decoys: below `easy` they are
similar-looking flags then geographic neighbours (`decoysOf`,
`apps/server/scripts/build-flag-bank.ts:509`), so even France comes with
similar flags; the gentler `easyDecoys` serve only `easy`
(`question-bank.ts:178`).

**Decided**: the flags rubric deals **states only** (territories leave the
flags pool; check Atlas and silhouettes keep whatever they use), and on
`mixed` an easy-tier flag gets `easyDecoys` — the decoys follow the flag's
own tier. Any of the 194 is then drawn at random, as Adrien asks, and a known
flag plays as one. Test the draw and the decoy choice in core.

## Done when

Banks rebuilt, the check in the suite, the president question dealt with four
US presidents (or gone); COG named apart in fr and pt on every game that
names it, seen in a browser; flags dealt from 194 states. Changelog, delete
this file and its README row.
