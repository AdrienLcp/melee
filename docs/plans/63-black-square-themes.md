# 63 — Black square themes

**Done** 09/11/2026, in two sessions.

The themes were too hard: a list of works or office holders is a closed set a
table has to know. Adrien asked for broad ones — green vegetables, exotic
fruits, film genres — pooled ten to twenty deep, a round dealing a few of them.

## Part 1 — the pool

A theme holds twelve to twenty true answers, each tiered easy, medium or hard,
and a round deals `answerCount` of them (four by default: one easy, two medium,
one hard — `dealBlackSquareAnswers`). A rare answer pays three times an obvious
one. The Wikidata themes are cut to the sixty a table knows and are never
`easy`, so an easy room deals the hand-written themes alone. Five pilots.

## Part 2 — two hundred themes

- **201 hand-written themes**, one file a domain beside the bank —
  `black-square-authored-<domain>.json` for `pilots`, `food`, `table`,
  `nature`, `world`, `home`, `everyday`, `culture` and `leisure` — each checked
  alone by `black-square-bank.test.ts`. Two batches of a hundred, the second
  written once the first was read back. Not five hundred: past two hundred,
  broad themes start overlapping ("root vegetables" / "winter vegetables").
  Grow the bank when a table notices repeats, never on a schedule.
- **Authored by subagents, twenty-five themes each**, from one brief: broad,
  true in French and English, a black word a table will actually type and
  nobody can argue (peanut among nuts, Chablis among grape varieties). Three
  themes were swapped by their author for want of a clean edge: _At breakfast_
  (anything is eaten at breakfast somewhere) became Greek food, casino games
  (variants of each other past four) became types of home.

## What writing them found

**A round graded a line against the answers it dealt and nothing else**, so a
true answer left out was a stranger to it: _Ireland_ typed beside a dealt
_Iceland_ was forgiven as a typo, and a true answer one letter from the black
word cost the round. The server-held theme now carries `leftOut`, every name
the deal did not draw, and `gradeLine` takes them as rivals of each cell and of
the black word, never as a cell. Two answers one letter apart are therefore
fine in a pool; what collides is one name shared by two answers.

The bank test grades every name the way a round does — one answer dealt, the
rest left out — over the authored files and the Wikidata bank alike. It found
two nicknames the Wikidata bank gave two answers at once (_The Blues_, _RU_);
`build-black-square-bank.ts` now drops a nickname two answers share.
`normalizeAnswer` keeps a bounded cache, because one bank name is normalised
thousands of times.
