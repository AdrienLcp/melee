# New game — Indices progressifs

Asked by Adrien on 2026-11-12, one of three new games he picked
(`games-01-countdown.md`, `games-02-think-alike.md`). Every choice in it is
weighed by what is more fun at the table, never by what it costs to build.

## The game

A country is hidden behind five clues that go up one after the other, from
the vaguest (_three time zones_, _a population of 34 million_) to the obvious
(_its capital is Lima_). Each seat answers whenever it thinks it knows, and
the earlier the clue it answered on, the more it is paid.

## Where to start

1. Read `docs/game-catalogue.md` and the quiz rubrics' plans (flags,
   `48-capitals.md`, `57-silhouettes.md`) and `58-estimate.md`. The clues can
   be built from data the app already holds about every country: its name and
   aliases (`packages/core/src/countries/`), capital, flag, outline,
   population and area, continent and neighbours (the atlas map). That gives
   clues with no writing by hand, generated per country.
2. Write the stage's plan in `docs/plans/` (the next free number) and add its
   row to `docs/plans/README.md` and to the catalogue table.
3. Build it: the clue ladder in core with tests, the server, the screens
   (`impeccable` first) and the translation prefix.

## Open for the session

- Ordering the clues from hard to easy for each country: a rank per kind of
  clue (a population before a capital, the flag or the outline near the end),
  checked against a handful of countries so the first clue is never a
  giveaway.
- What a wrong answer costs: a lockout until the next clue, or out for the
  round. One guess per clue keeps people from spamming every country they
  know.
- Answer modes: typed, matched against the country names the flags rubric
  already accepts, and choice (four countries, as in the quiz).
- How pay by clue fits `MOST_A_ROUND_PAYS` and `clockedPay`: answering on the
  clue is the answer's worth, and the clock still settles ties between seats
  who answered on the same clue.
