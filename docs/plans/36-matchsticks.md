# 36 — Matchsticks

**Done 21/10/2026**, sessions A1, A2, B1 and B2. A matchstick equation drawn in
seven-segment digits — `6 + 4 = 4` — that turns true when one stick moves, or
a number one moved stick makes the biggest or the smallest it can be. Asked for
the team evening on 21/10/2026. Played two ways: every screen moves its own
stick and the server judges it (`move`, the default), or the first to buzz says
the move aloud and the host judges (`buzzer`). Dealt and solved by the server,
so there is no bank and every puzzle has an answer.

## A1 — served (done 21/10/2026)

What was built, and where it left the plan above:

- **No bank for the equations either.** The server takes a true equation of
  two single digits, knocks it false with one random move, and the solver
  lists every move that makes it true again — so every equation is solvable by
  construction (moving the stick back) and the evening never runs out.
  `@melee/core/matchsticks/`: `glyphs.ts` (the seven-segment shapes; a `+` is
  two places `h` and `v`, a `-` the `h` alone, `=` never moves), `one-move.ts`
  (every one-stick move, the equation and number readers, `solutionsOf`) and
  `deal.ts`.
- **The smallest number is dealt too**, the twin the plan named: `goal` is
  `equation`, `biggest` or `smallest`, and the setting `goals` ticks which a
  room is dealt, one drawn per round (all three by default).
- **A number never takes a zero in front**, in an equation or as an answer: a
  smallest-number puzzle would otherwise always answer `0…`.
- **A round has a clock**, `roundDurationMs` (60 s by default, 10–180 s), and
  runs out into the reveal like a quiz question.
- `matchsticks` is in `gameKinds`, not `shelvedGames`; buzzer only, playable
  aloud, no team turns, the wall never answers. The host arm carries every
  solution (`null` for a seated console, which buzzer mode never grants), the
  public arm the puzzle and `revealedSolution`, the wall the kind alone.
  `PROTOCOL_VERSION` 37. `matchsticks-game.test.ts` checks the transcript of a
  player and of the wall, and was seen red with the move leaked.
- The app holds only what compiles: the name, the scoring line and the icon
  (a flame). Everything a screen draws is A2.

## A2 — the screens (done 21/10/2026)

- `MatchstickRow` (`presentation/components/`) draws any glyphs in sticks from
  `sticksOf`, in an SVG whose geometry is `helpers/matchstick-geometry.ts`:
  each match pale pine with a red head, every empty place printed as a faint
  groove so the seven segments read before a stick moves. Given a move it
  draws the stick travelling from its old place to its new one — the old place
  dashed in coral, the moved stick ringed in green — so the move reads with
  the motion collapsed too.
- `MatchsticksPrompt` puts the goal in words over the sticks
  (*Move one match to make it true*, *…the biggest number*, *…the smallest
  number*), on the console and wall card, above a player's buzzer, and with
  the solution at the reveal on every screen.
- **The puzzle stays up while the floor is taken** (`VerdictPanel`'s
  `stimulus`), since whoever buzzed points at a stick; the console prints every
  solution beside the two verdicts.
- The settings fold ticks the goals (unticking the last is not sent, since the
  room is dealt at least one) and the time per puzzle, 30, 60 or 120 s.
- Shelved last with a plum spine, `oklch(45% 0.14 305)`, the tagline *One match
  moves. Say which.*; **not in the game night preset** — it is judged by the
  host like the buzzer, and the preset already carries one game of that kind.
- Match tokens (`--match-wood`, `--match-edge`, `--match-head`) are printed
  pieces, the same in both palettes, and always laid on paper: the edge on
  `--card` is what `tokens-contrast.test.ts` holds to 3:1.
- Seen muted at 1280×800 and 390×844, light and dark, through a Playwright
  script (the MCP browsers were down): the shelf, the settings fold, an
  equation and a biggest-number round, the judge's view, the player's floor,
  and the reveal mid-move and settled. **Not seen**: a paired wall's floor,
  which draws the same stage without the verdicts.

## B1 — served (done 21/10/2026)

The stick moved on a screen, server, protocol and core only; the app holds what
compiles. Built on decisions taken for Adrien, listed here for him to settle:

- **A mode of its own, `move`, offered by matchsticks alone**, beside
  `buzzer`: `answerModes` is `['move', 'buzzer']`, and `move` is the default a
  room opens on (`DEFAULT_ANSWER_MODE`), so *play right away* works and a
  remembered buzzer is traded for it. `buzzer` is unchanged and host-judged.
  `isJudgedByHost` says no for `move` without a line of its own — the rule
  already keys on `buzzer`. `playsAloud` stays true (the buzzer still serves a
  table with no screens); **no team turns and no wall answer** this session,
  `playsInTeamTurns` and `wallAnswers` stay false.
- **`player.answer` `{ kind: 'move', move }`, one shot** like a pick or an
  order. `applyMove({ glyphs, move })` in `core/matchsticks/one-move` applies
  it — no stick where it is lifted, one already where it is laid, or a glyph
  left that is no digit or sign returns `null` — and `oneStickMoves` is now
  written as every stick place pair `applyMove` accepts, so the solver and the
  server cannot disagree; `one-move.test.ts` checks every pair of places both
  ways. **An illegal move is `illegal_move`, a new error code** (translated in
  both locales), and spends nothing: the shot is still the seat's.
- **The verdict is a fifth shape, `{ kind: 'move', placesFromBest }`**: `0` for
  a true equation or the best number, `1`, `2`… for the next distinct numbers
  one stick makes that improve on the dealt one, best first (two moves to the
  same number share a place), `null` for a false equation, a number no better,
  or no number at all. `core/matchsticks/move-pay` pays 3, 2 and 1 `POINT`s for
  places 0, 1 and 2, nothing below, the clock on top capped by the answer as
  everywhere. An equation has no second place: a true one is 3, anything else
  nothing.
- **The round closes when every stamped seat has moved, or on its
  `roundDurationMs`**, like the timeline. No lockouts.
- **What travels.** Before the reveal a seat reads back its own move as
  `yourMove` on the public arm, which survives a reload; nothing else of any
  seat's move, and **not its own `yourVerdict`** — the one departure from the
  timeline, which sends a seat its own pair count at once: a seat told its
  move was right could whisper it on with confidence. At the reveal
  `revealedMoves` carries every seat's `{ playerId, move, glyphs }` (the puzzle
  as the move left it), beside `revealedSolution`; a seat's `said` is those
  glyphs too. The host arm keeps every solution, `null` while seated. The wall
  arm is the kind alone. `PROTOCOL_VERSION` 41.
- **Tests.** `move-pay.test.ts` (ranks for biggest and smallest, the equation,
  the pay; seen red with the ranking reversed), `one-move.test.ts` (applyMove
  against the solver both ways; seen red with the empty-place check dropped),
  the room rules (judged on the buzzer only, play right away, the default).
  `matchsticks-game.test.ts` deals one fixed equation (`6+4=4`: a dealt one may
  have no wrong move at all, `4-1=2` among them) and plays a move round: a
  right move paid above a wrong one and the faster of two right ones more, an
  illegal move refused without spending the shot and a second refused, the
  round closing once all three have moved, a seated console paid, and every
  player's and the wall's whole transcript free of a solution, another seat's
  move and any verdict before the reveal — seen red with `revealedMoves`
  unguarded, with `yourVerdict` sent early, and with the illegal move answered
  `invalid_message`.
- The app names the mode (*Move the match*) and its scoring line in both
  dictionaries. **A room opens on `move` with nothing drawn for it yet** —
  that is B2.

## B2 — the screens (done 21/10/2026)

- **Tap to pick, tap to lay**, rather than a drag: a stick is 40×8 units and
  a drag a finger hides; two presses are the same on a pointer, a finger and a
  keyboard. `MatchstickBoard` (`presentation/components/`) lays a react-aria
  `Toolbar` over the drawing, one press per place held to the drawing's own
  proportions (`aspect-ratio` from `layoutOf`'s new numeric `box`): every
  stick a `ToggleButton` that picks it up, every empty place a `Button`
  enabled only while one is held. One tab stop, walked with the arrows in
  reading order (top, top left, top right, middle, bottom left, bottom right,
  bottom, glyph by glyph), each press named for a screen reader
  (*Match top right, in the 6 at position 1*).
- **Held**, the stick is drawn raised off its place with a shadow and a coral
  edge, and every empty groove takes a dashed die-line. **Laid**, the board
  gives way to the moved puzzle drawn still (`MatchstickRow`'s new `isStill`:
  the old place dashed in coral, the stick ringed in green), with *Put it
  back* and *Send the move* under it; focus goes to the send press, and back
  to the first stick after a put back.
- **A drop the sticks cannot make is refused before anything is sent**, by
  `applyMove`, the server's own rule: the stick stays held and the line under
  the card says `error.illegal_move`. The server's refusal of the same code is
  then never reached in practice; it stays for a client that skips the check.
- `MatchsticksMove` (`features/player/`) is the whole form and takes a `card`
  render prop, so the player's page and a seated console each lay the sticks
  on their own round card (`MatchsticksPrompt` now takes `children` in place
  of the drawn puzzle). After sending, and after a reload from `yourMove`, the
  card shows the move drawn where it landed and *Your move is in. Waiting for
  the others.*
- **The console and the wall** keep the puzzle on the card and the pawns that
  have answered under it, nothing of what they sent. At the reveal each seat's
  chip draws its move on a slip of paper in place of words — `6+4=10` in type
  is not what anybody looked at — ranked by `placesFromBest` through
  `nearnessOf`, and the narrow tally draws one slip per distinct result. A
  player's reveal adds **Your move: right / second best / third best /
  better, not by enough / not it** with their own move drawn under the
  solution.
- The settings fold already offered the strip (*Move the match* / *First to
  buzz*) from B1's `answerModesFor`; seen, nothing to add. The tagline is
  *One match moves. Find which.* and the description names both ways of
  playing, in both locales and in the document head.
- Seen muted through a Playwright script at 1280×800 and 390×844, light in
  English and dark in French: the game's page and the shelf, the settings
  strip, a stick held and laid by touch, an illegal drop refused, the moved
  puzzle and the sent state, the move read back after a reload, a second player
  playing by keyboard alone, the console waiting, the reveal on the console
  wide and narrow and on both players; a seated console by *Play right away*
  in dark, held, laid, sent and revealed. **Not seen**: a paired wall (it
  draws the console's stage without the form), and a real phone.

## For Adrien

- **Team turns and the wall answering** stay off for `move`
  (`playsInTeamTurns`, `wallAnswers` false): worth it only if the table asks.
- The chips draw a seat's move small (about 1.85em tall): readable on a
  laptop, small from across a room, where the solution above is the large one.
