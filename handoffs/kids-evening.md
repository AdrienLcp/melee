# Handoff — a ready-made evening for a child beside adults, Atlas decoys spread out

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 1. Content and server
dealing; the home row's new lid goes through the `impeccable` skill._

## 1. « Partie enfant »

Adrien: « j'aimerais qu'on crée une partie "enfant", environ 10 ans ou moins.
[…] Avec des questions et musiques plus adaptées, plus simples. Il faut voir
quel jeu on peut mettre, dans quel mode. Écrire de nouvelles questions ou
thèmes si besoin. Ma nièce aimerait pouvoir jouer avec nous, essaie de trouver
un équilibre. »

**The balance, decided:** one table, a ten-year-old beside adults, everyone
having fun — not a children's game. So: games where reflexes, taste and
guessing matter as much as knowledge, the knowledge games at `easy`, and
**speed not paid** (`paysForSpeed: false`, the setting written for exactly
this — `packages/protocol/src/room.ts:383-392`), choice mode where a game
offers it (reading four answers beats spelling one), no host-judged game.
20 rounds.

Where things are (`packages/core/src/room/ready-made-line-ups.ts`): ids at
`:44-51`, the list at `:376-433`, helpers `quizOn`, `blindtestOn`, `atlasOn`,
`fiveCluesIn`. Adding one also touches the dictionaries
(`readyMade.lineUps.<id>.name/.caption`, en/fr/pt), `party-motif.tsx`,
`party-lid.sass` + a `--party-<id>` token in both palettes and
`tokens-contrast.test.ts`, `ready-made-line-ups.test.ts`,
`line-up-entry-names.test.ts`.

**The line-up type has to carry room settings.** `ReadyMadeLineUp` /
`SavedEvening` hold no `paysForSpeed` (nor `isFamilyFriendly`): widen them and
apply them where a ready-made is loaded (`use-restore-stored-setup.ts`,
`use-create-room.ts`), filed like the rest of the host's setup.

**Games, starting point — measure each against the banks before keeping it:**

- Kept as they are, at `easy`: Reflex, Lumières, Shades, Inner clock,
  Timeline (`knownToChildren`, `timeline-bank.ts:31-36`), Petit Bac (easy
  categories: animal, cartoon character, colour, toy —
  `category-draw.ts:18-48`), Plus ou moins at `easy`
  (`quantity-bank.ts:289-337`), Black square at `easy` (authored themes only),
  Pense comme la table (read its bank for anything a child would not know).
- Quiz in choice mode on `isWellKnown` rows, and the emoji rebus at its easy
  tier (films like _Le Roi lion_ are there), flags at easy with
  `easyDecoys`. Check the general bank's `easy` rows really are a ten-year-old's
  — the Vikidia-sourced rows (`apps/server/scripts/vikidia-source.ts`) are the
  natural pool. **Write a kids rubric if `easy` is not simple enough**: animals,
  cartoons, the body, everyday science, in three languages.
- Five clues on animal, character and film at the easy tier.
- **Blind test: there is no children's source** (`deezer-client.ts`). Add one:
  Disney and animated film songs, French children's classics, the hits a
  ten-year-old hears — through a `playlist` or a new strand, verified against
  the live Deezer API (popularity, previews present). In French and Portuguese
  rooms, the dubbed versions.
- Left out: Most likely (lines about the people at the table — check the bank;
  keep it out unless every line suits a child), Mot mystère / Mot le plus long /
  Le compte est bon (spelling and arithmetic speed against adults), Atlas
  cities.

Name and caption in three languages, a child-facing name (« En famille » /
« Avec les enfants » — pick one and say why).

## 2. Atlas: four city choices all in the same corner

Adrien: « Souvent, quand on cherche une ville et qu'on a 4 propositions, les 4
propositions sont toutes dans le coin montré sur la carte. Ce serait bien
d'avoir des villes aléatoires ou un peu plus éloignées, là c'est compliqué. Il
faut zoomer et tout, et même comme ça c'est dur. »

`nearbyDecoys` (`packages/core/src/atlas/place-naming.ts:25-44`, called from
`apps/server/src/infrastructure/questions/map-naming.ts:117-122`) picks 3 of
the 8 nearest cities (40 at `easy`). The map is not zoomed on country cities
(`world-map.tsx:192-208` fits the whole country), so neighbours sit under one
dot. **Decided:** decoys are spread — each at least a set share of the
country's span from the answer **and from each other** (start at 15% of the
diagonal at `mixed`, 25% at `easy`, 8% at `hard`, tune on France and
Portugal), drawn at random among those. Keep the world capitals and countries
as they are unless the same complaint applies (check). Rewrite the tests at
`place-naming.test.ts:24, 44` to the new rule; add one for `namingOf`.

## Verify

Core tests for the line-up and the decoy spread, broken once each. Muted
browser: open the new evening from the home row and play three rounds of each
of its games at phone width; a French-cities Atlas round in choice mode shows
four cities far apart. Film the new lid. CHANGELOG entries.
