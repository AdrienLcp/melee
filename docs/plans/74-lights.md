# 74 — Lights

A board of nine lights, three by three, on every screen. One lights up; hit
it and the next one lights, somewhere else. Twenty seconds, and every seat
chases the same run of lights as far as its hands will carry it. Now and
then a second light comes up beside the right one, marked as a trap: hit it
and the board goes dark for a second. The wall is the race — one bar a seat,
climbing with every hit — and the room watches the bars, not its own hands.

The twenty-second game, **everyone at once** and counted by the server. Kind
`lights`, translation prefix `lights.*`. _Lumières_ in French, _Lights_ in
English, _Luzes_ in Portuguese.

Not a mode of Reflex. Reflex is one press timed against one flip, a false
start costing the round; this is a count over a window, no flip and no race
to a single moment. Its round, its score and its screens share nothing with
Reflex's but the guarantee below, and a game owns its arm of `settings.game`
and `round.content` — a `format` switch on Reflex's would weld two games
shut. They sit beside each other on the shelf.

## Rules, as settled

- **Nine cells in a fixed 3 × 3 grid**, never targets at random places. The
  game measures reaction, not aim: a laptop's trackpad aiming at a moving dot
  loses to a thumb every time, and nothing user-facing may assume the device.
  A fixed grid also maps to keys — see _The keyboard_.
- **One lit cell at a time**, the next drawn among the eight others, so a
  cell never relights under the finger that just hit it.
- **Every seat chases the same run.** The server draws a seed per round and
  every screen builds the run from it with one core function; one seat must
  never draw a run of neighbouring cells while another crosses the board.
- **Traps**, on by default (`hasTraps`): about one step in four lights a
  second cell beside the target, drawn among the seven others and marked as a
  trap by its shape as much as its colour — a hatch or a cross, never red
  against green alone, which a colour-blind seat cannot tell apart. Hitting
  the trap darkens the board for `TRAP_FREEZE_MS` (1 s). The run does not
  move on: the same target and trap come back when the board relights.
- **A miss** — a cell neither lit nor trapped — darkens the board for
  `MISS_FREEZE_MS` (300 ms). Without it, sweeping a hand over all nine cells
  is the best play.
- **The window**: `windowMs`, 20 s by default, 15 to 30. A countdown on every
  screen first, as every round has.
- **The pay**: a seat's hits over the round's best, as a share of
  `MOST_A_ROUND_PAYS` (`round-share.ts`): the best seat banks 100, 15 hits
  against a best of 30 banks 50, no hit banks nothing. No clock settles ties —
  two seats on 30 hits did the same thing. Traps cost only the time they
  freeze; the score is hits.
- **Duel**: allowed. Two bars side by side on the wall is the game at its
  best.
- **Answer mode**: one of its own, `tap`, as the map has `point` and the
  timeline `order`; the room's other modes are refused for this game.
- **Nothing is hidden.** The run is not an answer: the seed goes out with the
  round, like Reflex's `flipsAt`, and the defence is a floor, not a secret.

## The clock — the part not to get wrong

Every tap cannot be timed by the server: the room's Wi-Fi would add 50 to
200 ms to each of them, at random. So the score is **how many hits arrived
inside a window**, and that window is fixed on the server's clock and
published in advance — the fifth guarantee (`docs/realtime-protocol.md`, the
reflex flip), applied to a window instead of an instant:

- `opensAt` and `closesAt` are server times on the round's content, sent with
  the countdown. Each screen lights its board at `opensAt` and darkens it at
  `closesAt`, both read on its own clock estimate (`serverNow`,
  `clock-sync.ts`). An error in that estimate shifts both ends by the same
  amount, so **every seat plays a window of exactly `windowMs`**, whatever its
  Wi-Fi.
- A screen sends `lights.tap { roundId, step, cell }` on a hit or a trap, never
  on a miss. No timestamp: the server stamps arrival, as for every frame.
- The server counts a hit when `cell` is the run's target at `step`, `step` is
  the seat's next, and it arrives between `opensAt` and
  `closesAt + LATE_TAP_GRACE_MS` (400 ms, the last taps still in the air). A
  trap is recorded for the wall and moves nothing.
- **The floor**: hit _n_ (from 1) arriving before
  `opensAt + n × HIT_FLOOR_MS` (100 ms) is not counted. Cumulative on
  purpose: Wi-Fi bunches frames, so a floor between two arrivals would refuse
  honest hits, while a script firing every step at once still meets the wall.
  It is `FALSE_START_FLOOR_MS`'s twin and is written beside it.
- The freezes are the screen's own. A screen modified to skip them gains a
  second a trap; so does one modified to tap for its seat. Both are a
  developer cheating at a party game, which Reflex accepts as well.

## The load — the second part not to get wrong

There is no per-socket rate limit on the WebSocket, so the taps are not
refused — but every accepted frame calls `publishRoom`, a whole snapshot to
every socket. At `MAX_PLAYERS_PER_ROOM` (24) seats tapping five times a
second, that is 120 publishes a second, each fanned out to every screen.
**A tap does not publish.** It updates the seat's count, and the round
publishes on a tick (4 a second, about what a bar climbing needs) while any
count changed. Still a whole snapshot each time: the snapshot rule holds, only
its rate is chosen.

## The keyboard

A laptop plays from its keys. The grid maps to two blocks by **physical
position** — `KeyboardEvent.code`, not `key`, unlike Mystery word's letters,
because here the place on the keyboard is the point:

- the left hand's three rows, `KeyQ KeyW KeyE / KeyA KeyS KeyD / KeyZ KeyX
  KeyC` — AZE / QSD / WXC on a French keyboard, QWE / ASD / ZXC on an English
  one, the same block under the same fingers;
- the number pad, `Numpad7 8 9 / 4 5 6 / 1 2 3`.

Each cell shows its key's label from the device's own layout
(`navigator.keyboard.getLayoutMap()` where it exists, the code's letter
otherwise), and only on a device that has a keyboard — a phone never sees it.

## The shape, as decided

- **`lights` in `gameKinds`**, its arm of `settings.game`
  (`{ kind, windowMs, hasTraps }`), `isJudgedByHost` false — a seated host plays
  like anyone. Ten rounds by default would be too many for a game this
  physical: **five**.
- **The run is pure core**: `packages/core/src/lights/` holds
  `lightsRunOf({ seed, length, hasTraps })` (a target and an optional trap
  per step), `isCountedHit`, `HIT_FLOOR_MS`, `LATE_TAP_GRACE_MS`,
  `TRAP_FREEZE_MS`, `MISS_FREEZE_MS`, and the pay. The run's length is
  `windowMs / HIT_FLOOR_MS`, the most a seat can be counted.
- **`round.content`**: `{ kind: 'lights', seed, opensAt, closesAt,
  hasTraps, seats: { playerId, hits, traps }[] }`, the same on every view —
  the wall, the console and every seat see every count. The player view adds
  nothing: a seat's next step is its own count.
- **Verdict**: a `count` of hits, or the quiz's `single` with the hits
  carried on the award — decided in step 1 against `scoring.ts`.
- **Template**: Think alike's serve commit, `git show --stat 9d39e61a`, for a
  game with a player message of its own; Five clues' (`b397edb5`) for the
  rest.

## Step 1 — plan, protocol and core (one session)

Read `docs/game-catalogue.md` first and add the game's entry there.

- `packages/protocol/src/lights.ts`: the settings bounds and defaults, the
  content and the `lights.tap` frame (`client-message.ts` beside the others).
- `packages/core/src/lights/`: the run, the counting rule, the floor, the
  pay. The run tested for what the rules promise: same seed same run, never
  the same cell twice running, a trap never on its target, about a quarter of
  steps trapped.
- Each rule seen red under a mutation.

— cut here: plan, protocol file and core rules committed, tests green —

### Step 1, as built (19/11/2026)

Where it diverges from the above, and what step 2 picks up:

- **The verdict is `count`, `{ hits, bestHits }`** (`scoring.ts`), not
  `single`: a share of the round's best needs the best on the verdict, as
  `letters` carries `bestLength`. `hits-pay.ts` prices it, `verdict.ts` routes
  it, `isPaidForSpeed` leaves it out, and `isFullyBanked` is matching the best
  with at least one hit. `bestHitsOf` is the best of a list, nought when empty.
- **`tapOutcomeOf` instead of `isCountedHit`**: one rule answering `hit`,
  `trap` or `uncounted`, because the server must tell a trap from nothing as
  well. It takes the seat's `hits` (its next step), the run, the tap and the
  window.
- **The run is `(windowMs + LATE_TAP_GRACE_MS) / HIT_FLOOR_MS` long** — 204
  steps for 20 s, not 200: the floor reaches into the grace, so the last hits a
  seat can be counted need a light of their own (`lightsRunLengthOf`).
- **A trap is never the target nor the cell just hit** — the seven others, the
  eight others on the first step — so a finger tapping twice never lands on
  one. The trap is drawn on every step even with traps off, so a seed lights
  the same targets either way.
- **The seed is mulberry32** (`seededUnits`, `helpers/random.ts`), a 32-bit
  unsigned integer up to `MAX_LIGHTS_SEED`; the server draws it with
  `randomIntBetween(0, MAX_LIGHTS_SEED)`.
- **`lights.ts` holds the whole content arm**, `lightsRoundContentSchema` with
  its `kind`, for `room.ts`'s union to take as it is. The settings arm and
  `DEFAULT_LIGHTS_SETTINGS` stay `game.ts`'s, beside the others; their bounds
  and defaults — `DEFAULT_LIGHTS_WINDOW_MS`, `DEFAULT_LIGHTS_HAS_TRAPS`,
  `DEFAULT_LIGHTS_ROUND_COUNT` — are exported from `lights.ts`.
- **`lights.tap` is in the player unions and in `FLOOR_MESSAGE_TYPES`**, so a
  room frozen by its console's absence refuses taps. `step` has no upper bound
  on the wire: a step past the run is `uncounted` by core. **Until step 2 the
  server drops the frame without a word** — `socket-handler.ts`'s dispatch has
  no case for it yet.

## Step 2 — the server (one session)

- `lights` in `gameKinds`, **not** in `shelvedGames`; the settings arm,
  `tap` as its only mode, `playsDuels`, and `room-settings.ts`,
  `spaced-cycle.ts`, `ready-made-line-ups.ts` beside the others.
- `domain/round/lights-round.ts`: the seed and the window stamped as the
  round opens, a tap counted or recorded on arrival through `tapOutcomeOf`
  (its `case` in `socket-handler.ts`'s dispatch), the round closed at
  `closesAt + LATE_TAP_GRACE_MS`, each seat paid at the close. The window
  stopped by a pause: the board darkens on every screen, and the window
  resumes with what it had left.
- The publish tick of _The load_, and nothing else touched by it.
- `lights-game.test.ts`: a hit before `opensAt` or under the floor not
  counted, a hit after the grace not counted, a wrong step not counted, a
  trap moving nothing, the pay by share, a latecomer refused
  `joined_mid_round`, 24 seats tapping five times a second publishing at the
  tick's rate and not per tap — each seen red with its guard removed.

— cut here: served by a settings frame, tests green, screens owed —

### Step 2, as built (19/11/2026)

Where it diverges from the above, and what step 3 picks up:

- **The window is read off the round's own clock**, never stored:
  `lightsWindowOf` gives `opensAt = runningSince − elapsedMs` while the clock
  runs, the countdown's end before it starts, and `now − elapsedMs` while it
  stands still. A pause or the console away therefore moves both ends on by
  however long it lasted, and `closesAt − opensAt` is always `windowMs` — the
  view sends it, and a screen builds its run from
  `lightsRunLengthOf(closesAt − opensAt)`, `windowMs` being on no view. While
  paused the published window drifts with the clock: the board is dark there
  on `isPaused`, which step 3 draws. The round closes on the shell's `round`
  deadline at `windowMs + LATE_TAP_GRACE_MS` of round clock
  (`lightsOpenPhaseMs`), never early.
- **Timing is core's alone.** The server refuses a tap only for what could
  never have been the seat's — unseated (`invalid_message`), another round
  (`stale_round`), another game (`wrong_phase`), a seat the round did not open
  on (`joined_mid_round`) — and answers nothing to a tap that counts nothing:
  one sent in the countdown or after the reveal is outside the window, and an
  honest thumb sends those at every edge. A pause or the console away refuses
  it before dispatch (`room_paused`, `FLOOR_MESSAGE_TYPES`).
- **The tick is `publishDueAt` on the round**, set to
  `now + LIGHTS_PUBLISH_TICK_MS` (250) by the first count that moves after a
  snapshot, and a `publish` deadline in `room-deadlines.ts`. The tap that arms
  it commits, so the wake is set; every other tap only moves memory. 24 seats
  tapping five times a second publish at most 8 snapshots against 122 per tap.
- **The run is kept on the server's round**, built once from the seed, so a
  tap is checked without drawing 204 steps again. It is on no view.
- **Every seat the round opened on is paid**, a seat that hit nothing
  included at 0, so the reveal lists the whole race.
- **Lights joins `clockRaces`** in `spaced-cycle.ts`, with Reflex and Inner
  clock: three races against a screen read as one round twice.
- **`ready-made-line-ups.ts` is untouched**: Free-for-all reads the shelf, so
  it takes Lights on its own the day step 3 shelves it, and _Quick_ (Reflex,
  Shades, Inner clock, Matchsticks) is step 3's to decide.
- **The app compiles with the game and draws nothing of it**: `lights.name`
  and `lights.scoring` in three dictionaries, `host.answerMode.tap`, the
  `Lightbulb` glyph, and a case in `answer-forms.tsx`, `round-content.ts`,
  `line-up-entry-names.ts` (the window) and `translation.ts`. Step 3 rewrites
  any of them it needs.
- **`lights-game.test.ts` pins the window at 1.2 s and the seed** to the first
  whose opening light carries a trap, through a mock of `lightsContent`; the
  floor and the grace are the real ones. Ten cases, nine guards each seen red
  under a mutation: the window's opening (a trap tapped in the countdown), the
  floor, the step, a trap moving the count, the grace, the share of the best,
  the latecomer, the tick, the pause.

## Step 3 — the screens

Starts with the `impeccable` skill: direction pages for Adrien to pick, each
a whole example page with real content — the board on a seat, the race on
the wall with 24 bars, the reveal — linked from one index page. Then:

- the seat's board, full screen at phone width, a cell lit on
  `onPressStart` as Reflex's buzzer does, two fingers at once allowed; the
  freezes and the trap marked by shape;
- the keyboard of _The keyboard_, its labels on a device with keys only;
- the wall's race, every count arriving on the tick and the bars easing
  between two ticks; a trap flashing on its seat's bar;
- the reveal: the bars stopped, hits and traps per seat, the share paid;
- the console's setup (the window, the traps), the shelf, its front door,
  the dictionary in three languages;
- every state filmed: the countdown into the first light, a hit, a trap's
  freeze, the window closing.

### The direction, as chosen (19/11/2026)

Three directions were drawn (`.impeccable/directions/lights/`, local and
uncommitted): _tokens_ in a chipboard tray, _columns_ rising with a pawn on
top, and _a pawn race_ on printed tracks. Adrien took **the tokens**, with two
changes:

- **The board takes every pixel the seat's screen leaves**, width and height,
  so its cells are taller than wide on a phone held upright: a large finger on
  a small device is the case it is sized for. No square board with 400px
  empty above it. Nine cells still, the grid fixed, only their aspect follows
  the space.
- **A trap lays the seat's pawn down on its wall bar for the second it
  freezes**, borrowed from the pawn race, so the room sees who fell in.

The rest, from the tokens page:

- **The tray**: the board is a chipboard tray of nine recessed sockets
  (`--socket`, a dashed die-line). The lit cell is a coral token (`--primary`,
  edge `--primary-edge`, a printed dot and a keyline) set in its socket **on
  the frame it lights, with no entrance** — a reaction game measures that
  frame. The trap is a paper token (`--card`), hatched, with a bold printed
  cross: shape, never colour alone. A press sinks the token by its edge.
- **The freezes**: the whole tray hatched and its tokens gone; a trap's second
  drains a rule under the tray and stamps the trap's mark beside it, a miss's
  300ms only hatches.
- **The seat's head**: the hit count large (`monument`-scale, tabular), the
  window's groove draining beside it in the phase ink. Keyboard labels sit in
  a cell's corner on a paper key cap, on a device with keys only.
- **The wall**: one lane a seat in two columns of twelve (one column on a
  standing wall): pawn, name on one line ending on an ellipsis, then the bar
  notched every five hits and the count at its tip. Lanes keep seat order
  during the race, so nobody's bar jumps rows four times a second; the bar's
  width eases over the 250ms between two publishes. A trap hatches the bar
  and lays the pawn down for a second.
- **The reveal**: the lanes ranked — place, pawn, name, bar, hits, traps with
  the cross mark, the payout token — under the winner's name.
- **A duel**: the two lanes alone across the wall, at billboard size.

## How to tell it is done

Muted, with `MAX_PLAYERS_PER_ROOM` seats with long names at phone width and a
paired wall: every seat chases the same run; a seat's board lights at the
same instant as the wall's countdown ends, within the clock's estimate; a hit
past the window is not counted; a trap darkens the board for a second; a
laptop plays the whole round from its keys; the wall's bars climb without a
cut and never scroll.
