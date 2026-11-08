# Black square, part 2 — two hundred broad themes

After part 1, which landed the pool, the tiers and the authored source with
five pilots. Adrien's words, as part 1 quoted them:

> Les thèmes du jeu "cases noires" sont trop difficiles. […] des thèmes
> beaucoup plus faciles et larges, comme "légumes verts", "fruits exotiques",
> "genres de films" […] une liste de 10 à 20 par thème, et on en prend
> aléatoirement à trouver dedans.

## What part 1 left in place

- **The shape** is `authoredThemeSchema` in
  `apps/server/src/infrastructure/questions/black-square-bank.ts`: theme
  `id` (kebab-case), `tier`, `labels`, 12–20 `answers` each with `labels`,
  `aliases` and `tier`, and a `blackWord` with its `why`. The five pilots are
  `black-square-authored.json` beside it; part 2 either grows that file or
  splits it into several the loader concatenates.
- **A round deals 1 easy, 2 medium, 1 hard** of four
  (`packages/core/src/blacksquare/answer-deal.ts`), so a theme needs at least
  three of each tier — the bank test enforces it.
- **Matching is whole-line** (`line-match.ts`): "Comédie musicale" beside
  "Comédie" is fine, but two names within typo tolerance are not. Under six
  letters no typo is forgiven, so short names may sit two letters apart.
  `black-square-bank.test.ts` already fails on a name graded as another answer
  or as the black word.
- **Wikidata themes are never `easy`**: medium or hard by their traffic, so an
  easy room deals only authored themes and falls to medium once they run out.
  With five pilots that is five rounds — the reason the volume below matters.

## Volume

**200 authored themes**, in two batches of 100, the second written only once
the first has been read back. Not 500: past ~200 broad themes start
overlapping ("root vegetables" / "winter vegetables") and quality drops. A
room never re-deals a theme in an evening (`drawBlackSquareTheme`,
`playedIds`), and a four-of-fifteen deal makes a theme met again on another
evening a different grid. No recurring "add 100 a week": grow the bank when a
table notices repeats.

## A theme

- **Broad and easy to enter**: "green vegetables", "exotic fruits", "film
  genres", "wind instruments", "sports played with a ball", "farm animals" —
  every player can type something, the race is landing on the four dealt.
  Mostly `easy`, some `medium`; the `hard` end is what the kept Wikidata
  themes already cover.
- **Holds in French and English** — "film genres" yes, "French cheese brands"
  no.
- **12–20 answers**, each with a tier (easy / medium / hard by how soon a
  table says it) and its **aliases**: plurals ("petit pois" / "petits pois"),
  the short form a table says ("haricot" for "haricot vert"), FR and EN
  spellings. An answer that is a true member of two themes is fine; two
  answers of one theme that the matcher cannot tell apart are not.
- **A black word that sounds right and is wrong**, with its one-line why in
  both languages: avocado in green vegetables (a fruit), tomato in vegetables.
  It must not be a member of the pool, nor within the matcher's tolerance of
  one.

## The work

1. Write the theme list first (200 names, FR + EN, theme tier), check for
   overlaps, then the contents.
2. Author with subagents, ~25 themes each, every one writing its own JSON
   file in the authored source's shape: 200 themes × 15 answers × 2 languages
   with aliases does not fit one session's context.
3. A test over the whole authored bank: schema, pool size, no black word
   inside a pool or its tolerance, no two answers of a theme matching each
   other, every theme in both languages.
4. Read a sample of each batch back yourself; play a few in the browser,
   muted.

## Closing the series

- `pnpm validate` once, when no other session runs it.
- Record the stage in `docs/plans/` (next free number) with its row in
  `docs/plans/README.md`; update the Black square line of `.claude/CLAUDE.md`
  ("three to nine answers") and `docs/game-catalogue.md`.
- Delete both `black-square-*` handoffs and their README rows in that commit.
