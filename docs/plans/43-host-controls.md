# 43 — Host controls

**Done** — steps 1 to 7. Asked 24/10/2026. The room's screen never shows
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

**Two gaps, both fixed in step 2:**

- **A duel's spectators see nothing of it.** Seats outside the duel get a notice
  naming the two duellists (`team.duel.title`, `player-round.tsx`), never the
  question: the round was meant to be watched on the wall. With no wall the room
  reads over a duellist's shoulder. Spectators should see the question
  read-only.
- **A challenge in the `buzzed` phase** falls through to the plain `Buzzer`,
  which does not draw the host's line.

Step 2 (done): a seat outside a duel is drawn the round read-only —
`WatchedDuel` in `player-round.tsx`: the four tiles printed through
`ChoosingRound` with no `onAnswer` (`PrintedChoices` moved to
`features/player/`), the question card, the map's prompt or the dealt cards —
and the four tiles are framed for it as for a player. The challenge's line
holds through `buzzed` as well as `playing`; the server refuses a buzz there,
so no real round reaches it. The duel badge now yields in `RoundChrome` rather
than clipping the round index and the score on a narrow screen.
`e2e/choice-fits.spec.ts` holds a spectator to the same floor as a player.

Step 3 (done): the settings leaflet (`SetupPopover`, `SetupFields`) and the
room screen's drawer (`RoomScreenPresses`, `Drawer`, `ActionSlot`) are gone,
replaced by `HostPanel` (`host-panel.tsx`) and its four tabs
(`setup-tabs.tsx`): *Games* — the lobby's shelf, moved off the stage, and the
planned games with their pages; *Table* — teams, board, judge, rounds, the
first two one line past the lobby (*No teams · No board, settled for this
game*); *Room* — hold, countdown, volume; *Players* — the roster with its ✕
and the seat, field full width and the press under it, now with *Give up the
seat* once taken. Wide, the panel stands on paper beside the stage, folds to
a rail and switches sides, both remembered (`melee:panel-folded`,
`melee:panel-side`) and never changed on their own. Narrow, a bottom bar with
*Play* first, each tab the whole screen; a console with no game yet opens on
*Games*, and the seated host's four tiles keep their bar-less screen. The
phase's presses stay under the stage. The room-screen mode keeps its wall face
with the panel beside it; its launch still deals drawn teams first. Direction
D of `.impeccable/directions/host-panel/` (local), approved 2026-10-24;
DESIGN.md § The setup holds the measures.

**Seat refusal today** (`host-seat.tsx`, `isSeatWithheldByMode` in
`packages/core/src/room/game-modes.ts`): a quiz, blind test or matchsticks left
on `buzzer` replaces the seat form with `host.seat.judged` (*You judge the
buzzes, so there is no seat here. Any other way to answer gives you one.*). The
bare buzzer, the challenge and the slate, judged in their only mode, render
nothing at all, so the host is never told why there is no seat. Step 7 answers
that.

## Next steps

2. ~~Fix the two gaps above.~~ Done.
3. ~~One side panel for the host's settings.~~ Done.
4. ~~Run the room from my phone.~~ Done: *Run the table from another screen*,
   folded under the console menu's wall doors (`HandOverDoor`), unfolds a
   square and *Copy the link* for `/host/:code#host=<token>`
   (`handOverUrlFor`). The fragment never reaches a server; the console that
   opens it keeps the token before its socket opens and wipes it from the
   address (`useHandedHostToken`), and its token claim displaces this one.
   Unfolding marks this console as handing over (`handOver` on the room
   actions), so the `host_already_connected` that follows sends it to
   `/wall/:code` — the path a console that came from the wall already took —
   instead of the refusal. The menu closes on any change of page, or it stayed
   open over the new wall. A seat the old console held stays with its old
   session.
5. ~~Remove the switch.~~ Done: `menu.roomScreen`, `melee:room-screen` and
   its legal line are gone, and so is everything the console drew as the
   wall — `isRoomScreen` on the stage controls and the room actions, the
   deal-first launch in `LobbyActions`, the board track beside the console.
   `TableLobby` is the wall's alone. `isAnswerFolded` stays, for a console
   that took over from the wall.
6. ~~Home page.~~ Done: the ticks are gone, and `GameShelf` draws the same
   spines as links to each game's page — the front doors stay, for search and
   for a link shared in a group chat, since each is a prerendered page with a
   head of its own. *Open a table* moved up from a sticky bar to a lid under
   the masthead and always opens with no game, the lobby's picker asking;
   `useCreateRoom` lost `playableFirst`, which only ordered several games.
7. ~~Mark the modes that need a referee.~~ Done, in the product's own word:
   *Host judges* (`host.judgedMark`), not *Referee* — the setup already says
   *A judge runs the room*. Under the label of every judged answer mode
   (`isJudgedByHost`), and as a keyline stamp on the lid of every game judged
   however it is answered (`isJudgedInEveryMode`: the Buzzer, the slate and
   the challenge — the plan named only the Buzzer, but the other two promise
   the same). `seatWithheldReason` replaced `isSeatWithheldByMode` and gives
   the seat a sentence for each of its four reasons — a judge, teams answering
   aloud, a judged mode, a judged game; a room with no game still says
   nothing. The Players tab no longer hides the seat from aloud teams in the
   lobby, or that sentence never showed.
8. ~~The podium.~~ Done (2026-10-28): with `isWallConnected`, `HostConsole`
   renders `HostPodium` instead of `HostPanel` — the same `SetupTabsProps`,
   `RoomStage` and `HostActions`, recomposed: `PodiumRoster` (seat rows over
   `usePointsRows`, the step `POINT`, printed 10), the round and `GameTab`'s
   running order in the middle, `TableTab` and `RoomTab` flat on the right,
   from `layout.podium` (64rem) up; below it, the roster in a `Disclosure`
   and the settings in a lazy `Sheet`. `StageControls.isRosterBeside` drops the
   lobby's invitation and seat list there. `choice-fits` measures the console
   without a wall, since the podium's columns scroll by design. **Open**: the
   seated host's question still stands beside its tiles on a wide screen (the
   framed page reads the viewport's ratio, not the column's), and the middle
   column is the old stage over the planned games, not yet the mock's
   expanded current and next rounds.
