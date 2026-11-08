# Black square, part 1 — four hidden answers drawn from a pool

<!-- cspell:ignore devineuf -->

Runs beside the difficulty series, after `difficulty-01-setting.md` (it uses
its `easy | medium | hard` tiers and its tier-aware draw) and after
`difficulty-02-picker.md` (its shell picker). Part 2 of this series writes the
themes; this part makes the bank able to hold them.

## What Adrien asked (2026-11-08)

> Les thèmes du jeu "cases noires" sont trop difficiles. A la base on devait
> s'inspirer du jeu "devineuf" qui a beaucoup de thèmes, et qui sont beaucoup
> plus faciles et larges, comme "légumes verts", "fruits exotiques", "genres
> de films" […] une liste de 10 à 20 par thème, et on en prend aléatoirement
> à trouver dedans ? Comme ça quand on retombe sur le même thème y a des
> trucs différents à trouver.

> Pour cases noires je me demande si mettre juste 4 réponses à trouver ça
> suffirait pas. On garde le principe du mot noir. […] Les réalisateurs de
> films je trouve ça plus faciles que les peintres, les gens connaissent mieux
> le cinéma, on peut en garder les plus connus. Mais il faut surtout AJOUTER
> des thèmes faciles et que les joueurs doivent proposer plein de choses
> jusqu'à tomber sur les 4 bonnes.

Today: 163 Wikidata themes ("films by Peter Weir", "Turing award winners",
"paintings by Vermeer"), each exactly the nine most-read answers
(`black-square-bank.ts:29`, `.length(9)`), so a theme dealt again is the same
grid.

## Decided

- **A theme is a pool of 12–20 true answers**; a round deals `answerCount` of
  them, the same for every screen. **`answerCount` defaults to 4** (today
  `BLACK_SQUARE_CELL_COUNT`, `game.ts:126`, `:310`); the 3–9 range stays.
- **Every answer carries a tier** `easy | medium | hard` — the difficulty
  series' vocabulary, read here as obvious / less obvious / rare.
- **The deal is stratified**, not uniform over the pool: four cells = 1 easy,
  2 medium, 1 hard, and the same proportions for any other count. A uniform
  draw over 15 often deals four obvious answers or four obscure ones. An empty
  tier falls through to the nearest.
- **The tier replaces page views in the pay** ("the less obvious pays more",
  `packages/core/src/blacksquare/sheet-pay.ts`): Wikidata themes map their
  views to a tier at build time, authored ones carry it by hand. The round
  still pays at most `MOST_A_ROUND_PAYS`.
- **A theme carries a tier too**, and that is what the room's `difficulty`
  reads: "green vegetables" is `easy`, "films by Kubrick" `medium`. Wire
  `difficulty` on the black-square arm (part 1's schema) and its picker (part
  2's component) here — `difficulty-05-other-games.md` leaves Black square to
  this series.
- **No "wrong"**: a guess not on the grid is just not on it, keep guessing. A
  pool answer that was not dealt reads like any other miss (Adrien: that is
  the game). Nothing new on the screen for it.
- **The black word stays** as it works today: one per theme, a trap that
  sounds right, with its why.
- **Matching is the shared one**: `packages/core/src/round/answer-matching.ts`
  already forgives typos by length and stops one edit short of a rival. **No
  embeddings** — semantic closeness would accept "cucumber" for "courgette".
  What authored themes need is aliases per answer (part 2).
- **Prune the Wikidata themes to the mainstream**: the best-known film
  directors, Pixar / Disney / DreamWorks / Marvel, European capitals, French
  regions, US states, French and US presidents, Ballon d'or, the Beatles and
  Queen. Retire the expert ones (Fields, Turing, Booker, Nobel chemistry /
  medicine / economics, most painters and lesser-known writers). Their pool
  is their banked nine; widen it where the query allows. Tier them by views.

## The work

1. Read `docs/game-catalogue.md` (Black square row, stage 45/52/53 plans).
2. Protocol: theme schema with a pool (`min(12)` for authored, the kept
   Wikidata ones may stay at 9) and a tier per answer and per theme;
   `answerCount` default 4; `difficulty` on the arm.
3. Core: the stratified deal, on the difficulty series' tier-aware draw if it
   fits, with tests (break one on purpose). Pay by tier.
4. Server: the deal per round in `black-square-round.ts`, the theme draw
   honouring `difficulty`; the authored source's loader beside the generated
   bank (a hand-written JSON, FR + EN, validated by the schema at test time).
   Five pilot themes authored by hand to prove the shape — part 2 writes the
   rest.
5. Screens: a grid of four is not a grid of nine — `impeccable` first, then
   the host stage, the wall and `features/player/black-square-answer.tsx` at
   4 and at 9, full room at phone width, muted, filmed (CLAUDE.md rules 0, 4).
6. Spoken mode (keeper) still works on a dealt subset.

## Done when

A room deals four answers from a pool, different from one deal of a theme to
the next, mixed in tier; `easy` deals easy themes only; the pruned Wikidata
themes and the five pilots both play in the browser.
