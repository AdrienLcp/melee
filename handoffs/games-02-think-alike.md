# New game — Pense comme la table

Asked by Adrien on 2026-11-12, one of three new games he picked
(`games-01-countdown.md`, `games-03-five-clues.md`). Every choice in it is
weighed by what is more fun at the table, never by what it costs to build.

## The game

A prompt goes up (_a red fruit_, _something you find in a fridge_). Every
seat writes one word on its own screen. The answers are grouped, and a seat is
paid by how many others wrote the same thing: the opposite of Petit Bac, where
a word nobody else wrote pays double. The reveal is the fun part, so the wall
shows the groups one by one, from the lone answers up to the biggest.

## Where to start

1. Read `docs/game-catalogue.md` (the submit-then-vote shape) and
   `docs/plans/50-petit-bac.md`. This game reuses Petit Bac's grouping of
   equal answers and its normaliser, then pays the crowd instead of the
   loner. Check what Petit Bac actually shipped before reusing it.
2. Write the stage's plan in `docs/plans/` (the next free number) and add its
   row to `docs/plans/README.md` and to the catalogue table.
3. Build it, with a prompt bank in French and English written by hand: prompts
   with an obvious answer and a few runners-up, where the table splits.

## Open for the session

- What counts as the same answer: plurals (`fraise` / `fraises`) and
  articles fold on their own. For anything closer, decide whether the host
  merges two groups at the reveal or the room votes, as in Petit Bac.
- How a seat is paid, inside `MOST_A_ROUND_PAYS`: its share of the other
  seats that matched it, and what a lone answer gets (nothing, most likely).
- Whether speed pays at all. A clock pushes everyone to the first word that
  comes to mind, which is the game, so it may be worth keeping.
