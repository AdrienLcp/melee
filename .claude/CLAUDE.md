# CLAUDE.md

**Melee** is a shelf of party games sharing one room, one QR code and one set
of screens. **Blind test** is the first: one screen runs the game and shows the
QR code, everyone else plays on whatever screen they have to hand, and the first
to buzz names the track. **Buzzer** is the same unforgeable race for the floor
with no content at all — the host brings the charade, the quiz on paper or the
lesson. **Quiz** serves its own, two question banks bundled with the server in
French and English, a flags rubric dealt from every country the map
names, an emoji rebus rubric — a title written in emojis — a capitals
rubric, and a silhouettes rubric — a country's outline alone. **Reflex** is a race against a screen about to change colour, **Slate** is a private answer sheet on every screen that the host
marks on the wall, one item at a time, **Atlas** names a place that
everyone puts a pawn on, paid by the kilometre to its border — or shows one
for the table to name, **Challenge**
is played at the table, off every screen: the wall shows the line the host
typed, and the host places the first three, **Inner clock** asks everyone
to count to a number of seconds in their head, on screens where nothing moves,
and pays each single press by its gap to the target, and **Matchsticks** draws
an equation or a number in matches that one moved match fixes, moved on
every screen and judged by the server — or said aloud and judged by the
host, and **Timeline** deals five dated events everyone puts in order on their
own screen, the years held back until the reveal. **Black square** hides three
to nine answers to a theme behind a grid, the less obvious paying more, beside one
black word that costs whoever lands on it the round, and **Petit Bac** deals a
letter and a sheet of categories everyone fills on their own screen, then
votes on what counts, a word nobody else wrote paying double. **Shades**
shows a colour for a few seconds and has every screen rebuild it, paid by how
far off it lands, and **Most likely** puts up a line about one of the people
at the table — never about the moment — that everyone votes on with a seat,
the ballots that went with the room paid, and **Le juste chiffre** asks for a
number — a population, a height, a length — that every screen estimates, the
closest three paid by place, and **Plus ou moins** deals one pair a round of
those numbers — two rivers, two cities — and pays every right pick.

A phone is the common case, not the contract: the room code is displayed to be
read aloud and typed, so a laptop in the same room joins the same way. Nothing
user-facing may assume the device.

Two names, two scopes, and the distinction is load-bearing. The product owns
`@melee/*`, the `melee:*` storage keys and the repository name. A game owns
its own translation prefix — `blindtest.*`, `buzzer.*`, `quiz.*`, `reflex.*`,
`slate.*`, `atlas.*`, `challenge.*`, `innerclock.*`, `matchsticks.*`, `timeline.*`, `blacksquare.*`, `petitbac.*`, `swatch.*`, `mostlikely.*`, `estimate.*`, `higherlower.*` — and nothing else. A string the next game would show unchanged is the shell's.

## Tech stack

pnpm monorepo · TypeScript 7 · React 19 (+ React Compiler) · Vite 8 · Hono ·
native WebSocket · Zod 4 · react-aria-components · SASS · Biome · Vitest.

**No Socket.IO, and no OpenAPI codegen.** Realtime is a raw WebSocket carrying
messages defined in `packages/protocol`; the small HTTP surface is defined in
the same package, schemas in `http.ts` and every path in `routes.ts`. One
answer to "where is the wire contract?" — codegen earns its keep when the client
cannot import the server's types, and here both ends are TypeScript in one
workspace.

**TypeScript 7** — the native Go compiler, viable here precisely because nothing
in this repo consumes the TypeScript JS compiler API (no `@hey-api/openapi-ts`,
no Storybook autodocs). Adding a tool that does means pinning back to 6.x.

**No Babel anywhere.** The React Compiler runs on Oxc —
`react({ compiler: … })` in `apps/game/vite.config.ts` plus
`oxc-transform-react` — which retired the `@babel/core` 7.x pin, the three
packages around it and the guard that enforced them. The two pipelines were
built back to back and emit a byte-identical payload. See
[`docs/component-shape.md`](../docs/component-shape.md).

## Commands

`pnpm dev` runs the Worker under `wrangler dev` (3100) and the app (5273) in
parallel, every push to `main` deploys once CI is green, `pnpm test`
covers protocol, core and server, `pnpm test:core:watch` is the red-green loop,
and `pnpm test:e2e` runs three Playwright journeys on ports of their own.
**`pnpm validate`** is what CI runs — lint, spell, build, typecheck, tests with
coverage and e2e — run it before saying something works. Ports are offset from 3000/5173 so this repo runs beside the
other dev servers on the machine.

## The four rules that matter most here

1. **A player is never sent the answer.** Host and player have separate message
   unions; player frames are encoded *through* their schema, so Zod strips leaks.
2. **The server owns time.** Buzz order is stamped on arrival; `player.buzz`
   carries no timestamp, and never will.
3. **State travels as a whole snapshot**, never a delta.
4. **UI is verified in a real browser, muted.** A green build says nothing about
   whether a screen works, there is no component runner here, and this one plays
   music at a stored volume defaulting to 80%. Set `melee:volume` to `'0'` in
   an init script before the first navigation — see `docs/browser-driving.md`.

## Rules (auto-loaded from `.claude/rules/`)

`realtime-protocol` (the wire contract, anti-cheat, adding a message) ·
`project-structure` (where a new file goes) · `abstraction-boundaries` (which
module may import which library) · `i18n` (adding a string) · `locales` (adding
a locale) · `react-components` (the compiler owns memoization, the `style` prop)
· `data-fetching` (a superseded request is aborted)
· `privacy` (no cookies, the /legal page stays true) · `search` (one
normaliser for a record search; answer matching is not one)
· `design-system` (wrapping a react-aria primitive) · `sass-architecture`
(layers, tokens, both palettes, state attributes) · `code-style` ·
`file-naming` · `comments` · `test-conventions` (tags, the socket harness) ·
`e2e` (build first, three journeys) · `committing` (another session
shares the index) · `worktrees` (a branch beside the checkout, a server
stopped by its process tree)

## Never

- Write a user-visible string in a component — it belongs in the dictionary
- Write a colour in a component — it belongs in both palettes as a token
- Use `npm` or `yarn` — `pnpm` only
- Use `as any`, `as unknown as`, or any unsafe cast — `as const` is fine
- Use `// biome-ignore`, `@ts-ignore`, `@ts-expect-error`
- Write `function` declarations — `const` arrow functions (overloads excepted)
- Create a barrel `index.ts` that only re-exports
- Send a player frame with bare `JSON.stringify` / `encodeMessage`
- Trust a client-supplied timestamp for anything that decides a winner
- Import an external library outside its boundary module
- Write a comment a better name would have made unnecessary

## Always

- `react-aria-components` for anything interactive — check for an existing
  primitive before writing custom HTML with hand-rolled ARIA
- Style from react-aria's `data-*` attributes, never a hand-composed state class
- An object parameter when two arguments share a type — `fn({ from, to })`
- `type` for props, with a JSDoc on every prop that adds information
- A bracketed tag on every test — `it('[clock] …')`
- Break a new test on purpose once, and watch it fail
- Fix a reported bug on sight — where it came from is a clue, never a defence
- Write a discovery into `.claude/` or `docs/` as you make it, not at the end

## Language

Everything committed is **English** — code, comments, docs, commit messages, and
every translation *key*; chat replies to the developer stay in French. The one
exception is the dictionaries: French *values* live in
`apps/game/src/presentation/i18n/` and nowhere else — save the country names in
`packages/core/src/countries/`, which the server also deals as a flag's answer —
which is why a user-visible string written into a component is a bug — see
`.claude/rules/i18n.md`.

## Domain vocabulary

- **Room** — one game, addressed by a 4-character code from an alphabet with no
  confusable glyphs (`O`/`0`, `I`/`1`, `S`/`5`, `Z`/`2` are all excluded)
- **Host** — the screen running the room. Shows the QR code, plays the audio,
  judges answers. It can also take a **seat** and play, and the server then
  withholds the track's **title and artist** while still sending it the clip;
  that screen is the room's speaker, seated or not, until a **wall** is there to
  be it instead. A round `isJudgedByHost` says the host must judge — every mode
  but `buzzer` plus the reflex race need none — is **sat out** by that seat: it
  keeps its score, gets the answer, and plays again on the next round. It is the only role that can **close** the
  room — see `Exits` below. There is no judge switch: an evening plays each
  game on the mode this host last left it on, and a seated host judging one sits
  those rounds out.
- **Wall** — the room's own screen, paired to it by the host's device: it shows
  the game, plays the clip and holds no answer, no control and no seat. A third
  role, so nothing written for the host reaches it — see `docs/realtime-protocol.md`
- **Player** — anyone who joined, by scanning the QR code or by typing the room
  code. Holds a seat and a score
- **Game** — what the room is playing, and **`null` until somebody says**: the
  code goes up and the screens arrive before the table decides, and the picker
  sits on the lobby stage beside the QR code. The guard on `host.startRound`
  narrows it for everything downstream, and a round already on screen is asked
  `round.content` rather than `settings.game`, because that is the game it was
  *opened* on. `shelvedGames` is the ones a game's own front door may open a room
  for, and the create-room request carries which. It must **not** collapse into
  `gameKinds`, because it is what refuses a game that is served but has no
  screens yet — every game so far spent a stage in that window, `reflex`
  included, reachable only by a settings frame. The game owns
  its arm of `settings.game` and `round.content`, and narrows the answer mode
- **Line-up** — the entries ticked for the evening, `settings.lineUp`, each
  a game's whole settings so two may share a game (a **variant**: a blind test
  on film scores beside one on the charts). `game` is a copy of the entry
  `lineUpAt` points at, written back into it by the server on every frame:
  what the next round is played on, read off the **running order** as each
  reveal goes up and changed by dragging the running order in the panel. The order is the
  **planned games**, one row per entry: the server deals it whenever the
  evening changes (`dealtOrder`, on `nextEntryAt`'s rule: another game before
  another entry of the same one), the setup lists it and a drag edits it, and
  every round past its last row is drawn as it comes (`scheduledEntryAt`)
  among the **draw**: `lineUpDeals`, parallel to `lineUp`, deals each entry a
  `row`, `chance` or `both` — a game serving its own content defaults to
  `both`, one the host brings is `row` and refused anything else, and a
  `chance` entry sits in the draw without a planned row. One tick is a
  room playing one game, which every game's front door opens; several ticked in
  the lobby open a line-up of four rounds a game. Teams, board and judge are the
  host's, remembered once and laid over every table, one game or several. An
  evening of several keeps its own `roundCount` and reveal hold across a switch,
  because a game's own would end it or cut a reveal short. **Ready** is a seat
  saying it is back at the table between two rounds, checked on its row of
  the standings and never counted, cleared as a round opens and never a gate
- **Round** — one track, one question, a screen about to change colour, or
  nothing at all.
  `lobby → countdown → playing → buzzed → revealed → finished`.
  `roundCount` is nullable, and `null` means until the host ends it. Every game
  goes from `playing` straight to a reveal — the slate writes and marks inside
  `playing`, each item carrying its own `open | closed | marked` state — and the
  reflex race is the only one that never passes through `buzzed` at all.
  A round **stamps who it opened on** when its clip starts, and waits for those
  players and nobody else — one stamp for the whole round. The slate stamps at **collection** instead: a sheet has no clock and
  no race, so a latecomer is owed one. A screen that arrives after keeps its seat, is refused everything it
  could send with `joined_mid_round`, and plays from the next round
- **Duel** — one round two seats of two teams play head to head while the
  room watches: `isDuel` on the host's *next round*, `round.duel` on the view,
  an ordinary round stamped on those two seats, drawn so every seat duels
  before any duels twice. Asked one round at a time, never a mode: everyone
  plays every other round, because a round played by one team makes
  spectators of the rest
- **Answer mode** — `typed` (one field), `choice` (four candidates, what the
  blind test and the quiz open on) or `buzzer` (one player, judged by the
  host); a game with an answer of its own shape takes a mode of its own —
  `point` on the map, `order` on the timeline, `move` for a matchstick, and
  `spoken` for black square said by one team and ticked by a keeper of another.
  All but `buzzer` and `spoken` are everyone at once, decided by the server and scored
  by the clock on top of being right — `MOST_A_SPEED_BONUS_PAYS` at nought,
  falling linearly to nothing when the round runs out, on a board counted in
  `POINT`s of a thousand so the clock separates players by the millisecond:
  of three quick answers inside one second, the first is paid the most; typing
  pays 3 for the pair where a right pick pays 1, because producing an answer
  from nothing is not recognising it among four. A banked question that is only
  a question beside its own decoys — *which country drives on the left?* answers
  Japan, and seventy others — carries `choiceOnly` and is dealt to a `choice`
  room alone; the column is a census read row by row, because no rule finds
  one — save the one rubric that *is* a single riddle shape, where the source
  says so for all 114 of its rows at once.
  **The clock never pays more
  than the answer did** — its amplitude is the lower of the two, so being fast
  doubles a score at most, and the console prints the two halves apart
  (`20 +15`, every figure a screen prints being the board's divided by a
  hundred) rather than their total. It stays a *room* setting the
  game narrows — the bare buzzer and the reflex race offer only `buzzer`, and a
  frame setting anything else is refused
- **Guess** — one typed line. Each half is looked for *inside* it over runs of
  whole words, so "jean jacques goldman on ira" banks both and "daniel balavoine
  on ira" banks the title and still owes the artist. Whole words are the guard:
  `normalizeAnswer` drops whitespace, and `Hell` is inside `Michelle`. Typed
  mode allows as many guesses as the clip does and closes once a player holds
  both halves; a pick is one shot, because four candidates with retries is the
  answer with extra steps. **Searching *within* a line is the blind test's
  alone** — the quiz matches the whole of what was typed, because "trois ou
  quatre" contains the answer to how many languages Switzerland has. **So is
  catalogue noise**: `(Radio Edit)` and `- Remastered 2011` belong to a music
  catalogue, and folding them everywhere leaves the quiz answering
  `River Horse (Greek)` and `1915 - 1916` with its own decoy. A leading article
  is nobody's and goes everywhere — a room says *Cervin* for *Le Cervin*.
  A source drawn from **film composers** asks for the **film** in the title's
  place — `TrackIdentity.film`, `null` on every other source, because a score
  cue is called *Cornfield Chase* and what a table shouts is *Interstellar*.
  **Forgiveness stops one edit short of the nearest answer the bank calls
  wrong**: a question offering `5 minutes` beside `7 minutes` has said what a
  different answer is, and a tolerance reaching across it pays for the wrong one
- **Buzz** — a player claiming the answer; the server stamps when it arrived
- **The floor** — what a buzz takes, held for `answerWindowMs` or until the host
  judges when that is `null` and the screens count up instead. Running out is
  the same outcome as answering wrong, because taking the floor and saying
  nothing is what it cost everyone else
- **Lockout** — a player who answered wrong, held the floor and said nothing, or
  went before the screen changed, sits out the rest of the round. The blind test
  always locks out, because its round is a clip that runs out; the bare buzzer
  has no such clock, so its host chooses (`locksOutOnMiss`) and can reopen the
  field with `host.clearLockouts`. In the reflex race a lockout has exactly one
  cause — a **false start** — which is what lets the reveal read it as one
- **False start** — a press less than `FALSE_START_FLOOR_MS` after `flipsAt`, or
  before it at all. Refused with its own code and it costs the round, which is
  what lets `flipsAt` be published in advance: every device has to flip on its
  own clock or the race measures the room's Wi-Fi. It is the **fifth
  guarantee** — see `docs/realtime-protocol.md`
- **Reveal** — the moment the round's answer becomes public, and the scoreline
  alone in a game whose question the room owns
- **Verdict** — what the host granted, in the shape the game is judged in:
  `halves` for the blind test's title and artist, a point each and judged
  independently, `single` for one claim worth one point everywhere else
- **Exits** — three nested scopes, never one "back". `player.leave` gives up a
  **seat**, `host.endGame` ends a **game** and puts the final board up,
  `host.closeRoom` disbands the **room**: everyone is sent a fatal `room_closed`
  and the code stops resolving. The stage carries the exit the moment asks for
  and nothing else, so the ones that must be reachable mid-round live in
  `AppMenu`, on every screen at every phase behind a popover no press aiming at
  the game can hit. A seated host is the only screen offering all three, and the
  server frees the seat on the frame rather than on the reconnect after it,
  because a judge waiting on that would read no answer until it landed. A room
  outlives its host by an hour so a break keeps the game; closing is what
  says otherwise. `host.removePlayer` is the fourth and the only one nobody
  chooses, so it is the one that has to be **said**: a fatal `removed_by_host`
  to that screen alone, before the seat goes, and it voids the seat because the
  room still answers. **A plain navigation is never an exit** — the server cannot
  tell it from a closed tab, so the menu offers a link out of a room only where
  there is no room, which is why the credits are a front-door concern
- **Session id** — minted by the client, stored per room and role; what lets a
  device that locked its screen come back to the same seat. The **name** that
  seat is held under is stored beside it, and that is the console's alone: a
  screen running a room takes its seat through the `hello`, so nothing else
  carries the name across a reload. But a seat that *comes back* keeps the name
  it already holds, whatever the `hello` carries — `player.rename` is the only
  thing that changes one, and reading the hello there would let a Wi-Fi blink
  undo a rename. `melee:nickname` is the device-global name beside it, written
  from the name the room **accepted** rather than the one that was typed: a
  screen holding one joins on arrival with no form at all, the console's seat
  form fills itself in from it, and the menu is where it is read back and
  changed — because a screen that never met the form never saw it
- **Host token** — minted with the room and returned by `POST /api/rooms` to the
  screen that opened it. The code says *which* room, this says *who may host it*,
  and it always wins a claim — which is what makes a takeover undoable. Without
  one a second console waits out `HOST_RECLAIM_GRACE_MS`, then the code alone is
  enough. It lives in `melee:host-tokens` and **never on the seat**: the
  refusal that displaces a console voids its seat, and a token dropped with it
  would make the takeover final
- **The host's setup** — `HostPreferences`, stored on the console's own machine
  and split on the seam `movedToGame` turns on. A game answers four of the
  room's settings — `game`, `mode`, `roundCount`, `autoAdvanceMs`, together
  `GameSetup` — so those are remembered *per game*, and everything no game
  answers is remembered once and survives every switch. The hold is the one no
  game opens on a number of its own: every game takes the shell's `null`, and it
  is on the game's side of the line to be *remembered* there — twenty-five
  seconds picked so a quiz note can be read aloud is not what a reflex race
  wants. The console applies it over what the door
  decided, as one `host.updateSettings` in the **lobby** and only on the first
  view it draws: a mid-game reload must re-apply nothing, because the server
  would refuse the three a round is built on and the rest would rearrange
  somebody's evening between two rounds

## The blind test is the first game, not the product

Fourteen games share the room, the QR code and every screen, and the rule that got
them there has not changed: **do not weld a seam shut, and do not invent a
shared shape before there is a second case to measure it against.** **Read
[`docs/game-catalogue.md`](../docs/game-catalogue.md) before generalising
anything** — before hoisting a field to the room, splitting a union, or naming
something "shared". It holds the open seams, the shapes the remaining games fall
into, and every argument already settled.

## The build is staged

`docs/plans/` holds one file per stage, each scoped to a session. **Start a
session by reading the stage's plan, and update it when reality diverges.**
[`docs/plans/README.md`](../docs/plans/README.md) is the authority on which
stages are done, which were dropped and why, and what each one bought — trust
that table over anything remembered, this file included.
