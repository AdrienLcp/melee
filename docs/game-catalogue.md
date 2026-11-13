# The catalogue beyond the blind test

The blind test is the first game, not the product. The product is a room full
of screens pointed at one of them, and the blind test is what that room does
first. This file was written so the decisions taken while finishing it would not
have to be undone when the second game arrived.

Four have arrived since, and the seams held. What follows is still a map rather
than a schedule: the shapes below, the honest cost of each, and — the part worth
re-reading — which seams are open and which were deliberately left welded.

## What the shell already is

Ignore the word "blindtest" in the package names for a moment and the bootstrap
reads as a generic party-game platform:

| Piece                            | What it is, generically                              |
| -------------------------------- | ---------------------------------------------------- |
| Room + 4-character code          | A joinable session with a code humans can read aloud |
| Host / player socket roles       | One screen running the room, N players               |
| Session id in `localStorage`     | A seat that survives a screen lock                   |
| Role-scoped message unions       | **Hidden information, enforced by the compiler**     |
| `encodeChecked`                  | The runtime half of that: Zod strips what leaked     |
| Server-stamped arrival order     | **Who was first**, unforgeable                       |
| Clock handshake                  | Countdowns that land together on every device        |
| Whole-snapshot broadcast         | No client ever holds half a state                    |
| Roster, scores, connection state | The lobby every game needs                           |
| i18n dictionaries, theme         | Shell-level, already namespaced                      |

Two of those are worth more than the rest. **Role-scoped views** are the
mechanism behind every hidden-information game, not a blind-test detail — a
werewolf's identity and a track's title are the same problem. **Server-stamped
order** is the mechanism behind every race.

## The five shapes

Almost every party game worth building is one of these. The shape, not the
theme, is what costs work.

**1. Buzz-first.** A stimulus on the console, the first press wins, the host
judges. _This is the shape the current engine already implements._ A second game
of this shape is close to free.

**2. Submit-then-vote.** Every player types something, the screen reveals the
answers, everyone votes. Needs a collection phase with a deadline, a reveal that
does not leak authorship, and a vote tally. **This is the biggest reusable thing
missing** — six of the games below want it, which is most of what remains
behind one engine that does not exist yet.

The first game of this shape builds its board and tally inside its own arm of
`round.content` and its own directory of `@melee/core`, not as a shared
engine. Generalising before there are two cases is the anti-pattern this file
names three times — the second game is what earns the shared shape, and it is
the one that shows which half was the first game's alone.

**3. Hidden role.** Each player gets a private payload, then discussion, then a
vote. Needs per-player private state (the role-scoped views are half of it) and
a phase machine with day/night.

**4. Continuous stream.** A player streams strokes or motion to the screen at
30–60 Hz. **The only shape that breaks "state travels as a whole snapshot"** —
see the warning below.

**5. Team relay.** Two teams, a turn timer, one device passed around. Needs a
team on the player model and a turn owner.

## The catalogue

| Game                                                                                                                                         | Shape                                     | What it needs that does not exist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Appetite                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Blind test**                                                                                                                               | Buzz-first                                | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | **shipped**                                                                  |
| **Buzzer** — the room brings its own content                                                                                                 | Buzz-first                                | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | **shipped** ([stage 11](plans/11-buzzer.md))                                 |
| **Quiz / trivia**                                                                                                                            | Buzz-first                                | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | **shipped** ([12](plans/12-trivia.md), [14](plans/14-question-languages.md)) |
| **Lyrics blackout** — the line is missing, sing it                                                                                           | Buzz-first                                | Same as the blind test, different reveal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | a session                                                                    |
| **Reflex race** — first to press when the screen flips                                                                                       | Buzz-first                                | It needed one thing after all: a fair stimulus                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **shipped** ([stage 18](plans/18-reflex-race.md))                            |
| **Inner clock** — count in your head, press once                                                                                             | Buzz-first                                | Nothing: a press stamped on arrival, paid by its gap to the target                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **shipped** ([stage 35](plans/35-inner-clock.md))                            |
| **Matchsticks** — one stick to move                                                                                                          | Everyone at once, or buzz-first           | A mode of its own, `move`, judged by the server against every one-stick move; on the buzzer the host judges                                                                                                                                                                                                                                                                                                                                                                                                                      | **shipped** ([stage 36](plans/36-matchsticks.md))                            |
| **Timeline** (_Before & after_ on screen: _Timeline_ is a published card game's title) — five dated events, put them in order                | Everyone at once                          | An answer that is an order: a mode of its own, `order`, and a verdict counting the pairs swapped                                                                                                                                                                                                                                                                                                                                                                                                                                 | **shipped** ([stage 38](plans/38-timeline.md))                               |
| **Black square** (Case noire) — a theme, three to nine answers dealt from a pool, one black word                                             | Everyone at once, or spoken with a keeper | Many guesses per round, a hit banked without closing it; spoken, the one seat ever sent an answer, safe because its team is not playing                                                                                                                                                                                                                                                                                                                                                                                          | typed on the shelf, spoken owed ([stage 45](plans/45-guess-nine.md))         |
| **Petit Bac** — a letter, six categories, type fast                                                                                          | Submit-then-vote                          | Scoring by uniqueness, a room vote per category                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | rules landed, server and screens owed ([stage 50](plans/50-petit-bac.md))    |
| **Just One** — everyone writes one clue, duplicates cancel                                                                                   | Submit-then-vote                          | A clue-collision pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | a session                                                                    |
| **Le curseur** (Wavelength) — a spectrum, a secret target, one clue                                                                          | Submit-then-vote                          | A shared slider; the target is hidden from all but one                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | two sessions                                                                 |
| **Undercover** — same secret word for everyone but one                                                                                       | Hidden role                               | Per-player payloads, a talk phase, a vote                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | two sessions                                                                 |
| **Loup-garou** — the full night/day machine                                                                                                  | Hidden role                               | Phase machine, timers, a narrator screen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | the biggest on this list                                                     |
| **Deux vérités, un mensonge**                                                                                                                | Hidden role                               | Light: submit three, everyone votes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | a session                                                                    |
| **Qui est le plus susceptible de…** — stage [56](plans/56-most-likely.md)                                                                    | Submit-then-vote                          | Voting for a _player_ rather than an answer: a `player.answer` arm naming a seat, mode `vote`, paid at the close by the room's choice since a grade at answer time cannot know the majority. Counts are revealed, never who voted for whom                                                                                                                                                                                                                                                                                       | shelved                                                                      |
| **Dessine** (Skribbl) — one draws, the others guess                                                                                          | Continuous stream                         | A stroke channel, a canvas, a word list                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | two sessions, and read the warning                                           |
| **Time's Up** — three rounds, same cards, less and less speech                                                                               | Team relay                                | Teams, turn owner, per-turn timer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | two sessions                                                                 |
| **Bingo de soirée** — a grid of things that will happen tonight                                                                              | Submit-then-vote                          | Almost nothing; grids and presses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | an evening                                                                   |
| **Colour memory** — a colour shown a few seconds, then rebuilt on a picker — stage [54](plans/54-swatch.md)                                  | Everyone at once                          | A mode of its own, `colour`, paid by perceptual distance (OKLab) computed in core; the picker is react-aria's `ColorArea` + `ColorSlider`, no new library. Owes a rule: the colour _is_ sent to every screen before it hides, so it is shown on the wall when there is one, and a phone keeping it is no worse than a photo of it. A second rubric, _a character's colour_ (Shrek, the Pink Panther), is a text-only bank of name → colour, no images and so no rights, but every row's colour is an argument and is set by hand | a session for the game, a second for the character bank                      |
| **Le juste chiffre** — a number to estimate — stage [58](plans/58-estimate.md)                                                               | Everyone at once                          | A mode of its own, `number`, paid by its own ratio to the truth, never by place; a quantity bank built from Wikidata                                                                                                                                                                                                                                                                                                                                                                                                             | served                                                                       |
| **Plus ou moins** — one famous pair a round, which is higher — stage [59](plans/59-higher-lower.md)                                          | Everyone at once                          | Nothing but 58's bank, paired within a family; one pick a round, a mode of its own, `pairs`                                                                                                                                                                                                                                                                                                                                                                                                                                      | shelved                                                                      |
| **Mot mystère** — a hidden word, six tries coloured letter by letter — stage [66](plans/66-mystery-word.md)                                  | Everyone at once                          | A dictionary per language shared with 67, a mode of its own, `word`, retried until found or six tries spent; the grids travel as colours alone                                                                                                                                                                                                                                                                                                                                                                                   | shelved                                                                      |
| **Mot le plus long** — nine letters, the longest word they make — stage [67](plans/67-longest-word.md)                                       | Everyone at once                          | 66's dictionary and its familiar mark; a mode of its own, `letters`, many words a seat and the longest kept, paid against the draw's longest; every seat's length public, its word hidden                                                                                                                                                                                                                                                                                                                                        | shelved                                                                      |
| **Le compte est bon** — six tiles, one target, a calculation — stage [69](plans/69-make-the-number.md)                                       | Everyone at once                          | A draw and its solver in core, no bank; a mode of its own, `calculation`, built by tapping and checked by the server, many a seat and the nearest kept; every seat's value public, its working hidden                                                                                                                                                                                                                                                                                                                            | shelved                                                                      |
| **Pense comme la table** (_Great minds_) — a prompt, one answer each, paid for thinking like the table — stage [70](plans/70-think-alike.md) | Everyone at once                          | One answer a seat paid at the close against every other, as the estimate is; a mode of its own, `match`; Petit Bac's grouping with a plural fold, the console merging two groups at the reveal; every answer hidden until the close                                                                                                                                                                                                                                                                                              | step 2                                                                       |
| **Silhouettes** — a country's outline — stage [57](plans/57-silhouettes.md)                                                                  | Buzz-first, a quiz rubric                 | Nothing: a third rubric beside flags and capitals, outlines drawn once from the atlas topology                                                                                                                                                                                                                                                                                                                                                                                                                                   | **shipped**                                                                  |

Submit-then-vote is the shape that unlocks the most: six games share it. Their
appetites assume the engine exists, so the first of them also pays for it, and
every one after is a session rather than two plus an engine.

**Reflex race was costed as the cheapest, and the estimate was wrong in an
instructive way.** "Almost nothing; it _is_ the buzz" was true of everything
this table measures — no catalogue, no bank, no new phase, no new shape. What it
missed is that a buzz answers _who arrived first_ and a reflex race asks _who
reacted fastest_, and the gap between those two is the room's Wi-Fi. Costing it
by what it reuses could not see that, because the thing it needed was not a
feature but a **guarantee**: the stimulus has to happen on each device against
its own clock estimate, defended by a floor rather than by secrecy. That is now
the fifth entry in `docs/realtime-protocol.md`, and the next reflex-shaped game
inherits it.

The lesson for the rest of this table: this column costs _parts_, and a game can
still owe a rule. Ask what a game **measures** before trusting its appetite.

## The quiz, costed — and it needs no database

The instinct is that a quiz needs a question bank, a bank needs storage, and
storage means a database. The first two are true and the third is not: a few
hundred questions are a **file in git**, reviewed in a merge request, loaded
into memory on the first draw. Rooms were held in memory on the same argument until a deploy ending every party in progress outweighed it — see stage 28.

A database only becomes the answer when questions are **written from inside the
app** — a host composing their own pack on their phone. That is a feature, not
a prerequisite, and it is the one that should be allowed to force the decision.

### Where a question would slot in

The blind test's source picker is the template, and it is more reusable than it
looks. `TrackSource` is `catalogue | playlist | search` — three ways to fill one
pool, chosen in the lobby, committed by the launch. The catalogue is the strands
the product curates — genre charts, decades, film scores — ticked together, each
filtered on its own rules and weighed against the thinnest before they meet —
film at 0.4 of a share, so it is a round in six — which is
also why a round, not the settings, says whether it asks for the film. One
strand is drawn whole; two or more are sampled, a few decade playlists and a few
composers, so a mix costs Deezer what one strand does. It replaced four arms
(`all`, `chart`, `decade`, `film`, protocol 67): `all` had been the strip with
nothing pressed, and nobody reads an empty strip as _everything_, so the mix
became what is ticked. A playlist and a search stay arms of their own, because a
list the host names is not a catalogue and is never mixed into one. The old arms
still parse, as the strands they drew, in every stored setup and in a room
stored before the deploy (`stored-settings.ts`). A quiz is the same picker with
different arms, and the shape underneath is already built: the countdown, the
buzz order, the lockout, the verdict, the reveal, the scoreboard.

A catalogue has **no preview**. Its lists are curated and never come back
empty, so the count a decade or film press fetched only spent Deezer quota; the
two routes went with the arms. A preview earns its request where the host typed
something that may match nothing — a playlist address, a search.

The decade and film strands are worth reading before adding a fourth, because
the decades are the one that carries **no catalogue detail at all**. A decade is six words the room
already says, and which Deezer playlists each costs lives in `deezer-client.ts`
with the popularity floors. The alternative — a preset that is really a playlist
id the browser holds — was rejected for what it does to the round trip: a host
who typed that id by hand reopens the picker on the wrong control, and nothing
ties the label to what it fetches. `TrackDifficulty` settled the same argument
first, and the rule it leaves is: **a source names what the room asked for, never
what the catalogue charges for it.**

The film strand is the one that moved something no source had moved before:
**what the round asks for**. Every other strand hands the room a title and an
artist, and the film strand hands it a film and a composer — a score cue is called `Cornfield
Chase`, which is the one thing at the table nobody can produce. So
`TrackIdentity` gained `film`, `null` on every other track, and it is the film the
half is measured against wherever it is set. The verdict kept its two field
names on purpose: what each half _is_ is a property of the track, and renaming
the wire contract to fix a word on one screen would have been paying the whole
protocol for a label. The screens say _film_ and _compositeur_; the schema still
says `titleCorrect`.

It is also the first source to **overrule a room setting** — when it is drawn
alone. Deezer's rank scores
the recording and a score cue carries almost none of a single's, so the whole
composer table holds 135 tracks above `easy`'s floor against 1 155 above
this strand's own — and a difficulty control whose _hard_ position leaves 75 tracks
is a control whose room never learns why. The strip is ruled and says so, read
off the **draft** rather than the room, or it would go on claiming to work for a
whole round after the composers were chosen. In a mix the control works and
reaches the charts and decades, the composers keeping their own floor, because
each strand is filtered on its own rules before they meet. The answer line
follows the same split: title and artist, the film, or — a mix holding scores
— title and artist, or the film for a score (`trackAnswersOf`).

So `QuestionSource: hosted | bank | api`, and each arm is a separate size:

**1. `hosted` — the host asks out loud. An evening.** The server serves a round
with _no content at all_: a countdown, the buzzers open, the host reads a
question from a book, a website or their own head, the first press wins and the
host judges it. This is the existing buzzer round minus the track, and it is
mostly deletions — an optional round content, a host panel that says who buzzed
instead of what the track was, and a verdict that is one right/wrong rather than
title-and-artist.

**Since promoted out of this list, built, and named `buzzer`.** Filing it under
`QuestionSource` was the mistake of assuming the content had to be a question.
A server that serves nothing is a buzzer system for _any_ animation — a charade,
a "name five", a lesson, a drinking game — and calling it trivia would hang a
content pipeline off something whose whole value is not having one. It shipped
as [stage 11](plans/11-buzzer.md), ahead of the quiz, and it was as nearly free
as this paragraph predicted: the one thing it needed that no other game does is
a lockout the host can clear, because its round has no clip to run out.

`hosted` was the wrong name — it reads as "hosted by us" and means the opposite.
`gameKinds` is `blindtest | buzzer | quiz`.

It is the only game with no content pipeline and no licensing question at all,
and it turns the product into a buzzer system for anything anyone already has. A
family quiz on paper, a pub quiz, a teacher's revision game. The room, the QR
code, the unforgeable buzz order and the scoreboard are the whole value, and
they exist.

**2. `bank` — a curated file, shipped with the server. A session.** A few
hundred French questions in one JSON asset, drawn without repeats exactly as the
track pool is, with categories where the genres are. Honest limits, both fine:
the pool is finite so a heavy evening will repeat, and adding questions means a
deploy. It is the arm that makes the quiz a _game_ rather than a buzzer.

**3. `api` — a public trivia service. A session.** The same shape as
`deezer-client.ts`: one adapter, one boundary module, everything above it
speaking the domain.

This ranked last, and the reason was never technical: Deezer works because music
is language-neutral, where trivia is not — the free banks are thin and often
ambiguous in French, and a quiz nobody can answer is a broken game. **That
objection assumed an English-first source.** It does not survive a French-first
one, and [OpenQuizzDB](https://www.openquizzdb.org/) is exactly that. See
[stage 12](plans/12-trivia.md) for what still has to be confirmed before it can
ship — chiefly whether a question arrives with its own wrong answers, which is
what decides whether choice mode is free or unbuildable.

### What it would cost that is genuinely new

Nothing structural for `hosted`. For `bank`, one core rule (drawing without
repeats, which already exists for tracks and should be _shared_ rather than
copied) and one adapter. The real work in both is the seam this file already
names: `RoomPhase` is the blind test's life cycle wearing the room's name, and
a second buzz-first game is the moment that costs an hour to fix and never
less.

**The answer modes are more reusable than the table above admits.** Four
choices and a typed answer were built as blind-test modes, and a quiz wants both
— a multiple-choice question _is_ the choice mode with a different pool. When
the quiz lands, the mode machinery moves to the shell and the blind test keeps
only what is about tracks.

## An answer mode is not a game

Settled while playing the first one. Four choices on screen and a typed answer
are **modes of the blind test**, not entries in the table above: the pool, the
audio, the countdown, the reveal and the scoreboard are identical, and only who
acts, when the round ends and who decides differ. They live behind
`RoomSettings.answerMode`, and they are stage 09.

The distinction is worth holding. _Reflex race_ and _Quiz_ really are separate
games of the same shape, because they have no track. A blind test answered by
pressing one of four covers is still a blind test.

The same test settled a rival's _where is that line from?_ round: a line
from a film is a quiz question whose answer is the work, so it shipped as a
ninth chip, `quotes`, and not as a sixth game ([stage 32](plans/32-quotes.md)).
What would make it a game is a mechanic the quiz lacks — the line revealed word
by word, an earlier buzz paying more — and not its content. Flags
([stage 37](plans/37-flags.md)), the emoji rebus
([stage 39](plans/39-emoji-rebus.md)) and capitals
([stage 48](plans/48-capitals.md)) took the same road: a picture or a row
of emojis is a prompt, and the room names an answer.

What they do change is an assumption everything shipped so far rests on:
**exactly one player acts at a time**. That is the expensive part, not the UI.

## An answer built on screen is paid if time runs out

Shades scored nothing for a colour rebuilt within a few degrees and not sent
in time, which punished the slow hand rather than the eye. Three games hold an
answer on screen before a press sends it — the colour on the picker, the pawn on
the map, the cards in their order — and all three lose it the same way, so the
fix is the shell's: `player.lean`, one frame carrying any of those three shapes,
saved as it moves and paid on close without the speed bonus
(`realtime-protocol.md`, _A lean is not an answer_). Not a frame per game: three
cases of one rule were already on the table. A choice, a vote and a typed line
stay out — one press is the whole answer, and a typed line is a guess only once
sent. The estimate's number and higher or lower's pick are the next candidates,
settled before `settleSimultaneousRound`, so they need their own close first.

Every seat's reveal says when it was paid that way, and the room's tally names
those seats, so nobody wonders why a round they never answered scored.

## Every round pays the same hundred

The games once priced their rounds on scales of their own — a reflex race 1,
a typed answer 3, a full black-square sheet 18 — and an evening of several
went to whoever was strong at the dearest game. **Every round of every game
now pays at most 100 printed points** (`MOST_A_ROUND_PAYS`), a sheet's items
sharing them; inside the round the order between players stays the game's
own rule, and only the ceiling is the shell's. Typing no longer pays three
times a pick: a room plays one mode, so the ratio priced games, not answers.
The clock takes the last tenth of what an answer earned rather than adding up
to its worth again on top, which let a map pin 400 km off placed at once beat
one inside the country placed late. A tenth scaled to the answer still let a
pin 140 km off placed at once beat one inside placed last, so the clock now
pays a perfect answer alone: an imperfect one keeps its nine tenths, a
better answer is always paid more, and speed only orders the perfect ones.

## A setting has three possible owners, not two

Stage 11 split settings into "the room's" and "the game's". That is one axis
short, and the missing one is worth naming before anybody writes another
setting:

| Owner        | The test                                         | Today                                        |
| ------------ | ------------------------------------------------ | -------------------------------------------- |
| **The room** | true of any game, in any mode                    | `countdownMs`, `autoAdvanceMs`, `roundCount` |
| **The game** | true of this game, whatever the mode             | `difficulty`, `source`, the round's duration |
| **The mode** | true of this way of answering, whatever the game | `answerWindowMs` — and nothing else yet      |

`answerWindowMs` is the one that exposed the gap, and **the `mode` union is
built**. `settings.mode` is discriminated on `kind` beside `settings.game`, for
the same reason: which game the room is playing and how it is answered are
independent choices, and each owns settings the other cannot read.
`answerWindowMs` lives in the buzzer arm alone, so the guard in `registerBuzz`
against a hand-written buzz _is_ the narrowing that produces the window — a mode
where nobody buzzes cannot reach it.

**It was built on one field rather than the two the threshold below asked for**,
and that revision is worth more than the rule it broke: the field was in the
wrong _place_, which is a different fault from a missing abstraction. A union
invented for symmetry is premature; a union that makes an unreachable field
unrepresentable pays for itself the day it is written. The cost the old
paragraph feared was real — `answerMode` was read by `registerBuzz`,
`registerAnswer`, `settleSimultaneousRound`, `findBuzzBlocker`, the scoreboard
and three UI branches — and it was one afternoon, against a setting the panel
had to hide by hand in two modes out of three.

**The threshold still holds for the next axis**, with that exception carved out:
one mode-specific field is a documented exception, two are a shape — _unless_
the one field is reachable somewhere it means nothing, which is a type bug and
gets fixed as one.

**The naming smell beside it is fixed.** `clipDurationMs` and
`answerDurationMs` were the same concept — how long a round stays open — under
two names, and both are `roundDurationMs` now, each in its own arm with its own
bounds. The blind test's ceiling is a thirty-second Deezer preview and the
quiz's is a taste call, which is exactly why the field stays per-game instead of
being hoisted to the room. The bare buzzer has no arm for it at all:
`roundDurationMsOf` returns `null`, and a game that serves nothing has nothing
for the room to run out of.

**`difficulty` is the game's too, in one vocabulary** — `easy | mixed | hard`,
on every arm that deals content, never on the room. The words are shared and
the meaning is each bank's: the quiz, the country rubrics and the quantities
tier their rows and draw through `dealByDifficulty` (a tier first, then an item
inside it, so `mixed` is a third a tier however lopsided the bank), while the
blind test reads the same three words as a Deezer popularity floor and opens on
`easy`, the charts it always dealt. A level for the whole evening was asked for
too, and is **derived rather than stored**: the console writes one level into
every entry of the line-up, and reads one back only while they agree. A room
value beside the games' would need a precedence rule, and every precedence
rule is one more thing a host cannot see from the setup.

**A country's tier is one list, and it is not the traffic.** Sixty days of
French Wikipedia readers follow the news — a coup put Burkina Faso above
Thailand, and Denmark's top entity is the constituent country nobody reads —
so the flags' `easy` tier is the hand-picked list of flags a table has seen,
plus France's neighbours and the G20, and traffic only splits the rest into
`medium` and `hard` (`scripts/country-tiers.ts`). Silhouettes and the map's
countries read the same list; a capital is cut in thirds by its own traffic,
then held within one tier of its country's, because the raw cut filed Caracas
among the obscure. `easy` alone softens the question: the country rubrics show
decoys from three other continents, the map's naming draws from a ring of
forty rather than eight; the near misses stay at every other level. The
tiers that only the country rubrics and the rebus hold made the quiz's
`mixed` draw its **category first** and the tier inside it: a tier drawn first
sent every `medium` round — a third of the evening — to four subjects of
thirteen.

**"The capitals are always the same" was measured, not guessed.** Two thousand
simulated evenings: `mixed` deals all 191 asked capitals, the twenty most dealt
taking 14 % of the draws against 10 % for a perfectly even draw; nothing is
seeded, and a room's no-repeat set is per room, so the famous ones returning
across evenings is the draw working. The old _well-known_ switch kept 154 of
191 and narrowed nothing. What did skew it was part 1's stand-in, which cut
the bank into heard-of and obscure halves: each of the 37 obscure capitals came
up four times as often as a famous one. `easy` deals 51, and a capitals-only
easy evening does circle them.

**Which games take a level, and why the others do not.** A level belongs to
a game whose server deals content that can be easier or harder for a table
with children: the blind test, the quiz, the map, the timeline, black
square, Petit Bac, _Le juste chiffre_ and _Plus ou moins_. Each reads the
three words its own way where tiering every item would mean nothing:

- **The timeline** leaves `mixed` and `hard` alone — close dates are the
  game — and `easy` deals events a child has heard of (`knownToChildren`
  on every row) at least thirty years apart, falling back on any event that
  far apart, then on the usual five.
- **Petit Bac** tiers its _categories_, not its letters: the rare letters are
  already out by default and the host's own letter picker owns them, so a
  level there would be a second control for one thing. A host's own list is
  played as written and counts for no level in the evening's strip.

The rest take none, on purpose:

- **Shades** already has the one knob a level would turn — how long the
  colour stays up (`showMs`) — and the pay curve must not move with a level.
- **Matchsticks** generates every puzzle and every one is a single move by
  construction: there is no bank to tier and no measured proxy for which
  puzzle a child sees first.
- **Most likely**, **Buzzer**, **Reflex**, **Slate**, **Challenge** and
  **Inner clock** deal nothing the table could find easier — the line is
  about the people at the table, the host brings the content, or the game is
  a reflex — so they stay out of the evening-wide strip's count.

A new game takes a level when its server deals content a child could be
dealt less of; `difficultyOf` (`room/evening-difficulty.ts`) counts it as
soon as its arm carries `difficulty`.

## The seams, and what it costs to keep them open

**Room state and game state were fused, and are not any more.** Stage 11 split
them: `settings.game` and `round.content` are discriminated on `kind`, and the
compiler did walk through the change in an afternoon, exactly as this paragraph
predicted it would once there were two cases.

**`RoomPhase` stays fused.** `lobby → countdown → playing → buzzed → revealed →
finished` is the blind test's life cycle wearing the room's name, and it stays
whole because a phase carries **no field at all** — it is a name. `settings.game`,
`settings.mode`, `round.content` and `Verdict` each split because a field
belonged to one arm and sat on all of them. Splitting a name buys nothing of the
sort, and costs every check in the shell the ability to spell what it is
checking.

The rule is to split it the day a game needs a phase these names cannot carry,
and that day is likelier to arrive as an _addition_: a submit-then-vote game
needs **one** new name, for the room choosing from a board. Not two — its
writing phase _is_ `playing`, because "everyone submitting against a deadline"
is what a simultaneous round already means. Adding a member keeps the enum
shared. A drawing game's "everyone is drawing at once" is the same test again,
and still has no equivalent here.

The slate added a name on that argument, `correcting`, and gave it back a stage
later. Marking one item while the rest are still being written
means writing and marking overlap, and a phase is the room's, not an item's: so
the slate lives in `playing` and each item carries `open | closed | marked` on
its own arm of `round.content`. A phase name earns its place when the _whole
room_ changes what it is doing; a game whose parts move separately carries the
state on the parts.

**Message names are blind-test verbs.** `player.buzz`, `host.judge`,
`host.reveal`. A frame no other game could receive takes its game's own
namespace (`slate.write`) and the shell keeps `host.startRound` /
`host.endGame`. `HOST_ONLY_MESSAGE_TYPES` partitions by prefix already, so the
guard survives the split.

**Do not dilute the role-scoped unions.** They look like ceremony until the
second hidden-information game, at which point they are the entire anti-cheat
story. A "generic payload" field on the room view would undo them in one commit.

**One snapshot per change holds for four shapes out of five.** A drawing game
streams 30–60 messages a second, and a whole-room snapshot per stroke is
absurd. That game gets its own frame type carrying stroke deltas, and it is the
_only_ place a delta is right. Write that down where the next person will read
it, or the rule will get quietly relaxed for everything.

**Routes are already open.** `/host/:code` and `/play/:code` say nothing about
which game is running, because the game is a property of the room, not of the
URL. Keep it that way. What _is_ in the URL is the shelf: `/:game` is one page
for every game's front door, and a room opened through one arrives already set
to it — `POST /api/rooms` carries the game when it was asked for.

**The ordinary way in carries none.** The front page opens a room with nothing
chosen and the lobby's picker is where the table decides, which is what
`settings.game` being nullable buys: a room is a code on a screen before it is a
game. See `docs/plans/13-room-first.md`.

**i18n is namespaced by game.** A prefix per game — `blindtest.*`, `buzzer.*`,
`challenge.*`, `innerclock.*`, `matchsticks.*`, `quiz.*`, `reflex.*`, `slate.*`, `timeline.*`, `atlas.*` — and `join.*`, `host.*`, `player.*`, `round.*`, `buzz.*`,
`error.*`, `connection.*`, `menu.*` and `preferences.*` for the shell. A new game
adds its own prefix and touches nothing else. The test itself — _would the second
game display this string unchanged?_ — is in
[`.claude/rules/i18n.md`](../.claude/rules/i18n.md); what follows is what it has
already decided.

**The trap is `host.*`**: it names a _screen_, and a screen shows both kinds of
string. "Start the game", "Next round", "How to answer" and "Volume" are shell —
every future game has a host console with those, and volume presupposes _audio_
rather than the blind test, so a second game that plays anything reuses it. The
source picker, the genres, the clip length and the title/artist verdict are the
blind test's, and live under `blindtest.*` even though the host console is what
renders them.

**A mode is not a game.** `blindtest.buzz.*` was filed under the game because
only one game had a buzzer; it is `buzz.*` now, because `answerMode` is a _room_
setting and the bare buzzer renders every one of those strings unchanged — the
button, the blockers, "{nickname} buzzed". `blindtest.round` is `round.*` one
level up, because "Round 3 of 10", "+2" and "Nobody got it" are what a _round_
shows in any game.

**The third game moved four more**, and they are the same shape.
`blindtest.answer.*` is `round.answer.*` — the field a _simultaneous round_ is
answered in, its label, its send, its "waiting for the others", its "as many goes
as you like" — and the bare buzzer's right/wrong pair is `host.verdict.*`. Two
games needing a string unchanged is the signal; one game plus a hunch is not.

What stays inside a game's prefix is what only that game can say:
`blindtest.reveal.title` is "It was", and a charade has no "it".
`blindtest.answer.bothFound` says "both", and only a pair of halves has two.

**Themes are semantic, so a game can own a colour.** Every component reads
`--accent`, never a hex. A game that wants to be green sets `--accent` on its
root element and the whole surface follows, with no fork of the palette.

**`packages/core` holds both kinds of rule, split by directory.** `time/*`,
`room/*`, `i18n/*`, `round/*` and `scoring/*` are the shell's — including
`pointsFor`, which reads a verdict of either shape. `blindtest/typed-answer.ts`
is the game's, and holds everything that knows an answer has a title and an
artist. A directory, not a package: a boundary with one consumer on each side
buys nothing.

**The package names are already right.** They used to be `@blindtest/*`, which
named the first game rather than the shelf it sits on, and this file said to fix
that exactly once and not twice. That rename happened the day the product got
its name, before the repository was ever published — the cheapest moment it
could have happened, and the second game inherits `@melee/*` for free.

What is deliberately _not_ renamed: the `blindtest.*` translation keys. Those
belong to the game, and a second game brings its own prefix.

## What not to build in advance

A plugin registry. A generic "game SDK". A `packages/games/*` per title. An
abstract `GameEngine` interface with one implementation.

Each of those is the anti-pattern in `.claude/rules/abstraction-boundaries.md`
wearing a different hat: an abstraction invented before the second case exists,
sized to the one case that does. **Two games is when the shape of the shared
part becomes knowable.** Until then the cheapest way to stay open is the one
this file describes — keep the seams visible, and keep the blind test from
growing into places it does not belong.

### Several consoles — a control room, parked

One console holds a room: a claim with the host token displaces every other
(`displaceOtherConsoles`), which is what makes a takeover undoable. A streamed
quiz with a presenter on camera and a crew in the wings running the board is
the case that would want more, and it is parked rather than refused. Opening
it is not a flag: two consoles mean two hands on the settings at once, two
verdicts on one buzz, a question of who closes the room for whom, and probably
a role of its own — a crew screen that judges and advances but does not own
the room — rather than a second `host`. Walls already come several to a room
(`docs/realtime-protocol.md`); consoles wait for a table that asks.

### A round played on the wall — an idea, parked

Every screen but the wall is touched; the wall is only watched. A round — a
game of its own, or an option inside one — where one seat, or two head to head,
plays _on the wall_ while the room watches would turn that into a stage. Not
designed: who touches it (a wall is a television as often as a touch panel, so
the seat may steer it from its own screen), what the others do meanwhile, and
whether it is the duel (`round.duel`) moved onto the shared screen. Raised by
Adrien on 2026-10-31.

## Related

- `docs/architecture.md` — how the pieces fit today
- `docs/plans/` — the staged build of the blind test itself
- `.claude/rules/realtime-protocol.md` — the guarantees any second game inherits
