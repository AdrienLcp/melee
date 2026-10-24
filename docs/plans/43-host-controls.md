# 43 — Host controls

**In progress** — step 1 done. Asked 24/10/2026. The room's screen never shows
a control, the host's controls are always on a screen only the host sees, in
one side panel, and the *This screen is the room's* switch goes away.

## Three setups, two roles

- **Phones only**: one phone opens the table and is the console; its owner can
  take a seat wherever no verdict is owed.
- **A computer on the TV, and phones**: the computer becomes the wall, and the
  console moves to a phone (step 4).
- **Two screens**: the console on the computer, the wall on the TV.

The switch serves none of them on its own. Two alternatives were rejected: a
*presentation mode* on one device, because the host needs controls mid-round
and would toggle it in front of everyone every round; and configuring before
the room opens, because the code goes up first so people join while the host
chooses.

## Step 1 — can every game be played on phones alone? (done)

Yes. Each round's public content (`roundContentSchema`,
`packages/protocol/src/room.ts`) is in the view every player receives. The
wall's schema adds only the blind test's `audioUrl` and the slate's correction
pile. With no wall the console is the speaker
(`isSpeaker = view?.isWallConnected !== true`, `host-console-page.tsx`), for
the clip and the buzz cue alike.

| Game | Modes | On a player's screen |
|---|---|---|
| Blind test | typed, choice, buzzer | the four tiles; in buzzer mode a button, since the clip is the question |
| Quiz (flags, rebus) | typed, choice, buzzer | the question, flag or rebus in every mode, buzzer included |
| Buzzer | buzzer | a button: the host asks aloud and the server never learns it |
| Challenge | buzzer | the host's line, or *untitled* when none was typed |
| Reflex | buzzer | each screen flips itself from `flipsAt` |
| Inner clock | buzzer | the target, at countdown and on the press screen |
| Slate | typed | the item, your line, your verdict, the key; the grouped answers go to host and wall only, which is social, not needed |
| World map | point | the prompt and the map |
| Timeline | order | the five events |
| Matchsticks | move, buzzer | the equation with movable sticks; above the buzzer in buzzer mode |

Every reveal shows the answer, your points and the board.

**Two gaps, both bugs to fix (step 2):**

- **A duel's spectators see nothing of it.** Seats outside the duel get a notice
  naming the two duellists (`team.duel.title`, `player-round.tsx`), never the
  question: the round was meant to be watched on the wall. With no wall the room
  reads over a duellist's shoulder. Spectators should see the question
  read-only.
- **A challenge in the `buzzed` phase** falls through to the plain `Buzzer`,
  which does not draw the host's line.

**Seat refusal today** (`host-seat.tsx`, `isSeatWithheldByMode` in
`packages/core/src/room/game-modes.ts`): a quiz, blind test or matchsticks left
on `buzzer` replaces the seat form with `host.seat.judged` (*You judge the
buzzes, so there is no seat here. Any other way to answer gives you one.*). The
bare buzzer, the challenge and the slate, judged in their only mode, render
nothing at all, so the host is never told why there is no seat. Step 7 answers
that.

## Next steps

2. Fix the two gaps above.
3. **One side panel for the host's settings**, starting with `/impeccable`:
   *Settings* (a popup today, cramped on desktop) and *Run the room*
   (`room-screen-presses.tsx`, a `Drawer`) become one panel, always beside the
   game on a wide screen and sliding in from the edge on a phone. The lobby's
   game picker belongs to it.
4. **Run the room from my phone**: a QR code and a link in the console's menu
   that hand the console to another device (it carries the host token, so only
   the console's menu shows it) and turn the current screen into the wall. Read
   `docs/realtime-protocol.md` (host token, wall pairing) first.
5. **Remove the switch** (`menu.roomScreen` in `app-menu.tsx`) and the
   `RoomScreenPresses` drawer once 3 and 4 cover them.
6. **Home page**: drop the game checkboxes, which duplicate the lobby's picker;
   home becomes *Open a table* plus a card per game linking to its page. Check
   first what the game front doors are for (search, shared links).
7. **Mark the modes that need a referee**: a small *Referee* label on the
   `buzzer` answer mode and on the Buzzer game's card, and one sentence where
   the host would take a seat in every judged room, the three silent games
   included. Not on a card that merely *offers* a judged mode.
