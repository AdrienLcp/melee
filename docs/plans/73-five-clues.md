# 73 — Five clues

A country is hidden behind five clues that go up one after another, from the
vaguest — _34.2 million people on 1.29 million km²_ — to the one nobody should
need — _its flag, and its capital is Lima_. Every seat answers whenever it
thinks it knows, and the earlier the clue it answered on, the more it is
paid. The round is the tension of the climb: who dares on the numbers, who
waits for the outline, who is still staring at the flag.

The twenty-first game, **everyone at once** and decided by the server. Kind
`fiveclues`, translation prefix `fiveclues.*`. _Cinq indices_ in French,
_Five clues_ in English, _Cinco pistas_ in Portuguese.

## Rules, as settled

- **The ladder, in a fixed order, vague to obvious**, built from the banks
  the other games already deal, nothing written by hand:
  1. **its size** — population and area, two numbers each screen prints in
     its own locale (`quantity-bank.json`, families `population.country` and
     `area.country`);
  2. **its region** — the UN M49 group finest-but-one (`005` South America,
     `155` Western Europe) from `capital-bank.json`, an id the screen names.
     A group that holds fewer than four dealt countries names its continent
     instead: Northern America is the United States and Canada, so a region
     clue there would be the answer, and four is as many as `choice` shows;
  3. **its outline** — the silhouettes rubric's file;
  4. **up to three of its largest cities**, never its capital or a seat of
     government (`largestCities`), in the room's question language;
  5. **its flag and its capital**, together.
- **A country is dealt only if every rung has data**: the intersection of
  `BANKED_COUNTRIES` (the map's — no microstate, no territory) with the
  capital, quantity, flag and silhouette banks, composed at load.
- **No country whose size names it.** The first clue is worth the whole
  round, and a round every seat wins on it is not played: the three largest
  of the pool by population and the three largest by area are left out —
  China, India and the United States, Russia and Canada. Brazil and Australia
  stay: their numbers are known to few tables, and Australia's region clue is
  Oceania, four countries.
- **No city carrying the country's name**: _Santiago de Cuba_, _Port-Soudan_,
  _Cap-Haïtien_, _Antigua Guatemala_ and _Île de Mozambique_ said the answer
  on clue 4. A city whose name, in any question language, contains the
  country's name or one a table says instead is skipped and the next taken.
- **A clue stays open `clueDurationMs`**, 10 s by default, 5 to 30. The next
  one opens early once every seat still racing has guessed on the open one —
  nobody left thinking, so the table would only watch the clock. The round
  closes once every seat it opened on has found or is out, or when the fifth
  clue's window ends. The server owns time: the view carries the open clue's
  index and when the next opens.
- **Two answer modes**, the quiz's names: `typed`, the whole line matched
  against the country's name and what a table says instead, as the flags
  rubric grades (`gradeQuizGuess`, never forgiving a slip as far as one of
  the three countries `choice` would show), and `choice`, four countries on
  screen from the first clue. Typed allows **one guess per clue**: a wrong
  guess locks the seat until the next clue opens, which keeps people from
  spraying every country they know. Choice allows **one pick for the round**:
  a wrong pick is out, because four candidates with retries is the answer
  with extra steps.
- **The decoys are a staircase: each of the first three clues strikes one
  as it opens.** Reversed on 23/11/2026, Adrien's word after a weekend of
  play: the decoys used to share the region clue on purpose — the three
  nearest capitals of the same region, Peru's Ecuador, Bolivia and Colombia —
  so the region clue never struck one, and on a screen of four South American
  countries _South America_ said nothing. A clue that rules nothing out is a
  clue the `choice` table cannot use, so now the **size** clue strikes a
  country of the same region three times bigger or smaller (`SIZE_APART`, on
  its people or its land), the **region** clue one from elsewhere the size
  clue left standing, and the **outline** clue one of the same region and a
  like size whose silhouette is drawn clearly otherwise — 1.6 times more or
  less stretched, or twice as compact (`outlinesDiffer`, measured on the
  drawn path at build, `scripts/outline-measure.ts`). Each is the nearest
  capital that fits, the plainly alike in size (within twice) first. Peru's
  are Ecuador, Mali and Chile. The cities cannot be guaranteed to strike —
  only a table that knows them is helped — and the flag and capital strike
  all three. **Where a region is too thin, the step falls back**: no country
  of the same region within three times the size is drawn otherwise for 60
  of 147 (France's like-sized neighbours are all as compact), and the nearest
  same-region capital stands in, struck by the flag alone; Luxembourg has
  nothing outside Western Europe within three times its size, so its region
  decoy, Cyprus, already fell on the size clue. The bank test names both and
  holds the first under a ceiling. No threshold moves the outline count much
  — 43 at 1.3 and 1.5 — because the constraint is the region and the size,
  not the measure.
- **The pay**: a right answer on clue _k_ (1 to 5) is worth `(6 − k) / 5` of
  `MOST_A_ROUND_PAYS` — 100, 80, 60, 40, 20. Nine tenths are flat and the
  last tenth is the clock, falling linearly over that clue's window, so the
  seats who found on the same clue are ordered to the millisecond. Unlike
  `clockedPay`, an answer worth less than a hundred races: a later clue is
  not a worse answer but a later one, and the slowest answer on a clue still
  out-earns the quickest on the next (90 > 80, 72 > 60, 54 > 40, 36 > 20). The
  room's `paysForSpeed` off pays the worth alone. A wrong answer pays nothing.
- **Level**: easy, mixed or hard over the country's tier (`countryTierOf`),
  as the flags rubric deals. **Duel**: allowed if the shell's duel asks
  nothing of the game — decided in step 2.
- **Anti-leak**: no screen — seat, seated host, console, wall — learns the
  country before the reveal. A clue's data, the hashed flag and outline file
  names included, travels only once its clue is open; the four `choice`
  names travel from the first frame, in an order the server shuffled.

## The shape, as decided

- **The modes are the room's `typed` and `choice`**, narrowed in
  `game-capabilities.ts` the way the quiz narrows them (`answerModesFor`),
  with their existing attempts — `{ kind: 'typed', guess }` and
  `{ kind: 'choice', choiceIndex }` — and the `single` verdict. Not a mode of
  its own: what differs is when a guess is allowed and what it pays, which is
  the round's business. But the round is **priced by `pointsForClue`, never
  by the shared settle's `clockedPay`**, which would pay clue 2 without a
  clock and clue 1 by the round's whole duration.
- **The clues travel as a list of the open ones**, each a member of
  `fiveCluesClueSchema`, discriminated on `kind`: `size`, `region`,
  `outline`, `cities`, `flag`. The server holds the whole
  `FiveCluesLadder`, a tuple in climbing order.
- **A seat's standing** is `racing` (with the last clue it guessed on),
  `found` (on which clue, how far into it) or `out`, the rules over it pure
  in `@melee/core/fiveclues/clue-race`.
- **The played id** is `fiveclues:PER`, apart from the map's `atlas:` and
  the quiz's flag ids, so one evening may place Peru and climb to it.

## Step 1 — plan, protocol, core and bank (one session)

- `packages/protocol/src/five-clues.ts`: the five clue shapes, the ladder,
  the M49 ids a region clue may name, the clue window's bounds and default.
- `core/fiveclues/clue-pay.ts`: `worthOfClue`, `pointsForClue`.
- `core/fiveclues/clue-race.ts`: `mayGuess`, `seatAfterGuess`,
  `opensNextClueEarly`, `isRaceSettled`, `clueWindowEndsAt`.
- `apps/server/src/infrastructure/questions/five-clues-bank.ts`: the pool
  composed from the existing banks, `drawFiveCluesCountry` by level and
  unplayed first, `fiveCluesLadderOf` in the room's language,
  `fiveCluesAnswerOf` for `gradeQuizGuess`; `flagFileOf` beside
  `countryTierOf`.
- Each rule seen red under a mutation.

**Done 18/11/2026.** What it settled beyond the plan:

- **147 countries survive**: 157 banked, Malta with no outline, Israel and
  Greenland with no capital row, Kuwait and Liberia with no city but the
  capital, and the five the size rule leaves out. 71 easy, 51 medium, 25 hard.
- **Ten ladders read by hand**, in French — Peru, Italy, Chile, Japan,
  Nepal, Mali, Belgium, Uruguay, Laos, Iceland. None is named by its first
  two clues: the region always leaves several neighbours of a like size
  standing (Peru's 34.2 M on 1.29 M km² beside Colombia and Venezuela, Mali's
  1.24 M km² beside Niger and Mauritania), and the smallest group a clue names
  holds four countries. No cities rung names its capital, and a test holds it
  for all 147: Peru climbs Cuzco, Arequipa, Trujillo to Lima, Belgium Anvers,
  Gand, Liège to Bruxelles. Venice and Kyoto make clue 4 easier than its 40
  says for Italy and Japan; that is the rung doing its job.
- **The kind and its settings arm wait for step 2**, as Think alike's did:
  `fiveclues` in `gameKinds` breaks every `Record` over it across the server
  and the app. No mode is added at all.
- **`mayGuess` takes no mode**: a `choice` seat never reaches a second clue
  still racing, so one guess per clue says both rules.

— cut here: plan written, protocol file, core rules and bank committed, tests green —

## Step 2 — the server (one session)

- `fiveclues` in `gameKinds`, **not** in `shelvedGames`; its arm of
  `settings.game` (`clueDurationMs`, the level), ten rounds by default,
  `typed` and `choice` its modes, `paysTheClock` and `playsDuels` decided in
  `game-capabilities.ts`, and `room-settings.ts`, `spaced-cycle.ts`,
  `ready-made-line-ups.ts` beside the others. The template is Think alike's
  serve commit, `git show --stat 9d39e61a`.
- `domain/round/five-clues-round.ts`: the content (the ladder held, the open
  clue index and its opening stamp on the round's own clock, the four
  shuffled names in `choice`), the guesses graded on arrival, the next clue
  opened by its timer or early, the round closed once settled, each seat
  paid by `pointsForClue` as it finds — the clock stopped by a pause.
- The views: the open clues alone, `nextClueAt`, each seat's own standing,
  everyone's `found on clue k` without the guess, the country at the reveal.
- `five-clues-game.test.ts`: no seat, console or wall frame carries a clue
  before it opens nor the country before the reveal, seen red with the guard
  removed; a second typed guess on one clue refused; a wrong pick out; the
  next clue opening early; the pay by clue; a latecomer refused
  `joined_mid_round`.

**Done 18/11/2026.** What it settled beyond the plan:

- **The settings arm carries `language` beside `clueDurationMs` and the
  level**: the cities, the capital, the four names and every typed answer
  are worded in one language for the table, like the quiz's.
- **The duel is allowed** (`playsDuels`): the shell's duel stamps two seats
  and the race waits on them alone, asking nothing of the game.
- **The console climbs blind**: `currentContent` is `{ kind: 'fiveclues' }`
  seated or not, since the server judges every answer and a console at the
  table is somebody's eyes. The wall reads the same round view as a seat.
- **No clue before the clock starts**: the countdown frames carry the four
  names and no clue, so nobody reads the size for three seconds the clock
  does not count.
- **The clue clock is the round's own**: `clueOpenedAtElapsedMs` on the
  round's elapsed clock, the open window being the round's open phase
  (`openPhaseDurationMs`), so a pause or the console away stops it with every
  other clock. The window running out opens the next clue on the instant it
  ended (`climbOnTime`); early, on the instant the last racing seat guessed.
- **The last clue settles early too**: `isRaceSettled` takes the open clue,
  and a typed seat that guessed on the last one is done — held until a next
  clue that never comes, it is out in all but name.
- **Paid at the close**, as every simultaneous round, by `pointsForClue`;
  `round.awards` ranks the found seats by clue then millisecond. A seat's
  verdict is the quiz's `single`.
- **Refusals**: a second guess on one clue, or a guess once found, is
  `already_buzzed`; a pick after a wrong one `player_locked_out`; a typed
  guess in a `choice` round `invalid_message`.
- **`five-clues-game.test.ts`**, eight cases, each seen red under a mutation:
  the whole ladder sent, the country sent before the reveal (both over every
  frame of a whole round's transcript, seat, wall and console, seated or
  not), `mayGuess` skipped, no early climb, a wrong pick kept racing, every
  seat paid as clue 1, `nextClueAt` running through a pause, a latecomer
  let in.

**`buzzer`, added 18/11/2026**, Adrien's word: three modes, as every game
that serves its own content (`SERVED_MODES`). What it settled beyond his
rules:

- **The shell's floor, nothing parallel**: `player.buzz`, `host.judge` with a
  `single` verdict, `answerWindowMs`, `activeBuzz`. The buzz stops the round's
  clock, which is the clue clock, so `nextClueAt` is `null` under the floor and
  the window's remainder comes back by itself; no deadline runs in `buzzed`, so
  no clue opens there.
- **The hold is the shell's lockout, cleared as a clue opens**: a miss or a
  floor run out writes the seat's `guessedOnClue` and puts it in
  `lockedOutPlayerIds`, which every screen already reads and the buzz refuses
  as `player_locked_out`; `openNextClue` empties it. Every seat still racing
  held on a clue opens the next one early, as in `typed`, and on the last
  closes the round. `host.clearLockouts` lets the held seats buzz again on the
  same clue.
- **A right buzz closes the round** through `closeRound`, so `payFiveClues`
  pays it by `pointsForClue` with every miss on the board at 0, the clock's
  tenth read off the round's clock stopped at the buzz's stamp.
- **The console's `currentContent.answer`** is `{ code, name }` in a `buzzer`
  round, seated or not — a seated console sits the round out
  (`isJudgedByHost`, held without new code) — and `null` in `typed` and
  `choice`. The wall's arm stays `{ kind }`.
- **`five-clues-game.test.ts`**, five more cases, each seen red under a
  mutation: the clock not stopped by the buzz, the hold never cleared or never
  set, the bonus measured to the verdict, a right buzz resuming the race, the
  console seated in the round, the country on a seat's round view.

— cut here: served by a settings frame, three modes, tests green, screens owed —

## Step 3 — the screens ✅ 19/11/2026

Direction B, _La montée_, picked by Adrien on 18/11/2026 from three drawn
pages: a ladder climbed a clue at a time. Two sessions built it.

- **The seat, the wall and the reveal** (`a9caa20a`): five rungs bottom up,
  a shut rung a socket, the open one paper ringed in the phase's ink with
  its window draining to `nextClueAt`, the climbed ones blue; a seat climbing
  with its own pawn and told where it stands; the wall's finders on their
  rungs and the crowd on the open one; the country on a green summit over
  the whole ladder at the reveal.
- **The floor** (`phase === 'buzzed'`): `VerdictPanel` keeps the ladder as its
  `stimulus` on the wall and the judging console, the window standing still.
  The judge reads the country (`currentContent.answer`) as the summit over
  the rungs, beside the two presses; in `typed` and `choice` the console
  climbs blind. The ladder drawn again under the floor, and once it is handed
  back after a lockout, keeps still (`isResumed`) — the clue does not land and
  the crowd does not hop a second time. Upright under 36rem of stage, the
  judge's console drops the ladder: the wall has it.
- **The setup**: the clue window (5, 10, 20 or 30 s), the level and the
  language, in the game's settings as the quiz's and think alike's.
- **The shelf**: `fiveclues` last in `shelvedGames`, its fir spine, its front
  door at `/fr/fiveclues` with a head in three languages, the host's language
  on a room opened there; Free-for-all deals it once in the table's language,
  and General knowledge plays it beside the flags quiz and the map.
- **The wall's reveal at 24 seats**: names while six or fewer found; past
  that, every finder a chip of rank, pawn and whole pay, the names left to
  the standings beside. A rung of finders never shrinks below its rows. Seen
  at 1280×720, 1920×1080 and 1080×1920 with 24 long names on one rung, spread
  over every rung, and a few: nothing outside its rung, no name cut, no
  scroll.
- **The seat's own pill hugs its pawn** — 23/11/2026: at seat size a finder
  is one column with no gap, so `[data-you]` no longer paints the hidden
  name's and pay's gaps beside the pawn.

## Step 4 — any subject, and clues that rule choices out ✅ 23/11/2026

Adrien, after a weekend of play: always countries, and a region clue that
excluded nothing. This step reshapes the round for any subject and lays the
decoys as the staircase above; handoff 10 writes the new subjects' content.

- **The ladder is five rungs of a union**, no longer a tuple: the country's
  rich kinds — `size`, `region`, `outline`, `cities`, `flag` — keep drawing as
  they did, and two kinds any subject can climb join them, `text` (one line in
  the room's language) and `image` (a photograph from `/pictures/` and its
  alt). The country stays one producer of that ladder, kept as variants
  rather than flattened into text, because a size printed in the screen's own
  locale and a region each screen names are worth keeping; the screens stay
  one code path, a switch on the rung's kind.
- **The answer is `{ name, subject }`**, no code: the name in the room's
  language, as the four choices print it. `subject` (`fiveCluesSubjects`,
  `country` alone until handoff 10) is on the round view from the first frame,
  where it labels the seat's field (`fiveclues.answer.country`) and says which
  glyph each shut rung shows (`RUNG_KINDS` in the ladder).
- **The server deals a card**, `drawFiveCluesCard`: the ladder, a
  `QuestionAnswer` — what typed is graded against, its three decoys what
  `choice` shows and what the near-miss guard keeps a slip away from — the
  played id and the subject. The round holds the subject where it held the
  country code. A country card is `fiveclues:PER` as before. A subject of its
  own writes, beside each rung, which decoy it strikes, and the bank test
  holds it to the staircase as it holds the countries.
- **Shape, measured at build**: `build-silhouette-bank.ts` writes each
  outline's elongation (the square root of its principal second moments'
  ratio) and compactness (its area over the disc of the same perimeter's)
  beside its file. Rebuilt on 23/11/2026: every file and decoy unchanged, the
  two numbers added. Chile's elongation is 11.3, Bolivia's 1.2.
- **Tests, each seen red once**: the staircase over every dealt country (the
  size step removed fails it), the anti-leak transcript with the reveal guard
  removed.

## How to tell it is done

Muted, with `MAX_PLAYERS_PER_ROOM` seats at phone width and a paired wall:
no screen holds a clue before it opens nor the country before the reveal;
the next clue opens the moment every seat still racing has guessed; a typed
seat is held until the next clue after a wrong guess and a wrong pick is out;
the reveal ranks the seats by the clue they found on, then the millisecond.
