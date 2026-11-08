# Black square, part 2 — two hundred broad themes

After `black-square-01-shape.md` (the pool, tiers and authored source exist,
with five pilots). Adrien's words and every decision are there.

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
