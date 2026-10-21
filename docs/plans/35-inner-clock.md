# 35 — Inner clock

**Done** 21/10/2026, in one session. Asked by Adrien on 21/10/2026 for the team evening: the wall
says *count to 77 in your head*, a countdown, a start signal on every screen,
and then **nothing on any screen moves**. Each player presses once; the server
stamps the press on arrival and pays the gap to the target.

The eighth game, and the second whose round the server times rather than
judges. The reflex race ([18](18-reflex-race.md)) is the template: a buzzer-moded
round that settles on presses, never on a verdict, so every branch it carved
in `closeRound`, `openPhaseDurationMs` and the buzz route is carved again here.

## What it measures, and why the fifth guarantee is not needed

The reflex race measures a reaction of a few hundred milliseconds, so the
room's Wi-Fi was the same size as the thing measured and the stimulus had to be
scheduled on each device. Here the thing measured is tens of seconds and the
error a person makes counting is several of them; a link adds tens of
milliseconds. **Latency is negligible and nothing compensates for it**: the
start is the round's own `startsAt`, which the countdown already lands on every
device together, and a press is `atServerTime − startsAt` as it arrives.

## The key, the names

`innerclock` (the translation prefix too) — *Horloge interne*, *Inner clock*.

## The round

- **The target rides the press that opens the round**, like a challenge's
  line: `innerclockTargetSeconds` on `host.startRound` and `host.nextRound`,
  `10`–`180`. **By default it is random** (Adrien, 21/10/2026): the
  console's field starts on a draw between `20` and `60` inclusive
  (`MIN_DRAWN_TARGET_SECONDS` / `MAX_DRAWN_TARGET_SECONDS` in
  `core/innerclock/target.ts`, through `randomIntBetween`), a die beside it
  draws another on the spot, and a fresh one is drawn once the press is sent —
  never remembered from the last round, never stored in the host's setup. A
  round opened with no target (the reveal hold, *play right away*, an empty
  lobby's launch) gets the same draw on the server. The target is not a
  setting: the same number every round is a room that has already counted it
  once.
- **Answer mode `buzzer` only**, the same narrowing the reflex race does, and
  the press is `player.buzz` routed on the content as the reflex press is. Not
  judged by the host, so a seated host plays.
- **One press per seat.** A second is refused (`already_buzzed`), a press before
  `playing` is `wrong_phase`, a latecomer `joined_mid_round`.
- **The round closes** when every seat it opened on has pressed, or at the cap.
- **The cap is `target × 1.25`**, which is exactly where the pay below reaches
  nought: a press after it could only score nothing, so waiting longer buys a
  room staring at a frozen screen and nothing else. Twice the target would hold
  a 90-second round open for another 90; target + 30 s would be generous on a
  short count and mean on a long one. A seat that never pressed scores nothing
  and is named at the foot of the reveal.

## The scoring

**Linear in the relative gap, from 3 points on the dot to nought at a quarter
of the target off**, rounded once on the board's `POINT` scale.
`pointsForGap({ countedMs, targetMs })` in `packages/core/src/innerclock/`.

- **A distance, not a place.** The world map prices a distance; the challenge
  pays places because the server never sees what happened at the table. Here
  the server holds every count to the millisecond, so a place scale would throw
  away the one thing it knows: a room of good counters would pay a close
  second like a wild third, and a room of bad ones would pay the least bad 3.
- **Continuous rather than tiers**, because on a board in `POINT`s of a
  thousand two counts a tenth of a second apart are two different scores, the
  closer one higher — the same argument that made the speed bonus a curve.
- **Relative to the target**, because counting error grows with the count: a
  3-second miss counting to 20 is worse than one counting to 90, and an
  absolute scale would make the host's target choose how generous the round is.
- **3 points at most**, the price of a typed answer and of a marker inside the
  country: the hardest thing a round on this shelf asks pays the same.
- **Teams score the sum of their seats** (`teamRoundResult`, `answersAsOne`
  false): every seat counts in its own head.

## Nothing moves, and nothing leaks

- The player view's arm carries the target, **whether the reader has pressed**,
  and `revealedPresses: null` until the reveal. No other seat's press, and not
  even the reader's own time, reaches any screen before then: a player who knew
  they stopped at 74 s could say so aloud to the ones still counting.
- The host and wall arms carry nothing (`{ kind: 'innerclock' }`): the console
  shows no progress and no names pressing, because a name appearing mid-count is
  motion, and motion is a cue.
- `round.durationMs` is `null` (`roundDurationMsOf`), so no screen draws a bar;
  the cap lives in `openPhaseDurationMs`, as the reflex heat's does.
- **What a scripted client can do is not this game's to stop.** `startsAt` is on
  every view because the countdown needs it, so a device can always compute the
  elapsed time — exactly as a wristwatch under the table can. The guarantee is
  that the app shows nothing; the table polices the rest.

## The reveal

One row per seat the round opened on, ranked by the smallest absolute gap:
counted time to a tenth (*74,3 s*), the signed gap (*−2,7 s*), and what it paid.
Seats that never pressed close the list as *never pressed*.

## Checklist

- protocol: `gameKinds`, `shelvedGames` (last), settings arm `{ kind }`, three
  content arms, the target schema on two host frames, `PROTOCOL_VERSION` 35
- core: `innerclock/gap-pay.ts`, `innerclock/target.ts`,
  `innerclock/counted-board.ts`, each tested and broken once; capabilities,
  modes, round count, `isJudgedByHost`
- server: content, press, settle, close, cap; `innerclock-game.test.ts`
- game: stage, press, reveal, target field, settings, shelf, both dictionaries,
  spine colour (`DESIGN.md`)
- docs: `realtime-protocol.md`, `game-catalogue.md`, `CHANGELOG.md`, the register
- not in the `teamNight` preset: its twenty rounds split evenly over five games

## What the session settled

- **The press is `player.buzz`**, routed on the content in `socket-handler.ts`
  beside the reflex press, and settled in `domain/round/innerclock-round.ts`;
  `closeRound` pays the counts before revealing, `openPhaseDurationMs` holds
  the cap. No new message, no new error code.
- **The award is a `single` verdict**, `isCorrect` when it paid anything, and
  no speed bonus: the count already *is* the clock.
- **No team turns**, as for the reflex race: `playsInTeamTurns` is false and
  turns need a mode other than `buzzer` anyway. Every seat counts on its own,
  and a team's round is the sum.
- **The countdown shows the target, never the last reveal**, on the console
  and the phone: a count read while it is already running starts late.
- **The seated host presses on the stage**, a *Stop* button under the card
  whose slot keeps its height after the press, so nothing on the screen the
  table watches moves.
- **The board reuses the reflex chips** (`reaction-board.sass`): the place
  token, the pawn, the name, then the counted time, the signed gap and the
  pay; the seats that never pressed are the outlined rows at the foot.
- **An empty lobby launches with no field**: *play right away* and the reveal
  hold send no target, so the server draws one.
- **The spine is dusk**, `oklch(44% 0.08 235)` under `--on-spine`.

Seen muted (`melee:volume` `0` by init script, every context) at 1280 and 390:
the shelf with *Grande soirée*, the inner clock's door, the lobby with the
field and its die (six draws, all within 20–60), the countdown with the
target, the still playing stage — the console's DOM byte-identical across two
seconds of counting and across a player's press — the player's *Stop* before
and after, a seat that never pressed closing at the cap (12.3 s on a 10 s
count), a round closing on the last press, and the reveal on the console and
the phone. The wall was not opened on its own screen: it draws the console's
stage with no controls, the path the playing stage takes for a console with
no seat.
