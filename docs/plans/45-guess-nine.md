# 45 — Guess nine

**To do.** Asked 24/10/2026. *Devineuf* in French. A theme goes up —
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

Verified in a browser, muted, with three seats: a hit lights one seat's grid and
no other's, a black word ends that seat's round and voids it, the reveal names
the nine and the word.

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

— cut here: spoken mode shipped —

## Step 5 — *Nobody else had it* (half a session)

A switch on the game's arm, off by default: at the reveal, an answer found by
**one seat alone** pays double. It is *Pointless* without a survey — the table
is the survey — and it needs no other change, because the reveal already knows
who found what. Typed mode only: in spoken mode one team guesses at a time.
