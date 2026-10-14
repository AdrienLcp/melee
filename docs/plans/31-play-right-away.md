# Stage 31 — play right away

Somebody alone with a game used to open a table, land in the lobby, type a name
into *Play too, as*, take the seat and press *Gather round*: four screens'
worth of presses to reach a question, on a lobby that is mostly a QR code and
eight empty sockets. The table they wanted was one they could start now and be
joined at later — which the server already allowed, since stage 17 lets a
latecomer keep a seat and play from the next round.

It is **not called solo**: the others can still come, so the choice offered is
*wait for the others* against *start now*.

The direction was chosen from two example pages, `.impeccable/directions/solo/`
(B, *two doors*, for the doors and the round; A, *the launch that adapts*, for
the lobby).

## What was built

- **Two doors of one weight** on a game's front door and on its lid, opened
  from a spine on the home shelf (a spine used to open the room in one press;
  it now opens the lid that holds both doors). *Open a table* is unchanged;
  *Play right away* wears the game's own colour, shows the remembered
  `taverla:nickname` with a *Change* under it, and asks for a name in place
  when the device has none — the button waits for it, and Enter is the press.
- **No protocol change.** The door creates the room, writes the seat's name
  where the console's `hello` reads it, and navigates with a history-state
  flag (`playRightAwayNavigation`). The console takes the flag on its first
  render and clears it from the history entry at once
  (`useTakePlayRightAway`), so a reload or a trip back through history starts
  nothing. The first view restores the host's setup for the game through
  `settingsToPlayRightAway`, then `host.startRound` goes out once the view
  holds the seat. A loader covers the lobby until the room has left it.
- **A remembered `buzzer` mode falls back to four choices**
  (`settingsToPlayRightAway`), because a judge cannot hold the seat the press
  asked for. Which games get the door is `canPlayRightAway`: some way of
  answering them owes nobody a verdict — the blind test, the quiz and the
  reflex race, never the buzzer or the slate, which show one line instead.
- **The empty lobby's launch** is *Play right away* while the roster is empty
  and the game lets its host play (`launchesWithHostSeated`); the seat form is
  hidden then, because the launch is the seat. One player arriving makes it
  the group's launch again. Stacked, the lobby puts the code and its square on
  one row, then the game, then the launch, and the sockets last.
- **Invite mid-game.** The seated host's four tiles had no way in on screen;
  `RoundChrome` takes an `invitation` slot and the console puts `InvitePiece`
  there — the square in miniature and the code, opening the whole invitation
  in a popover the round runs on under. The menu keeps its own.
- **An arrival is said.** `arrivedPlayers` diffs two rosters; the console shows
  `ArrivalNotice` just under its header for 4.5s, never over a control, in a polite live region, whenever a
  seat is taken while a game runs.

## Decisions taken in the session

- The flag rides history state rather than storage: storage would be found
  again by a reload, and the address would be shared.
- Choosing the fallback rewrites what the host remembers for the game — the
  game they played last was on four choices, and that is what the next room
  opens on.
- The game's front door keeps its two doors stacked: the lid is 44rem wide and
  side by side the large labels did not fit at 1440×900.
- No fourth e2e journey: `everyone-answers.spec.ts` now opens the blind test's
  lid before its *Open a table*, and the rules are tested in core.
- The optional *finished screen offers a group lobby* was not built.

## How to tell it is done

Driven muted at 1440×900 and 390×844: quiz door with and without a stored name
→ round 1 with *Invite* reachable; blind test door the same, clip armed; the
buzzer door shows no button; an empty lobby → *Play right away* → round 1; a
second player by raw socket mid-round → the notice, and they play round 2; a
quiz remembered on the buzzer opens on four choices.
