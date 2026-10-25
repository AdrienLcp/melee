# 50 — Petit Bac

**Two steps of three** — the rules and the server landed. Asked 25/10/2026. A letter goes up — *B* — beside six categories —
*a country, an animal, a first name, a job, a brand, something in a kitchen* —
and every screen fills its own grid against the clock: *Belgique, baleine,
Bastien, boulanger, Bic, bouilloire*. The first sheet full may call **stop**.
Then the room reads the answers category by category, says which ones do not
count, and an answer nobody else wrote pays double.

The twelfth game, and the **first of the submit-then-vote shape**
([`game-catalogue.md`](../game-catalogue.md)): its board and its tally are
built inside its own arm of `round.content` and its own directory of
`@melee/core`, never as a shared engine. Read the slate's plans
([25](25-slate.md), [26](26-slate-labels-and-early-marking.md)) first: a sheet
written in private, then judged in public one part at a time, is the slate's
loop, and every choice below that reads like the slate's is one on purpose.

Kind `petitbac`, translation prefix `petitbac.*`. *Petit Bac* in French;
the English name is the screens' session to settle, and is not *Scattergories*
(a trademark).

## Rules, as settled

- **One letter a round**, drawn by the server from the letters a table can
  play — `K Q W X Y Z` left out by default, the host may tick them back —
  never twice in one game until every letter has gone.
- **Three to ten categories, six by default**, each one of two kinds: a
  **bank** category (a key, labelled by the dictionaries in both languages:
  *pays*, *animal*, *prénom*, *métier*, *marque*, *fruit ou légume*…, about
  thirty) or **the host's own**, typed (40 characters, shown as typed in every
  language). The lobby offers *draw six for each round* or *these, every
  round*; a drawn set never repeats a category inside one round.
- **The sheet closes on the clock or on a stop.** `roundDurationMs` 60–300 s,
  120 by default. A seat whose every line is filled may press **stop**
  (`stopsWhenFull`, on by default): every sheet closes
  `PETIT_BAC_STOP_GRACE_MS` later (5 s, a server deadline every screen counts
  down), so the word a hand is still finishing lands.
- **The letter is checked by the server**, after the shared normalisation:
  an answer counts as starting with the letter when its folded form does, or
  when the form with the leading article stripped does — *La Rochelle* plays
  for *L* and for *R*, *Le Havre* for *L* and *H*. An answer off the letter is
  never put to the vote: it is filed *off the letter* and pays nothing.
- **The vote is the room's, one category at a time.** Every answer of the
  category goes up, grouped by the shared normalisation so *Belgique* and
  *belgique* are one row with both authors. Every row counts by default; a
  seat presses *doesn't count* on any row it did not write, and a row falls
  when **strictly more than half** of the seats able to vote on it — the
  round's stamped seats, its own authors excluded — refused it. A tie keeps
  it. The console's *next category* moves the room on, and so does every
  stamped seat having voted.
- **With a judge (`hasJudge`) there is no vote**: the console refuses rows
  itself and the seats only watch, exactly as the slate is marked.
- **The pay**: an accepted answer nobody else wrote pays 2 `POINT`s, one shared
  with anyone pays 1, a refused, off-the-letter or empty line nothing. **No
  speed bonus** and nothing for the stop: the clock paying the fastest typist
  is guess nine's refusal again, and the stop is already paid by closing the
  others' sheets. Scores are recomputed from the sheets on every vote, so a
  changed vote moves the board — the slate's rule.
- **Uniqueness is decided after the vote**, over accepted rows: if *Bic* is
  refused for one seat it was refused for both, since they are one row, so a
  refusal never turns a shared answer into a unique one by accident.

## The shape, as decided

- **No new phase.** The catalogue predicted one name for *the room choosing
  from a board*; the slate already answered that a phase earns its place only
  when the whole room changes what it is doing *and* nothing is still being
  written. Petit Bac's vote is a stretch of `playing` where each category
  carries `open | voting | settled` on the arm, the slate's
  `open | closed | marked` under the game's own words. That keeps the 23
  modules that spell a phase untouched, and leaves `revealed` to be the
  scoreline as for every game.
- **`answerGroups` moves to the shell.** `core/slate/answer-groups.ts` is the
  first case of *group what a room wrote by the shared normalisation*, and
  Petit Bac is the second: it goes to `core/round/answer-groups.ts`, the slate
  importing it from there. Nothing else of the slate moves — its marking is the
  host's alone, which is the half Petit Bac does not share.
- **Mode `typed`**, as the slate: the mode says how a round is answered, and a
  sheet is written. `choice` and `buzzer` are not offered.
- **Anti-leak is the whole game until the vote.** While a sheet is open a seat
  is sent its own lines and nothing else; the console and the wall are sent
  how many lines each seat has filled, never a word — a seated host included,
  and an unseated one too, since a judge has nothing to judge before the
  vote. A category's answers reach anyone only once it is `voting`, which is
  after every sheet has closed.
- **A latecomer** keeps the slate's rule turned around: the round is stamped as
  it opens (a sheet with a clock and a stop is a race, not a pile), so a seat
  arriving mid-round writes nothing, votes nothing and plays from the next.

## Step 1 — protocol and core (one session)

- `packages/protocol/src/petit-bac.ts`: the letter (`A`–`Z`) and the rare
  ones, a category (`{ kind: 'bank', key }` | `{ kind: 'own', label }`), the
  bank's thirty keys as a `z.enum`, an answer (≤ 60 chars), a category's
  state, a line's outcome (`unique | shared | refused | offLetter | empty`) and
  a row as voted (text, authors, refusals).
- `core/round/answer-groups.ts`, moved from the slate with its test.
- `core/petitbac/`: `letter-draw.ts` (the playable letters, a draw that
  exhausts before it repeats), `letter-match.ts` (the article rule),
  `category-draw.ts` (a drawn set, no repeat), `row-vote.ts` (who may vote on
  a row, when it falls), `sheet-pay.ts` (each line's outcome and the sheet's
  points). Each rule seen red under a mutation.

**Done 25/10/2026.** What it settled beyond the plan:

- **The kind waits for step 2.** `petitbac` in `gameKinds` breaks every
  `Record<GameKind, …>` across the server and the app — the icon, the
  dictionaries, the round service — so it lands with the server that serves
  it, not alone.
- **`normalizeKeepingArticle`** beside `normalizeAnswer` in
  `round/answer-matching.ts`: the letter rule needs the fold with the article
  kept, and a second copy of the fold would drift from the first.
- **An off-the-letter twin does not share an answer**: *Rochelle* for *L* is
  off the letter and leaves *La Rochelle* unique, because the two group under
  one key and only the standing ones are counted.

— cut here: plan written, protocol arm and core rules committed, tests green —

## Step 2 — the server (one session)

- `petitbac` in `gameKinds`, **not** in `shelvedGames`. Its arm of
  `settings.game`: `categories` (a fixed list or `null` for drawn),
  `categoryCount`, `excludedLetters` (at most twenty, so six stay playable),
  `roundDurationMs`, `stopsWhenFull`; six rounds by default, `typed` its only
  mode, in `game-capabilities.ts` and `room-settings.ts` beside the others.
- `domain/round/petit-bac-round.ts`: the content, the draws as the round
  opens, `petitbac.write` (an upsert per line on the slate's debounce),
  `petitbac.stop` (refused `sheet_not_full` unless every line is filled),
  `petitbac.vote` (a row and a yes/no, refused on one's own row and on a
  settled category), `host.nextCategory`, `host.refuseRow` under a judge, and
  the move to `revealed` once the last category settles.
- The deadlines — the clock, the stop's grace — as alarms, like every round's.
- `petit-bac-game.test.ts`: a seat's, the console's and the wall's whole
  transcript carry no other seat's word while a sheet is open, seen red with
  the guard removed; a stop closes every sheet at its deadline; a vote's
  majority, its tie and the authors left out; the pay unique against shared;
  a latecomer refused `joined_mid_round`.

**Done 25/10/2026.** What it settled beyond the plan:

- **`petitbac.doneVoting` is the signal "every seat has voted"** needs, because
  every row counts by default and nobody presses *keep* on each one. A category
  with no row — nothing written on the letter — settles on the spot rather than
  waiting on it.
- **`playedLetters` sits beside `playedContentIds`, not in it**: a set cannot
  hold a letter twice, which `drawLetter`'s cycle reads. It survives a *play
  again* the way `playedContentIds` does.
- **The stop's grace is round time** (`stopClosesAtElapsedMs`), so a console
  away freezes it with the clock, and `openPhaseDurationMs` reads it as the
  round's deadline — `null` once the sheets close, because the vote runs on the
  room's word. The `'round'` deadline closes the sheets rather than the round.
- **`isJudged` and `stopsWhenFull` are stamped on the round** as it opens, the
  way `doublesLoneFinds` is: a switch flipped mid-round decides the next one.
- **Who votes is the round's stamped seats still holding one**, so a seat that
  leaves mid-vote leaves no voter the majority waits on.
- **Not tested over a socket**: the clock running out, whose minimum is a
  minute; the grace path ends through the same deadline.

— cut here: server green, the game reachable by a settings frame —

## Step 3 — the screens (one or two sessions)

Direction A, *the sheet*, chosen 2026-10-25 over *one line in hand*
(`.impeccable/directions/petit-bac/`, local): the whole sheet on one card,
the category in the margin and the word on the line; a *doesn't count* toggle
per row in the vote, the seat's own row marked *yours*; on the wall the letter
beside the categories as empty ruled lines and a groove per seat, a card per
row with a dot per voter in the vote, and a seats × categories grid at the
reveal, *found alone* on `--good-soft` with ×2. The spine is a violet school
ink, `oklch(46% 0.13 285)`, and the English name is **Categories** — the
paper game's generic name.

**Two guards against a stop called on a junk sheet**, added with the screens:
the server refuses a stop unless every line starts with the letter and holds
two letters or more, and the console carries *cancel the stop* — the sheets
reopen on the time left when it was called, the stopper may not stop again
that round — until the first category's vote has moved on. Judge or not: the
console runs the room either way. **Landed 25/10/2026**: `isStoppableLine` in
`core/petitbac/letter-match.ts`, `host.cancelStop`, `canCancelStop` on the
console's arm and `barredStopperIds` and `stopsWhenFull` on the seat's — the
screens below read those three rather than guessing. The clock is put back by
setting `round.elapsedMs` to the moment of the stop; not tested over a socket,
like the clock running out.

- **A seat**: the letter large, one field per category, the stop once the
  sheet is full, the grace counting down; then the category being voted, its
  rows, *doesn't count* on the others'.
- **The wall**: the letter and the categories, the clock, each seat's count of
  filled lines; then the category up for the vote with its rows falling as the
  refusals land.
- **The console**: the lobby's categories (bank chips, the host's own lines,
  drawn or fixed, the letters left out), *next category*, and under a judge
  the refusal itself.
- **The reveal**: every seat's sheet as a grid, unique and shared told apart.
- The game into `shelvedGames`, its front door, its line-up tile, both
  dictionaries, the category bank's labels.

Verified muted in a browser with three seats: a stop closes the others' sheets,
a word never reaches another screen before the vote, a refused row pays
nothing, a unique answer pays double a shared one.
