# New game — Cinq indices, step 3: the screens

Asked by Adrien on 2026-11-12, the third of three new games. Every choice is
weighed by what is more fun at the table, never by what it costs to build.

**Steps 1 and 2 landed 18/11/2026**: the plan
[`docs/plans/73-five-clues.md`](../docs/plans/73-five-clues.md) holds every
rule as settled and what step 2 decided beyond it — read it first. The server
deals the game end to end, reachable by a settings frame and not on the shelf:
`apps/server/src/domain/round/five-clues-round.ts`, the quiz's `typed` and
`choice` modes (`choice` the default), and `five-clues-game.test.ts`. The app
only compiles: the name and scoring keys in fr/en/pt, a `Telescope` icon, the
`switch` arms (`candidatesIn` reads `choices` as the quiz's), no screen.
`docs/realtime-protocol.md` has the view in full, under _A five-clues rung
travels only once it is open_.

## What the screens read

On `view.round.content` (`kind: 'fiveclues'`), for a seat, the wall and the
console alike — the console's `currentContent` is `{ kind: 'fiveclues' }`
and nothing more, seated or not, so it climbs blind:

- `clues` — the open rungs, vaguest first, each discriminated on `kind`:
  `size` (`population`, `areaSquareKilometres`, printed in the screen's
  locale), `region` (an M49 id the dictionary names — `m49Regions` in
  `packages/protocol/src/five-clues.ts`, continents and sub-regions),
  `outline` (`silhouette`, a file under `/silhouettes/`), `cities` (one to
  three names, room language), `flag` (`flag`, a file under `/flags/`, and
  `capital`). Empty during the countdown; the whole ladder once revealed.
- `openClueIndex` (0–4) and `nextClueAt` — server time the open window ends
  (the next clue opens, or the round closes on the last), `null` while the
  clock is stopped; schedule against it with the clock offset, as the
  reflex's `flipsAt`. `clueDurationMs` draws the bar.
- `choices` — four names in the room's language, shuffled, from the first
  frame in a `choice` round; `[]` in `typed`.
- `standings` — every stamped seat `racing`, `found` (with `clueIndex`) or
  `out`, never a guess; `yourStanding` adds `guessedOnClue` to a racing seat:
  equal to `openClueIndex` in `typed` means held until the next clue.
- `answer` — `{ code, name }` at the reveal; `round.awards` come ranked by
  clue then millisecond, each `points` and `speedBonus`, and
  `round.revealedAnswers[].said` names what each seat answered.
- Answers: `player.answer` `{ kind: 'typed', guess }` once a clue, or
  `{ kind: 'choice', choiceIndex }` once a round. Refusals: `already_buzzed`
  (a second guess on a clue, or after finding), `player_locked_out` (a pick
  after a wrong one), `joined_mid_round`.

## This session: step 3 of the plan

Start with the `impeccable` skill. Each direction becomes a **complete
example page** — real Peru content (34.2 M on 1.29 M km², South America, its
outline, Cuzco · Arequipa · Trujillo, its flag and Lima), the empty and the
revealed states — and Adrien compares them through **one index page**,
opened for him in the built-in browser (`preview_start` with the
`file:///C:/...` URL). Build only once he has picked. The template is Think
alike's screens (`7361edfb`, `a7731848`, then `3897257b` for the shelf); the
quiz's flags and silhouettes already draw the outline and the flag files.

**The directions are drawn** (18/11/2026), in the git-ignored
`.handoff/five-clues-directions/index.html`: _A · Cinq cartes_ (five face-down
cards worth 100 to 20, one turned a clue), _B · La montée_ (a ladder the
crowd's pawns climb a rung a clue, a finder staying on the rung it dared, the
country at the top — recommended: the bet shows at the table and the stake
falling is the ladder itself) and _C · La fiche_ (an identity card of five
fixed boxes stamped one by one). Build the one Adrien picked; B's rung
opening was never filmed, and the box colour (fir green) is still to measure.

1. **A seat**: the climb — the open clues stacked, the new one arriving with
   a motion, the window's bar to `nextClueAt`; four names or one field; a
   held seat said plainly until the next clue, found or out after.
2. **The wall**: the five rungs, the unopened ones closed, every seat's
   standing as marks (found on which clue), never a guess; the wall never
   scrolls.
3. **The reveal**: the country, the whole ladder, the seats ranked by the
   clue they found on, then the millisecond, each with what it paid.
4. **The console and the setup**: the clue window (5–30 s), the level, the
   language; then the shelf (`shelvedGames`), the game's front door, the
   ready-made line-ups, and the dictionaries in fr/en/pt — the M49 names
   among them.
5. Muted (`melee:volume` `'0'` before the first navigation), filmed as each
   clue opens, with `MAX_PLAYERS_PER_ROOM` seats with long names at phone
   width and a paired wall; then the plan's step 3, the changelog, and delete
   this file and its row in `README.md` if nothing is left.
