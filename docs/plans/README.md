# The staged build

One file per stage, each scoped to a single session. Read the stage's plan
before starting, and update it when reality diverges — a plan that no longer
describes the code is worse than no plan.

A stage that has not started yet carries a **to do** row. That is a correction:
this table held nothing but `done` and `dropped` for as long as unstarted work
lived somewhere else, and a session opened it, read twenty-two closed rows and
concluded there was nothing left to do. There was.

**half done** is for a stage scoped to more than one session, where the first
has shipped and the rest has not. Its row says what landed and what is still
owed, because *in progress* would leave the next reader to open the plan to find
out whether anything is usable yet.

| Stage | State | What it delivers |
|---|---|---|
| [00 — Bootstrap](00-bootstrap.md) | **done** | Contract, server, lobby, QR, join, live roster, clock sync |
| [01 — Round engine](01-round-engine.md) | **done** | The server actually runs a round: pool, countdown, buzz, verdict, reveal |
| [02 — Host console](02-host-console.md) | **done** | Playlist picker, synchronised audio, the judging UI |
| [03 — Player round](03-player-round.md) | **done** | Countdown, a live buzzer, lockout, honest feedback |
| [04 — Reveal & scoreboard](04-reveal-scoreboard.md) | **done** | Reveal screen, running scores, end of game |
| [05 — Design pass](05-design-pass.md) | **done** | `/impeccable`: a visual world, motion, the real polish |
| [06 — Testing](06-testing.md) | **done** | Socket suites, the clock under skew, two Playwright journeys |
| [07 — Language & appearance](07-i18n.md) | **done** | English and French, light and dark, the corner menu |
| [08 — Deploy](08-deploy.md) | **done** | One origin serving both, somewhere friends can reach |
| [09 — Answer modes](09-answer-modes.md) | **done** | Four choices or a typed answer, everyone at once, scored by speed |
| [10 — Per-device audio](10-per-device-audio.md) | **dropped** | Audio stays on the host. See the plan for why, and what replaces it |
| [11 — The seam, and the buzzer](11-buzzer.md) | **done** | The split between the shelf and one game on it, and the second game that proves it: a buzzer the room supplies |
| [12 — Trivia](12-trivia.md) | **done** | A quiz through the seam, in all three modes, on 1 800 bundled French questions. The third game on the shelf |
| [13 — The room comes first](13-room-first.md) | **done** | A room is opened before the game is chosen: `settings.game` goes nullable, and the picker moves onto the lobby stage |
| [14 — Question languages](14-question-languages.md) | **done** | A second bank, 4 506 English questions, and the control that picks between them — defaulted to what the host reads, independent of it after |
| [15 — Room social](15-room-social.md) | **dropped** | A chat in the room, and public rooms with a directory. Both evaluated and declined; the file holds why, and the smaller thing worth building in each case |
| [17 — Mid-game join](17-mid-game-join.md) | **done** | A round stamps who it opened on and waits for those players alone, so a phone arriving mid-clip no longer holds it up. It kept the seat, the refusal and one screen saying *au prochain tour* |
| [18 — Reflex race](18-reflex-race.md) | done | The fifth game, and the cheapest: the screen flips, the first thumb wins. Session A served it — protocol, the false-start floor, the heat, `reflex-game.test.ts` — and it bought the **fifth guarantee**: the stimulus is a server timestamp every device schedules locally. Session B drew it: the field inverts at the flip (`data-flipped`, no seventh colour), the wait is the one screen in the product that never moves, and the reveal is a board of reaction times. It is on the shelf, and `shelvedGames` now equals `gameKinds` — which is a coincidence of today, not a rule |
| [19 — A URL per language](19-locale-urls.md) | done | `/fr` and `/en`, seven indexable pages prerendered into **fourteen** served documents, each with its own `lang`, `title`, `description`, `canonical`, `og:` and reciprocal `hreflang`. Two problems with one build step: it is also the only thing that touches the **83% of LCP spent waiting for JavaScript**, because the served `index.html` had nothing to paint. A second Vite build emits a Node bundle, `scripts/prerender.ts` writes the documents and a manifest, and Hono registers one route per URL from it. The plan said six pages and twelve documents and was already wrong by two — `reflex` had reached the shelf — so the build reads `shelvedGames` and `LOCALES` and a hardcoded list is what it refuses to keep. Head copy lives in `presentation/head/document-head.ts`, the one user-visible string outside the dictionary, which is the exception the i18n rule already carved. **Measured**: the documents are right and the scores are flat, because the first paint stopped waiting for React and now waits for three render-blocking stylesheets that arrive at 1 930 ms — 16 KB queued behind 550 KB of JavaScript and a 90 KB font. Inlining what the first paint needs is the whole remaining win and is not in this stage |
| [20 — A document that paints itself](20-critical-css.md) | done | The served page carries its own styles and its own theme, so nothing stands between the response and the screen. Every stylesheet a document's markup paints under is inlined into it — the entry's, its shared chunks' and its **lazy route's**, which was never linked at all and is why inlining only the three render-blocking sheets would have bought a better FCP and a worse page. A walk of Vite's manifest picks the set per route, so `host-console`'s 23 KB stays out of fourteen documents that never show it. The head then stamps `data-theme` from storage before the first paint, and flips the two `theme-color` tags with it. **Measured**: no render-blocking resource anywhere, and a throttled FCP of 2 224 → 1 044 ms. Taking the stylesheets off the path is also what exposed the fault underneath — the route fallback replacing the painted page for 600 ms, which `main.tsx` now waits out wherever the document already drew the screen |
| [21 — Questions the room has heard of](21-well-known-questions.md) | done | A quiz the host can hold to subjects everybody at the table knows, **in French as well as in English**. `isWellKnown` on all 8 355 banked rows — Open Trivia DB's own rating on the English half, and on the French one the sixty-day traffic its subject's Wikipedia article takes, which OpenQuizzDB's `wikipédia` field is what let the whole half be rated rather than only the 1 900 PolyFact rows carrying a Wikidata id. It leaves **1 652 French rows and 3 443 English ones**. The control is a **switch, not a level picker**, and that is the stage's whole finding: `drawQuestion` takes a category before it takes a question, so a level is only as good as the category it thins most, and thirds of the French bank leave *difficile* ten geography questions and five history ones. One threshold at two thousand views leaves the thinnest category fifty-three. Zero views is read as *not measured* rather than as obscurity, so those rows drop out of a filtered game instead of being promoted into its hardest end. `wellKnownOnly` sits on `QuestionDrawSettings` — one bank, one rating |
| [22 — The thin French subjects](22-thin-french-subjects.md) | **done** | All four thin French subjects hold an evening of their own: science **170 → 339**, geography 156 → **685**, history 64 → **516**, sport 123 → **390**, past the 300 the English half sits at — so the graded difficulty picker the blind test offers is buildable for the quiz for the first time, and the corpus floor no longer carries an exception. Three sessions rather than the two it was costed at. **Mintaka** moved three subjects and is the first source shipping no wrong answers, so `wikidata-kinds.ts` builds the decoys from entities Wikidata files under the same kind as the answer. A session of its own banked the **short-name spellings** — 769 rows take a second name, and *Lakers de Los Angeles* typed as *Lakers* now pays. **Vikidia** moved science alone: 265 wiki pages, a wikitext `<quiz>` parser, CC BY-SA 3.0. Two findings outlive the stage: **a corpus translated from English crowdwork fails by being false** (45 Mintaka rows), and **a wiki written by children fails by leaving its subject in the page title** — 373 of Vikidia's 566 banked rows were flagged, against 52 of Mintaka's 1 194. The 383 rows the wiki wrote with three candidates each took a fourth written by hand on 28 September 2026 — 356 banked, science **339 → 435** |
| [23 — The name a room shouts](23-the-name-a-room-shouts.md) | **done** | `accepted` filled from Wikidata, so typed mode stops refusing the name a table actually says. **PolyFact landed**: 864 of its 1 900 rows take a second name and 2 248 spellings, which doubles the bank's reach — 1 608 rows and 4 305 spellings against 744 and 2 057 — and it needed no new machine, only the answer's entity id, which `fact_id` had carried all along as its third segment. The decoy ids come the other way, through `option_ids`' positional alignment, because `withDecoysSpread` moves a decoy off the row whose ids held it. 836 of 3 084 aliases were refused and every one was a spelling the matcher already forgives. The invariant that a second spelling must never name the row's own decoy is now a corpus test over the shipped bank rather than a rule only the ingestion knew. **OpenQuizzDB was then measured and refused**, which is the stage's real finding: its answers resolve 68% of the time and that is a green light for nothing — 15% of the resolutions change concept through a silent redirect (*Double coeur* → *Microprocesseur multi-cœur*), and where the entity is right a common noun's aliases are its *neighbours*, so *Bleu* would pay a room that typed *turquoise*. The safe sliver is 120 rows of 2 132. **The rule that bought:** the pass transfers exactly where a source's answers are **named entities**, which is why it works on the two Wikidata-derived sources and nowhere else — and that alone drops Vikidia, whose answers are *À environ 400 km* and *des milliards de milliards*. **Open Trivia DB then landed, and the count is what decided it**: of 3 844 askable English answers 738 have no article, 693 are a redirect onto another concept — *July 4, 1776* onto *United States Declaration of Independence*, the OpenQuizzDB failure refused for free by comparing the landing title — and 1 338 of the 2 413 that reach an article of their own name pass the common-noun gate: **34.8%**, against the third this stage had set as its bar. That gate is Wikidata's own labelling convention, a proper noun capitalised where a common noun is not, plus the two classes it does not catch — 87 answers that are classes rather than things, 361 that are disambiguation pages. **1 048 of 4 506 rows now take a second spelling, 3 681 between them**, more rows than PolyFact's 864. `frenchAliasesOf` became `aliasesOf({ entityIds, language })` with one cache file per language. The finding that outlives the stage is that **the query service is not the database**: SPARQL is silent on Q9358's label and Q54173's `P31`, so labels are read from the action API and a missing `P31` is read as unknown rather than as evidence. The residual is the homonym, 13 rows — *Longclaw* is a sword and a beetle genus — left as measured, because a mislink yields a spelling no room types and the one that would cost is refused at ingestion |
| [24 — The chip that says what it gives](24-the-chip-that-says-what-it-gives.md) | **done** | `arts` was not a subject, it was the leftovers — films, television, animation, video games, music, books, comics, celebrities and the adult rubric on top, half the bank under the one chip whose name did not say what ticking it would give. `cinema` and `videogames` are split off it, eight subjects, `PROTOCOL_VERSION` 14 → **16**, because the category travels to a player. The data was already there: splitting a subject is **five fold tables to rewrite, not questions to find**. The windfall is Mintaka's `movies` and `videogames`, both left out on the written grounds that they *would deepen the two subjects that need nothing* — a reason that was `arts` being fat, and that retires for exactly two of its four unused categories. **They yield very differently for the same 2 500 raw rows and the gap is French Wikipedia traffic, not the fold**: 619 banked against 287, a studio being read about far less than a film — the projection said ~650 for the second and was wrong by more than half. It leaves **cinema fr 1 361 / en 704** and **videogames fr 808 / en 1 006**, `arts` at 1 253 and 740, every corpus floor clear, the bank at 11 097. `creator` stays in `arts` and is the fold's hard case: the relation says *who made a thing* and never *what kind*, so one sentence shape asks about Chandler Bing, Solid Snake and the Sistine Madonna. **Refused**: `music` (fr 84) and `books` (en 109). Two findings outlive the stage. The category list **is the draw's odds dial** — a category is drawn before a question, so screen subjects go from one round in six to three in eight. And the fold gives the strip **900px**, so eight labels have an 882px budget the old ones overran by 78: keeping both long labels and cutting only *Cinéma et séries* came to **883, over by one pixel**, so `cinema` and `everyday` were shortened on what the short form *costs* rather than what it saves, and the container query stays at 55rem. The alternative — a column of eight, 233px against 31, in a fold whose other controls are rows — was rendered before being refused |
| [25 — The slate](25-slate.md) | **done** | The sixth game: everyone fills a numbered sheet in private, the host collects and marks it item by item on the wall. Asked for as a chip tasting, kept because it is any tasting, any quiz on paper. **Session B drew it**: last on the shelf, a grid of numbered tiles that is both the navigator and the progress (sixty fit at 360px), one large field per number saving on a 600 ms debounce and on blur, a console that shows `12/26` and never a word, the key folded away, and a wall that marks one number at a time with one toggle per grouped answer. `correcting` wears the `buzzed` pair — the host judging — rather than falling back to the lobby's. **Session A served it**: `slate` in `gameKinds` (not yet `shelvedGames`), a `correcting` phase, `slate.write` plus five `host.*` frames — `host.judgeGroup` its own rather than `host.judge` taught an item index — the mid-round stamp taken at collection, answers grouped by the shared normalisation, scores recomputed on every verdict so a changed one moves the board, `PROTOCOL_VERSION` 17, and 12 socket tests including the anti-leak ones. **Owed by session B**: the four screens, both dictionaries beyond `slate.name` / `slate.scoring`, `shelvedGames`, the picker and shelf page, and the muted browser pass |
| [26 — Slate labels and early marking](26-slate-labels-and-early-marking.md) | **done** | Items get public labels (colours, letters), and the host closes and marks one item while the rest are still being written. **Session A served it**: `correcting` dropped for per-item `open`, `closed`, `marked` states inside `playing`, `host.closeItem`, `host.collectSheets` kept as *close everything still open*, a roster stamped per item at its closing so a latecomer is owed every open item, `settings.game.labels` (1–12 units, distinct over every position once folded), `PROTOCOL_VERSION` 18, six new socket tests. **Session B drew it**: a label editor in the lobby and beside the answer key, labels on every tile, field and wall, a console board of every item (outlined open, solid collected, faded marked) with one press to collect, a wall that steps through collected items to *Collect the rest* and then the scores, hatched and padlocked tiles on the sheet, the wall's item as a band above a sheet still being written, `data-marking` for the judged-buzz field, and `filledCounts` on the host arm (`PROTOCOL_VERSION` 19) |
| [27 — The wall](27-host-remote.md) | **done** | A screen the room reads beside the one in each hand: a third role, `wall`, that shows the game, plays the clip and holds no answer, no control and no seat. Asked as a *remote* for the host and turned around while it was planned — the console already runs on a phone, so what was missing was the display. **Session A served it**: `wall` in `connectionRoles`, its own view and message union (`wallRoomViewSchema` has no field for `track`, `question` or `keys`), admission on the room's token alone (`wall_not_paired`), `isWallConnected` on the host view, pairing over three HTTP routes where the host's device vouches for a code the waiting screen shows, `PROTOCOL_VERSION` 22, and `wall.test.ts` — anti-leak over the whole transcript in three games, broken on purpose. **Session B drew it**: `/wall` shows a code and a square, `/pair/:code` confirms it from the host's screen, the console menu pairs by typing the code or opens the wall in a new tab; the wall is the console's own stage with `controls: null`, plays the clip and silences the console while it is there, and after five seconds without a console offers *keep the table from here* — a console that folds the answer and steps back when the host returns. The `/invite` poster was removed on the argument that the wall's lobby was it, and restored: the lobby draws the game and the table too, and a crowd joining off a giant screen wants the code and the square alone |
| [28 — One Durable Object per room](28-cloudflare.md) | **done** — deployed from CI to `taverla.adrienlcp.workers.dev`; the Render service is deleted | Off Render's free instance onto Cloudflare: one Worker serving the assets, one Durable Object per room with its state in storage and its timers as alarms — no cold start, no party lost to a deploy. Three sessions: the room engine on Node, the Worker beside Render, the cutover |
| [29 — A new UI, from zero](29-redesign.md) | **done** | A replacement visual world for every screen, briefed as an `/impeccable` prompt and built as a game box on the table: a matte printed board, die-cut pieces, paper cards, a pawn per seat, a spine per game and a score track around the console, documented in `apps/game/DESIGN.md`. One hard constraint: the question and its four choices are visible with no scroll on every viewport and ratio, proven by a Playwright check over sixteen sizes against the bank's longest prompt (192 chars) and choice (275) |
| [30 — Taverne](30-taverne.md) | **dropped** | A second visual world, the back room of a village tavern on games night: chalk on slate, beer mats, coasters on the counter, the bell as the buzz. Built whole on the `taverne` branch from 2026-10-05, then dropped by Adrien on 2026-10-10: `main` keeps the stage-29 box. What the branch carried besides the look — settings that move mid-round, the hold and volume in the setup fold, the doors greyed out while a room opens, the binary `.gitattributes` — landed on `main`; the branch is deleted |
| [31 — Play right away](31-play-right-away.md) | **done** | A second door beside *Open a table* on every game a host can play in: one press opens the table, seats whoever pressed under the remembered name and starts round 1, with no lobby on the way and no protocol change — the intent rides history state and is spent once. The empty lobby's launch does the same until somebody sits down, the seated host's tiles carry an *Invite* piece, and an arrival mid-game is said on the console. Not called *solo*: the table stays open |
| [32 — Quotes](32-quotes.md) | **done** | A ninth quiz chip, *Citations* / *Quotes*: a line from a film, a series, a video game, an ad or a real person, and the room names where it comes from. A rubric rather than a game, because everything but the content is the quiz's; 457 French lines and 548 English ones, written by hand, checked against Wikiquote and read into the bank build |
| [33 — Questions a French table knows](33-questions-a-french-table-knows.md) | **done** | *Rester grand public* stops dealing American evenings in French. A seeded sample read row by row found PolyFact mostly obscure and Mintaka's sport fourteen-in-eighteen American, and French traffic unable to tell either apart; every PolyFact row and every Mintaka sport row loses `isWellKnown`, 732 rows, none dropped. A second session read every Vikidia row and every well-known Mintaka row outside sport: 170 dropped, 354 repaired, 512 demoted through `not-well-known-questions.json`; well-known French 4 112 → 3 440. A third session read all 3 883 well-known English rows and demoted 1 922, judging cinema and video games by a casual viewer or player |
| [34 — The evening](34-the-evening/README.md) | **done** 21/10/2026 — every step, a → i and h1 → h6; every decision in its `open-decisions.md` settled | Gamenight folded into the shelf: teams as a shell setting every game scores through, a line-up of games drawn round by round, team turns, the world map with a movable marker judged in km on the server, and pawns on a board around the round on the wall. A folder rather than a file: a comparison, the product model, open decisions and seven steps, the December cut being a to g |
| [35 — Inner clock](35-inner-clock.md) | **done** 21/10/2026 | The eighth game: the wall says *count to 42 in your head*, nothing on any screen moves, each player presses once, and the server pays the gap to the target — 3 points on the dot, nothing a quarter of the count away, the round capped where a press could only pay nothing. The count is drawn 20–60 s per round unless the host types one. The player view carries no press, not even the reader's own time, until the reveal; latency is left uncompensated because it is noise under a counting error of seconds |
| [36 — Matchsticks](36-matchsticks.md) | **done** | An equation drawn in matchsticks that one moved stick makes true, or a number one moved stick makes the biggest or the smallest it can be — dealt and solved by the server, so no bank. The ninth game, played two ways: every screen drags or presses any stick onto any empty groove (pointer, finger or keyboard, through a react-aria toolbar over the drawing), never refused — sticks that read as nothing answer nothing — and judged and paid 3, 2, 1 by `placesFromBest` with the clock on top; or the first to buzz says the move and the host judges. The reveal draws every seat's move on its chip beside the solution travelling into place |
| [37 — Flags](37-flags.md) | **done** 21/10/2026 | A tenth quiz chip rather than a game: a flag on every screen, the room names the country, four choices or typed. 229 flags from `flag-icons` served under names taken from their content so no frame names the country, decoys from look-alike groups then the nearest countries, 77 well known for the quiz's switch |
| [38 — Timeline](38-timeline.md) | **done** 21/10/2026 | The tenth game, on the shelf: five dated events each player orders on their own screen, by dragging a card or stepping it with its arrows, and the reveal strings them along a line with their years. A 214-event bank written in both languages, an answer mode of its own (`order`), paid by the pairs swapped |
| [39 — Emoji rebus](39-emoji-rebus.md) | **done** 21/10/2026 | An eleventh quiz chip rather than a game: a film, series, song or saying written in emojis, drawn large on every screen, the room names it in either mode. Hand-written lists in each language, every emoji from Unicode 12 with no flag so every phone draws the same rebus |
| [40 — A line-up of variants](40-line-up-of-variants.md) | **done** 21/10/2026 | The host ticks variants, not only games — two blind tests on different sources, a quiz held to one subject — each drawn round by round. `settings.lineUp` holds whole game arms and `lineUpAt` points at the one `game` was opened from; the server writes `game` back into it on every frame, so the fold edits the variant. Names are generated, never typed; presets still tick kinds |
| [41 — One table](41-one-table.md) | **done** 23/10/2026 | Home opens one table and nothing else: the preset and its name go, the host ticks one game or several, and teams, a board and a judge are three switches that no longer depend on each other. A board without teams is a pawn per seat; one ticked game plays as it did before the game night |
| [42 — A prepared evening](42-a-prepared-evening.md) | **done** 23/10/2026 | The evening becomes a deck of rounds: the host prepares one, four or all of them — each a game with its options and its content — the rest is drawn, every entry plays at least once, a prepared one exactly once, and a round not yet played stays editable. A round nobody prepared can be skipped, and *In order* turns the list into a running order dragged into place, chance rounds included |
| [43 — Host controls](43-host-controls.md) | **done** | The room's screen never shows a control: the host's live in one side panel on a screen only the host sees, a phone can take the console over and leave the computer as the wall, and the *This screen is the room's* switch goes. Every game already plays on phones alone, save a duel's spectators |
| [44 — Ready-made challenges](44-ready-made-challenges.md) | **done** | A challenge round left empty is dealt a line from a bilingual bank of 89 — *bring back something red* — instead of drawing *untitled*; a console that only runs the room picks from a hand of three, its own lines written ahead first, or says the line aloud, while a seated one keeps one line and the die. Every line is one object to fetch, found at home as at the office: lines played out loud were noise the host could not place, so the categories, the festive switch and the deal's *vary from the last* went with them. *Starts with {letter}* takes a letter drawn as it is dealt. Content for an existing game, not a new one |
| [45 — Guess nine](45-guess-nine.md) | **done** | *Devineuf*: a theme, nine hidden answers paid by obscurity, one black word that cuts and voids the round. Typed on every screen and judged by the server, or spoken, one team guessing while a seat of another keeps the list. Four sessions and a half: bank, server, screens, spoken mode, then *Nobody else had it*. **Landed**: the bank, 154 themes with every black word read by hand; the server in typed mode — a fifth verdict shape, `cells`, no speed bonus, the grid withheld from a seated console; and the screens, on the shelf as the eleventh game — the 3 × 3 sheet, the black word as an ink piece, the room's gauge and the reveal, each seat's own lines read back by the server (`yourLines`); and the spoken mode, *Team by team* — a guessing team and a keeper of another drawn each round, the list to the keeper alone, `guessnine.tick`; and *Nobody else had it*, a switch doubling a cell one seat alone found, an ink *×2* in its pips' place on the reveal |
| [46 — Straight into the room](46-straight-into-the-room.md) | **done** | A spine on the home shelf opens a room on its game instead of its page, and a game page keeps one door, *Open a table*, with no nickname field. The strip beside the console's panel was the root's reserved scrollbar gutter: on a desk the document no longer scrolls, the stage scrolls in its own column, and paper paints its own scrollbar. One session |
| [47 — Which screen does what](47-which-screen-does-what.md) | **done** | A room with no wall draws the whole board on every phone's reveal, the console's side panel gains a *Room* tab saying what each screen does — never that a second one is needed — and the board's shape follows its case size: a line, a U, a closed loop. **Landed**: the whole board on a player's reveal when no wall is there; the *Room* tab, with `host.dismissWall` to let a wall go; one shape rule (`trackShapeFor`) for the wall's track and a wide console with no wall |
| [48 — Capitals](48-capitals.md) | **done** | Guess nine has 13 capital themes — every continent, six subregions, the neighbours of France and the countries whose capital is not their largest city — the black word the big city taken for the capital (Zurich, Casablanca, New York, Istanbul), and a seat banks its capital’s cell. The map places world capitals, 155 of them, the country hidden until the reveal. The bank is built: 194 states, 154 capitals well known in French, up to five largest other cities each — asked as cities and as municipalities, since Seville and Sfax are filed only as the latter. The quiz has its twelfth chip, *Capitales*: 191 states in each language, the bank’s own 66 capital questions folded into it. Capitals across three games from one server-side bank (names, aliases, point, largest other cities, M49 subregion per state): a capitals chip in the quiz with the country's own big cities as decoys, world capitals on the map priced 3/2/1 under 100/300/1 000 km, and guess nine themes per continent and subregion whose black word is the city taken for the capital |
| [49 — Saved evenings](49-saved-evenings.md) | **done** 25/10/2026 | A host keeps the evening under a name — entries with their settings, round count and order — and runs it again from the lobby; an entry whose settings no longer read keeps its game. The line-up's cap goes from 12 to 30 entries |
| [50 — Petit Bac](50-petit-bac.md) | **done** | The twelfth game and the first submit-then-vote: a letter, three to ten categories, every screen fills its sheet until the clock or a full sheet's stop, then the room votes category by category and an answer nobody else wrote pays double. **Landed**: the protocol primitives and the core rules — the letter draw, the article rule, the vote's strict majority, the pay — and `answer-groups` moved to the shell as its second case; then the server, reachable by a settings frame — the sheets, the stop and its grace, the vote, the judge's refusals, the pay — with every seat's word kept off every other screen until its category is voted; then the screens — the seat's sheet and vote, the wall, the console's setup, cancelled stop and judge, the reveal grid — and the shelf, the twelfth game, its door and an *Aa* spine distinct from Guess nine's grid |

## Order, and what can move

01 → 02 → 03 → 04 is a real dependency chain: each needs the protocol and server
behaviour the previous one adds. 05 through 08 are independent of each other and
can be taken in any order once 04 lands — though running the design pass before
the screens exist wastes it.

09 and 10 are the first stages added after the game shipped, from playing it
rather than from planning it. 09 is much the larger: it is the first thing that
breaks the assumption that exactly one player acts at a time.

11 is the first stage that is not about the blind test. Its front half — the
seam between the shelf and one game on it — is the one piece that had to wait
for a second game to exist, because inventing the shared shape before there are
two cases to measure it against is the abstraction anti-pattern with a different
hat on. Both halves have landed, and the second one is what corrected the first:
five settings called "what every game needs" turned out to be three.

**Read the divergences at the end of [11](11-buzzer.md) before trusting a detail
written earlier in that file.** The second game corrected the first half in four
places, which is what a second case is for — and the same caution applies to
every plan here: a stage file is what was decided *then*, corrected in place
when a later stage disagreed.

11 and 12 were one file until the second game turned out not to be the quiz. A
bare buzzer serves no content at all, which makes it both the cheapest game on
the shelf and the sharpest test of the seam: it is the one that disagrees with
what "every game needs". Trivia is a whole content question on top of a shape
the buzzer will already have proved, so it goes second.

07 was taken first, out of order and deliberately: routing strings and colours
through a layer costs an afternoon before a design pass and a rewrite after one.
Everything built from here reads its strings from
`presentation/i18n/` and its colours from `--tokens`, in both themes.

## Work that is not a stage

Playing the game produced a round of shell revision that belongs to no stage:
the corner menu replacing the preferences footer, the recovery screen a dead
socket now shows, desktop layouts for the two screens that were still phone
shaped, the room-code copy, a design pass on the form controls, the lobby
controls for the three settings the protocol always carried, and a host's setup
surviving the room it was made in. It is
recorded where it will be read — [`apps/game/DESIGN.md`](../../apps/game/DESIGN.md)
for the materials and the icon family,
[`.claude/rules/design-system.md`](../../.claude/rules/design-system.md) and
[`component-shape.md`](../component-shape.md) for the rules that came out of it,
and the changelog for the list.

The typed mode's rework is the largest of these so far, and it came from the
same place: one field instead of two, as many guesses as the clip allows, and a
matcher that finds each half *inside* a line. Two fields asked a player to know
which half they were holding before they could say it, and one guess per round
made a near-miss the end of it. None of that was visible until a room typed into
it.

A third: the large screen. Both front doors were a 620px column at every width
while the type scaled with the viewport, and the host's console had no maximum at
all — so one read as a phone screenshot enlarged and the other sprawled across a
21:9 display. It landed in two passes, and the second is the one worth having:
bounding the field and widening the column only stopped the page being wrong,
where splitting the front doors into a poster past 1 200px is what the width is
actually *for*. Recorded in [`apps/game/DESIGN.md`](../../apps/game/DESIGN.md),
where the rules that fell out of the ceiling are worth more than the ceiling.

Two more before it: the i18n layer learning what a count does to a sentence — a
scoreline that read "1 POINTS" in both languages was the visible half — and the
settings moving into the host's footer, reachable for as long as the game runs.
The second came with the rule underneath it, `reshapesRound`: three settings the
round in play is built on, refused by the server until it ends. Both are the
same lesson as the typed rework, that what is *wrong* surfaces by playing.

One came from a question rather than from a room: *what happens if a second
browser opens the host URL?* Two tabs of one profile are both let in on
purpose — it is what lets a socket be torn down and reopened without the room
noticing — and nothing below that ever asked how many consoles were left.
Closing one froze the round for the other, opening one rewound its clock, and a
browser refused at the door kept a seat it had never been given.
`second-console.test.ts` is the suite that did not exist, and the lesson runs
the other way from the ones above: a rule written for *the* host breaks the day
there are two of them.

The same question asked once more — *and which of the two owns the room?* — is
what closed the last open decision this raised. A room now
mints a token for the screen that opened it, and a claim carrying it beats
whatever is connected; without one, a second console waits out a minute's grace
before the code alone is enough. What that session is worth remembering for is
where it was caught: the token was first kept on the host seat, everything was
green, and it took *driving two consoles in a browser* to see that the refusal
which displaces a console also voids the seat — so being taken over deleted the
one thing that could undo it.

Expect more of this than of stages. The plans cover what is missing; what is
*wrong* surfaces by playing.

The first playtest with somebody who had not built it — 14 August 2026, two
people, an iPhone and a laptop — produced thirteen notes in one evening, which
is more than any stage has. They were diagnosed and split into nine sessions,
and **all nine landed on 15 August 2026**.

What that day is worth remembering for is how much of it the diagnosis got
wrong, and in which direction:

- **Two of the three "faults" in the bank were not faults.** `Brasil` is the
  Portuguese word the question asks for and `Thwimps` is what tiny Thwomps are
  called; the audit that reported them was measuring a near miss. The real fault
  was one layer down and far larger — the *matcher* was forgiving its way onto
  the answer a question called wrong, on ninety numeric rows and two hundred
  spelling quizzes.
- **The browser pass caught what no build could, three times**: a caption folded
  onto itself by a `letter-spacing` inherited as a computed length, every
  nickname on the phone's final board printed as one letter, and a console that
  reloads mid-round playing the rest of the game in silence — that last one
  *visually identical* to a round that plays.
- **The e2e caught the one thing the browser pass could not**: a name appearing
  in two lists at once, which reads fine and breaks a locator.

Expect the same ratio next time. A note from a room is evidence that something
is wrong; it is rarely evidence of what.

**The second playtest — 16 August 2026, on Android — proved that in one
evening.** Eight notes, diagnosed into one session each, and **two of the eight
were reports of things that already work**: the speed bonus shipped the day
before is wired into
every simultaneous round, and a seated host is still sent the clip it thinks it
is being denied. In both cases something *is* wrong — the bonus is on no screen
the room looks at, and the console cannot say why it failed to arm — but neither
is the thing the note named. The second one was sent the wrong way by this
repository's own documentation, which said the server "stops sending the track"
to a seated host when it withholds only the title and artist.

## Beyond the blind test

This game is the first of several. [`docs/game-catalogue.md`](../game-catalogue.md)
holds the candidates, the five shapes they fall into, and — more usefully — the
seams in the current code that should stay open, with the honest cost of each.
It is a map, not a stage: nothing there is scheduled, and the blind test ships
whole first.

## The shape of a stage

Every plan states its goal, the protocol changes it needs, the files it touches,
the decisions left open for the session, and — most importantly — **how to tell
it is done**. That last section is the contract: a stage is finished when its
criteria are demonstrated, in a browser where the change is visible, not when
the code compiles.

## Conventions that apply to every stage

- `pnpm validate` before declaring anything working
- A new rule in `packages/core` arrives with a test, and the test is broken on
  purpose once to prove it can fail
- A UI change is verified by driving the real app. Note what
  [06](06-testing.md) deliberately did *not* buy: no component runner exists
  here, so a claim about a single screen still rests on a browser pass
- A stage leaves no message unserved. The `not_implemented` code that used to
  cover one is gone — see [`../realtime-protocol.md`](../realtime-protocol.md)
| [51 — Who plays](51-who-plays.md) | **done** — step 1: a seated host sits out the rounds it judges, seat and score kept; step 2: `hasJudge` and the judge switch gone, Petit Bac always the room's vote; step 3: one press on home, the seat offered in the lobby roster, a seated console told it judges without playing | Playing is joining: no seat switch on home, no judge switch; a seated host sits out the rounds it must judge and keeps its score |
| [52 — Black square and Atlas](52-black-square-and-atlas.md) | **done** 26/10/2026 — step 1 3–9 answers, one tier a row; step 2 `direction`, `places` a set, the name round on every screen; step 3 the ids `blacksquare` and `atlas`, old ones read from storage and redirected in the URL | Black square deals 3–9 answers; the map names what it shows as well as placing what it names |
| [53 — Black square audit](53-black-square-audit.md) | **to do** | A simple theme, hard answers: the specialist themes cut by a census (views cannot judge a theme), answers ranked on a year of views, the 3-point cells drawn from further down the list |
| [54 — Swatch](54-swatch.md) | **done** 29/10/2026 — hex on the wire, OKLab distance, the pay curve and the draw in `@melee/core/swatch/`; the kind served end to end with its socket suite; then the shelf, the paint chip, the picker, the reveal nearest first and the setup, seen on a wall, a seated console and two phones | A colour shown a few seconds then rebuilt on a picker, paid by how far it looks from the one shown |
| [55 — The chance pool](55-chance-pool.md) | **done** 29/10/2026 — `lineUpDeals` on the wire, dealt and refused by core and server, carried by saved evenings; the draw page from the dice row; saving over a kept line-up | The host chooses which games, with which settings, the rounds past the planned ones are drawn among — a game may sit in the draw without a planned row |
| [56 — Most likely](56-most-likely.md) | **done** | A line about a person, never a moment; every seat votes for a seat, the room's choice is revealed as a tally, and the ballots that went with it are paid |
| [57 — Silhouettes](57-silhouettes.md) | **done** 29/10/2026 | A quiz rubric beside flags and capitals: a country's outline alone, drawn once from the atlas topology, named by the quiz's four names, a field or a buzz |
| [58 — Estimate](58-estimate.md) | **done** 29/10/2026 — on the shelf as *Close enough* | *Le juste chiffre*: a question whose answer is a number, every seat types an estimate, paid 3, 2, 1 by ratio to the truth, nothing beyond a factor of ten. Step 1 banked 4 578 quantities (980 well known) from Wikidata and wrote the `number` verdict and its place pay |
| [59 — Higher or lower](59-higher-lower.md) | **done** 29/10/2026 — served, then on the shelf: two tiles a pair, the wall's list, the reveal with every seat's pawn | Five pairs of one family from 58's quantity bank, one pick each, the values held back until the reveal |
