# 45 — Guess nine

**Done — the bank, the server, the screens, the spoken mode and *Nobody else had it*.** Asked 24/10/2026. *Devineuf* in French. A theme goes up —
*Quentin Tarantino's films* — and nine answers are hidden behind it, each worth
more the less obvious it is. Hidden with them is one **black word**: an answer
that sounds right and is not (*True Romance*, written by Tarantino, directed by
Tony Scott). Players fire answers in series to land on the nine, which is
exactly what makes the black word bite.

Played two ways: **typed**, everyone on their own screen at once, judged by the
server; and **spoken**, one team guessing aloud while a seat of another team
holds the list and ticks what it hears.

Read [`game-catalogue.md`](../game-catalogue.md) first: it is a game of its own
shape — a closed list, many guesses, each hit banked — and the shape is not to
be shared before a second game asks for it.

## Rules, as settled

- **Exactly nine answers.** The name says nine, the board is a 3 × 3 grid, and
  the bank refuses a theme that cannot field nine. A theme with more than nine
  true answers (Tarantino has ten films) keeps the nine the source ranks, and a
  true answer outside them is simply not on the board — it costs nothing.
- **Points by obscurity, three tiers.** The nine are ranked by the sixty-day
  traffic of their Wikipedia article, the measure `isWellKnown` already uses:
  the three most read pay 1 `POINT`, the next three 2, the last three 3. A full
  sheet is 18. **No speed bonus**: a sheet is many answers, not one, and the
  clock would pay the fastest typist rather than the best-read player.
- **The black word cuts the round and voids it.** Whoever lands on it — a seat
  in typed mode, the guessing team in spoken mode — banks nothing for the round
  and stops. Cutting alone would leave nothing at stake past the first few
  answers; a negative score would punish a late round more than an early one
  and print negative totals on the board. Cut *and* void is the same rule in
  both modes, and it is the one that makes a player hesitate.
- **A guess is matched whole**, the quiz's rule rather than the blind test's
  search within a line, with the quiz's forgiveness — which already stops one
  edit short of an answer the bank calls wrong. The black word *is* that
  answer, so *True Romanc* is not forgiven into a hit it cannot be.
- **Many guesses, one sheet.** In typed mode a seat sends as many lines as the
  round lasts; a line matching nothing is silent, a hit lights its cell on that
  seat's own screen. Every seat can find every answer — no *first to find it
  takes the cell*, which would make spectators of the slow, as the duel already
  taught.

## Step 1 — the bank (one session)

`apps/server/src/infrastructure/questions/guess-nine-bank.json`, each theme
carrying `labels: { en, fr }`, nine answers with their aliases per locale and
their traffic, and one black word with a one-line `why` for the reveal
(*written by Tarantino, directed by Tony Scott*).

Built by a script beside `wikidata-kinds.ts` and `wikidata-aliases.ts`: a theme
is a **Wikidata query** (films directed by X, albums by a band, countries
bordering France, members of a band, Pixar films), the nine are its most-read
results, and the black word is the most-read entity of **the same kind linked to
the subject by a neighbouring property** — screenwriter but not director, a
solo album beside a band's, a country bordering the neighbour. Every black word
is then **read by hand**: it is the one cell where a wrong fact ruins the
round, and *Boulevard de la mort* — Tarantino's own *Death Proof* — was offered
as one when the game was asked for.

Target: 150 themes, each with nine answers named in both languages. A theme
whose answers a French table would not know under the French title (a film
released under another name) carries that name as the French label, not a
translation.

**Done 24/10/2026: 154 themes**, built by `pnpm run guessnine:build` from
`scripts/guess-nine-themes.ts`, every black word read by hand and many picked
by hand where the neighbouring property offered nothing that bites (*Old Boy*
under Bong Joon-ho, *Le Jardin des délices* under Bruegel). What it taught:

- **Wikidata pollutes truths more than candidates**, and `excluded` only
  filters candidates, so a wrong truth drops the theme. Every `songs-by` went,
  most `albums-by-band`, eight `countries-bordering`, OPEC, ASEAN, English,
  Spanish and Arabic as official languages, the Tour, the Eurovision, the Euro,
  Molière, Shakespeare, Rowling, Hemingway (*For sale: baby shoes*), Leone (a
  nine needs two films he did not direct alone), the Pulitzer and the Grammy
  (works and people mixed), the BAFTA (*Julia* read as a first name), Italy
  (five regions filed apart) and the franchises (Simpsons, Star Wars, Harry
  Potter, Friends, One Piece, Tintin).
- **`award-winning-films` and `award-winning-people`** filter the truths by
  kind; `award-winners` stays unfiltered because the Goncourt banks books.
- **A black word may share a nickname with an answer** — *The Amazing
  Spider-Man* is also *Spider-Man* — so the build strips from it every alias a
  true answer holds, and the test grades the black word's names as decoys, as
  step 2's matcher must.
- **Clubs have no short names on Wikidata**: `SPOKEN_ALIASES` adds the ones a
  table says (*PSG*, *Barça*, *Nantes*, *Real*).

— cut here: bank committed, its test checks nine answers and one black word per
theme, no black word matching any answer —

## Step 2 — the server, typed mode (one session)

- A game kind, `guessnine`, in `gameKinds` and **not** in `shelvedGames`, as
  every game spent a stage. Settings: `roundDurationMs` (30 to 180 s, 60 by
  default), six rounds by default.
- An answer mode of its own is not needed: `typed` carries the line. What is new
  is that typed mode here **keeps going after a hit** — the round closes for a
  seat on its black word or the clock, never on a hit.
- `core/guessnine/` holds the match (a line against nine answers and the black
  word, through the quiz's matcher) and the pay (tiers, the void). Tests break
  on purpose once each.
- **Who sees what.** The public arm carries the theme and, per seat, the cells
  *that seat* found — indices, never text it did not type. The host arm carries
  the nine and the black word only while the console holds no seat; a seated
  host is sent them at the reveal like everyone else. The wall shows the theme
  and how many cells the room has found. `guess-nine-game.test.ts` checks a
  player's and the wall's whole transcript for an answer the seat never typed,
  and is seen red with the guard removed.
- The reveal carries the grid with every answer, its tier, who found it, and the
  black word with its `why`.

**Done 24/10/2026.** The verdict is a fifth shape, `cells` — the cells found
and whether the black word was hit — so a seat's own grid rides `yourVerdict`
and the shell's typed path (retries until `isFullyBanked`, `everyoneIsDone`)
needed no new branch. What it settled beyond the plan:

- **Every name in both languages counts**, whatever the room's locale: a
  French table types *Pulp Fiction* as often as *Fiction pulpeuse*.
- **An answer's rivals are the black word and the other eight**, so *Kill Bill
  Volume 3* is forgiven into neither volume, and a line naming two cells at
  once (*Kill Bill*, a short name both hold) finds both.
- **The room's count includes a voided sheet's cells**: the black word costs
  the seat its points, not the room what it found.
- **`isPaidForSpeed`** in `core/scoring/verdict.ts` is where the clock is
  refused, by verdict shape, because `settleSimultaneousRound` is otherwise the
  shell's.

— cut here: server and core green, the game reachable by a settings frame —

## Step 3 — the screens, typed mode (one session)

Starts with the `impeccable` skill, and the directions go to Adrien as complete
pages behind one index link before any of them is built.

- **A seat**: the theme, one field that empties after each send, and the 3 × 3
  grid filling with the seat's own hits; the black word ends the sheet on screen.
- **The wall**: the theme large, the room's count of found cells, the clock.
- **The reveal**: the grid with every answer, its tier, who found it, the black
  word last and on its own.
- The game goes into `shelvedGames`, its front door and its line-up tile.

**Direction A, *the grid*, chosen 24/10/2026** over B, nine ruled lines in
finding order (`.impeccable/directions/guess-nine/`, local):

- **A seat's grid** is 3 × 3 in cell order, so a cell's place says its tier;
  an empty cell is a socket printing its tier as one to three pips, a found
  one a `--good-soft` piece with **the line the seat typed** — it is never sent
  a cell's text, so the screen keeps what it sent. Under about 10rem of box
  (a small phone with its keyboard up) the grid becomes one row of nine.
- A line matching nothing is echoed above the field in muted ink
  (*« Jackie Brown » : rien*), a hit with what it paid.
- **The black word is an ink piece** (`--black-word`, a new token), never the
  danger stamp: a trap, not a fault. On the seat it lies over the grid, the
  found cells under it voided; the field gives way to *the others are still
  looking*.
- **The wall**: the theme on a lid banded in the game's spine, the clock along
  its top, and under it nine tokens checked as the room's count rises — a
  gauge, never positions. The reveal: the grid as nine paper cards (name,
  pips and what it pays, the finders' pawns, *Nobody* on a socket) and the
  black word as a tall ink card beside it, with its `why` and who lost the
  round on it.
- **The spine is a wine**, `oklch(40% 0.12 8)`: an ink-black spine vanishes
  on the dark board, and every other free hue sits within twenty degrees of
  a neighbour's.

Verified in a browser, muted, with three seats: a hit lights one seat's grid and
no other's, a black word ends that seat's round and voids it, the reveal names
the nine and the word.

**Done 24/10/2026**, seen muted through a Playwright script at 1280×800,
1440×900, 390×844 and 360×380, light in English and dark in French: the
picker, three seats typing, a miss and three hits, the black word on a seat,
the keyboard-up row of nine, the console's gauge, the reveal on the console
wide and narrow and on every seat, and a seated console playing. A paired wall
was not seen; it draws the console's stage. What it settled beyond the plan:

- **The server reads a seat its own lines back** (`yourLines` on the public
  arm, `PROTOCOL_VERSION` 50): every line that found something, then the
  latest if it found nothing, so the grid prints what the seat typed and the
  echo says what the last line did — after a reload too. A screen keeping its
  own lines could not tell a miss from a snapshot that left before its line
  was read. Never another seat's: a line is the text of a cell.
- **The hint is the echo's first line**, *one of them is the black word*,
  which keeps the field and its press on one row.
- **No strike on a hit**: nothing moves inside a running round
  (`DESIGN.md`), so the cell lights and the echo says it.
- **The reveal is the scoreline**: no list of who said what under it, since
  the finders stand on each card and the points are on the track.

— cut here: typed mode shipped —

## Step 4 — spoken mode (one session)

A mode of its own, `spoken`, offered only with **at least two teams**. Each
round **one team guesses** and **one seat of another team keeps the list**,
both drawn by rotation so every team guesses as often as every other and every
seat keeps before any keeps twice — the duel's draw.

- **The keeper is sent the list.** This is the one place a seat is sent an
  answer, and it is safe for one reason that must stay true: the keeper's team
  is **not playing that round**. The keeper's arm is its own schema, encoded
  through it like every player frame, and the test checks that no seat of the
  guessing team ever receives it.
- The keeper ticks what the guessing team says (`player.tickCell`, the cell
  index) and can untick a mistake until the reveal; ticking the black word asks
  once more, then cuts and voids.
- Points go to the guessing team, through the board the teams already have —
  read `team-verdicts.tsx` and the team scoring before choosing how a team's
  points land, rather than inventing a second path.
- Without teams the mode is not offered: a host who wants it spoken with no
  teams uses the console as the keeper, in `buzzer` mode, judged by the host as
  every other judged game is.
- The device is never assumed: the keeper may be a phone held up to the
  guessers or a laptop turned round; the keeper's screen hides the list behind
  one press so it can be shown without spoiling.

**Done 24/10/2026.** `spoken` is an answer mode, `guessnine.tick` the keeper's
frame, `PROTOCOL_VERSION` 51. What it settled beyond the plan:

- **Named *Team by team* / *Équipe par équipe*** on the console, never *aloud*:
  the teams' own *aloud* setting is a table with no screen at all, and the two
  side by side in one panel said the same word for opposite things.
- **The keeper ticks; the server only counts.** The ticked cells go to every
  screen as indices — the room heard them — and the list is checked on every
  frame rather than at the draw, so a keeper the host moves into the guessing
  team loses it and its ticks are `not_your_turn`.
- **The pay is the challenge's**: each guessing seat is paid the sheet and the
  team once (`answersAsOne`), so a seat's reveal says what the round did to it.
  A `teamAwards` path paid the team right and told each guesser *nothing this
  time*.
- **A room that cannot hold the mode is fitted, never refused on the frame
  the host did not mean**: `fittedToTeams` types the round when the teams go
  off, and `movedToEntry` never restores a spoken setup the teams cannot play.
- **Not built: the console as keeper** for a room without teams. A host who
  wants it said aloud with no teams has nobody on another team to hold the
  list; the mode is simply not offered there.

Seen muted through a Playwright script at 1280×800, 390×844, 360×640 and
430×932, light in English and dark in French, with three teams: the keeper's
list hidden and shown, ticks and a taken-back tick on every screen, the black
word asked twice and voiding the round, the console's reveal and each seat's.
A seated console keeping the list and a paired wall were not seen; both draw
the same components.

— cut here: spoken mode shipped —

## Step 5 — *Nobody else had it* (half a session)

A switch on the game's arm, off by default: at the reveal, an answer found by
**one seat alone** pays double. It is *Pointless* without a survey — the table
is the survey — and it needs no other change, because the reveal already knows
who found what. Typed mode only: in spoken mode one team guesses at a time.

**Done 24/10/2026.** `doublesLoneFinds` on the game's arm, defaulted to `false`
so a setup remembered before it still parses, `PROTOCOL_VERSION` 52. What it
settled beyond the plan:

- **Frozen on the round as it opens**, like the content a round is asked about,
  and carried on the reveal: a switch flipped mid-round pays the next one, and
  the reveal draws what this one paid.
- **A voided sheet's cell is nobody's lone find.** The seat that fell had it
  too; the table is the survey, and the room's count already reads it so.
- **The *×2* takes the pips' place**, not a place beside them: at 360 px a
  three-line name leaves the foot no width to spare, and a tag beside the pips
  pushed it out of the card. The amount printed is the doubled one.
- **The console offers it in typed mode only**, and the scoring sentence on the
  lobby and each seat's *up next* says so when it is on.

Seen muted through a Playwright script: the switch on the planned game's page,
then a round at 1280×800, 390×844 dark in French and 360×640 light, two seats
with one shared find and two lone ones each side, paid 11 000 and 5 000.
