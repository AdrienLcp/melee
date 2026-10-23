# 41 — One table

**To do.** Asked 23/10/2026. Melee is one table: the host opens it, ticks one
game or several, and sets three things that do not depend on each other —
**teams or not**, **a board or not**, **a judge or not**. The game night stops
being a game on the shelf beside "or a single game"; it was a line-up the
model already treated as one more tick.

## Where it starts

- **The model is already one table.** Home opens a room on `game: null`; every
  game's front door opens a line-up of one; the only preset, `teamNight`
  (`apps/game/src/features/home/room-presets.ts`), is app data pre-ticking
  five games, 20 rounds, three drawn teams and a 40-case track. The server
  never branches on "is this an evening" — every such predicate is
  `lineUp.length > 1` on the client or in `core/room/`.
- **What is not one table is the front door and the copy.** `game-spines.tsx`
  shows `home.evening` (*Une soirée toute prête*, the preset box) above
  `home.games` (*Ou un seul jeu*): two doors on one mechanism.
- **The board is its own setting but only lives on teams.** `settings.board`
  (`packages/protocol/src/board.ts`) is documented "ignored by a room without
  teams"; the pawn position is `team.board`; the server advances teams only
  (`team-service.ts` `liveMoves`, `bankTeamRound`, `boardPositionOf`);
  `BoardTrack` takes `Team[]`; `teams-setup.tsx` `boardFor` turns the board
  off with the teams; `TableLobby` shows only for drawn or chosen teams.

## The shape

- **The games are ticked on home, behind one press.** The shelf becomes a
  list of ticks and one press whose label follows them: nothing ticked opens a
  table on no game, the picker in the lobby as today; one ticked plays that
  game exactly as before; several open a line-up. One place to choose, no
  click spent opening a table to choose in it. *I play too* is a switch under
  the press, where a game's two doors (for the group / play right away) were.
  The per-game pages stay, for a shared link and a search result, and open a
  table with their game ticked. Asked 23/10/2026: simple, quick, readable by
  everyone, nothing on screen that is not needed.
- **Home is direction B, *Le comptoir*** (chosen 23/10/2026): the wordmark and
  a small join box on top, the ticks as the page (two columns wide), and the
  press with *I play too* in a tray pinned to the bottom at every width. The
  promise, the pitch, the join hint, the shelf's lead line and the note under
  the press leave home. *Another screen in the room?* leaves the page for
  `AppMenu`, as two entries under *This device*: become the room's screen, and
  show a table's QR code. *Where you were* becomes one pill per held room
  inside the join box (the code, *Resume your table* or *your seat*, an
  arrow), under a dashed rule — getting into a room is one box.
- **No preset, no name for the evening.** The table is Melee; the games in it
  already have names. `room-presets.ts`, `PresetBox`, the `preset` arm of
  `createRoomRequestSchema` and its resolution in `roomSettingsFor` go. Ticking
  five games and choosing teams is two gestures, so a preset earns nothing a
  remembered setup does not. "Grande soirée", *Une soirée toute prête* and
  *Soirée en équipes* leave both dictionaries; "soirée" stays in the pitch
  (`home.promise`) as register, never as a mode.
- **Three independent switches in *Animer*.** The group now called *La
  soirée* becomes *La table*: games ticked, teams (off / drawn / chosen /
  aloud / one each), board (off / track), judge. Turning teams off no longer
  turns the board off.
- **A board without teams is a pawn per seat.** The track advances seats the
  way it advances teams, by the same strategy and catch-up. Protocol: a seat
  carries `board: BoardPosition | null` beside the team's, null when the board
  is off or the room plays in teams. Server: the track code in
  `team-service.ts` moves to a function over *pawns* (a team or a seat) and
  both call it. Client: `BoardTrack`, `TrackStrip`, `BoardMoves`, `Standings`
  and `TableLobby` take pawns rather than teams. A seat that joins mid-game
  starts on Départ; one that leaves takes its pawn with it.
- **One ticked game plays as it did before the game night existed.** Same
  lobby, the game's own round count and hold, no line-up, no *ready*, no
  table lid — the judge and the board are the only additions, both folded
  until asked for. The table lid (`TableLobby`) shows when the board is on or
  teams are drawn or chosen, not on teams alone.
- **What a console remembers.** Teams, board and judge are room-level: filed
  once in `HostPreferences`, whether one game or several is ticked, and laid
  over every new table. The line-up itself is not remembered — what to play
  tonight is decided tonight. `rememberSettings` stops skipping room-level
  prefs for an evening; `restoredSettings` loses its preset branch.
- `PROTOCOL_VERSION` moves (the preset leaves the request, the seat gains a
  board position); stored host preferences from before read board and teams
  as they were saved, and nothing else migrates.

## Not in this stage

- Renaming `evening` in code identifiers (`host.*.evening` keys, `isEvening`).
  Never displayed; a tidy-up of its own.
- A board between the tables of one evening, or saved across evenings.

## Order

1. Protocol and core: seat board position, pawn track, preset removed,
   preferences rule. Tests first, each seen red. **Done.** `POST /api/rooms`
   takes `games` (none, one, several) in place of `game` and `preset`;
   several open on the first, `ROUNDS_PER_TICKED_GAME` (4) a game and the
   reveal held for the host. `advanceOnTrack` and `isTrackFinished` take
   pawns (`PawnId` = a team or a seat); `buildScoreboard` ranks seats by case
   then score, as the teams' board does. `restoredSettings` lays the host's
   teams, board and judge over a table of several and gives way to the door's
   teams when the host's would refuse a game ticked (aloud over a slate);
   `rememberSettings` files them for every table. `PROTOCOL_VERSION` 44. The
   home preset box sends only its games until step 4 removes it.
2. Server: the track over pawns; a race, a slate and a judged buzzer round
   each move seat pawns. **Done.** `team-service.ts` walks the teams in a
   room that plays in teams and every seat otherwise (`trackPawnsOf`), save a
   seat that arrived after the round opened, which stands where it is until
   the next one. A seat banks its case on `Participant.bankedCase` as a team
   does, a host's correction to a seat moves its pawn, *play again* puts it
   back on Départ, and `isFinalRound` reads the seats' pawns beside the
   teams'.
3. Design pass (`impeccable`): home with one door, *La table* in *Animer*, the
   lid and the track with a pawn per seat at 15 and 24 seats. Directions shown
   as full example pages behind one index link before any screen is written.
4. Screens and copy in both dictionaries.

   **Home and menu done.** Home is the wordmark, the code box with a pill per
   held room, the ten games as ticks (`game-ticks.tsx`) and a sticky tray
   (`home-tray.tsx`): the press reads *Open a table*, *Play Quiz* or *Open the
   table* with a count, beside *I'm playing too* — off and explained when every
   ticked game is judged — and the name. The presets, the pitch and the two
   other-screen cards are gone; *Become the room's screen* and *Show a table's
   QR code* moved to a *This device* section of the menu, off a room. **Left:
   *La table* in *Animer*** — teams, board and judge as three independent
   switches (`boardFor` in `teams-setup.tsx` still ties board to teams), and
   the lobby read off board-or-teams. Mocks: `.impeccable/directions/one-table/`
   `animer.html`, `c-tete-de-course.html`.

## Done when

- Home ticks games behind one press and holds no preset; a game's own page
  opens a table with it ticked.
- The board without teams is direction C (*Tête de course*, chosen
  23/10/2026): coloured pawns only, three a case then `+n`, names on a podium
  and chips at the centre of the U between rounds; the presses sit inside the
  U at 390 rather than over its last cases.
- One game ticked, no board, no teams: the lobby, a round and the reveal look
  as they did before stage 34.
- No teams with the board on: 15 seats, a pawn each, move on the wall, the
  console and every phone after a round; a mid-round arrival starts on Départ.
- Teams with the board off: plays as teams do today, no track anywhere.
- Seen muted at 390, 1440 and 1920, light and dark.
- `pnpm validate` passes.
