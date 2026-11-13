# New game — Pense comme la table, step 3: the screens

Asked by Adrien on 2026-11-12 (one of three new games, with
`games-03-five-clues.md`). Every choice is weighed by what is more fun at the
table, never by what it costs to build.

**Steps 1 and 2 landed 13/11/2026**: the plan
[`docs/plans/70-think-alike.md`](../docs/plans/70-think-alike.md) holds every
rule as settled and what step 2 decided beyond it — read it first. The server
deals the game end to end, reachable by a settings frame and not on the shelf:
`apps/server/src/domain/round/think-alike-round.ts`, the `match` mode, the
attempt `{ kind: 'match', answer }` and the lean of the same shape,
`host.mergeGroups` / `host.splitGroup`, and `think-alike-game.test.ts`. The
app only compiles: dictionary keys, an icon and the `switch` arms, no screen.

## This session: step 3 of the plan

**Directions done 13/11/2026, awaiting Adrien's pick**: three example pages
behind `file:///C:/git/melee/.impeccable/directions/think-alike/index.html`
(git-ignored, local) — A piles of cards, B columns of pawns, C countdown chart;
`BRIEF.md` and `think-alike.js` there hold the content they share. Recommended:
A, with B's legibility (the top card's word very large, a pile's thickness made
of its authors' pawns). Build the direction he picks, with the corrections he
asks for.

Start with the `impeccable` skill, and give Adrien each direction as a whole
example page behind one index link before building. The template is Make the
number's screens (the commits after `79124e0c` that touch `apps/game/src/features`), the
closest round to copy is the estimate's (one answer a seat, priced at the
close), and Petit Bac's strike is the console action that re-pays a revealed
round.

1. **A seat**: the prompt large, one field (`THINK_ALIKE_ANSWER_MAX_LENGTH`),
   _send_, then its line held while the others write; the field's draft sent
   as a `player.lean` as it changes, so the clock running out sends it.
2. **The wall**: the prompt, the clock, a mark per seat that has sent — never
   a word.
3. **The reveal**: `groups` turned over one by one, smallest first, each with
   its authors and what it paid; the wall never scrolls.
4. **The console**: the merge (drag or pick one group into another, a merged
   group's _take back out_ by its `mergedKeys`), the setup (language, clock
   10–60 s), then the shelf (`shelvedGames`), the game's front door, the
   ready-made line-ups and both dictionaries.
5. Muted, filmed, with `MAX_PLAYERS_PER_ROOM` seats at phone width and a paired
   wall; then the plan's step 3, the changelog, and the handoff for step 4.
