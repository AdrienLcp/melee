# New game — Cinq indices, step 3: the buzzer mode, then the screens

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

## Adrien's word on 18/11/2026: three modes, as every other game

**Direction B, _La montée_, is picked.** And the game plays in the three
modes every game that serves its own content offers: `choice` (four names),
`typed` (one field) and `buzzer` (said aloud, judged by the host). `choice`
and `typed` are served; **`buzzer` is owed, server first, before any
screen**, so the screens are drawn once for all three:

- **Narrow `buzzer` in** `game-capabilities.ts` beside `typed` and
  `choice`, and judge the round by host (`isJudgedByHost`): the judge is a
  host who does not play, so a seated host **sits that round out** — seat
  and score kept, the answer sent to it — as the shell already does for
  every host-judged round (CLAUDE.md, _Host_). Nothing new to build there;
  check it holds.
- **The rules, as decided**: a buzz takes the floor and **stops the clue
  clock** (`nextClueAt` `null` while the floor is held, the window's
  remainder given back after), no new clue opens under a buzz. The host's
  verdict is `single`. Right pays by the clue open when the buzz arrived,
  `pointsForClue` with the clock's tenth measured to the buzz's server
  stamp. Wrong, or the floor run out, **locks the seat until the next clue
  opens** — the typed rule, one try a clue, so the buzz stays worth risking
  on a vague clue. **A right buzz ends the round**: the answer was said
  aloud, the whole table heard it, so nobody else can still race — the
  quiz's buzzer rule. One winner a round in `buzzer`.
- **The answer reaches the judging console only**: the console's
  `currentContent` carries the country in a `buzzer` round (it judges),
  still `{ kind: 'fiveclues' }` in `typed` and `choice`. The anti-leak test
  extends to `buzzer`: no seat and no wall frame carries it before the
  reveal, seen red with the guard removed.
- Then the plan's step 2, `docs/realtime-protocol.md`, the MCP game notes
  and the changelog say three modes.

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
fixed boxes stamped one by one). **Adrien picked B.** Its rung opening was
never filmed, and the box colour (fir green) is still to measure. Draw the
`buzzer` seat (one big press, held while the floor is taken, locked until
the next clue) and the judging console in B's language — the pages only
show `typed` and `choice`.

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
