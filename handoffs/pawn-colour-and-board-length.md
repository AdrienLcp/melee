# A seat picks its pawn colour, and the board's length is in plain sight

Two "I can't find it" reports from the setup. One session. **`impeccable`
first**: both are about where a control lives and how it reads.

## 1. Pawn colour: every seat can choose, not only a team

> « On ne peut toujours pas choisir la couleur de son pion. Ou alors je ne
> trouve pas. »

He can't find it because, for the common case, it doesn't exist.

### What the triage verified

- **A seat has no colour.** `publicPlayerSchema`
  (`packages/protocol/src/room.ts:354-370`) and the server's `Participant`
  (`apps/server/src/domain/room/room.ts`, around :209) carry none. Only a team
  has one (`protocol/src/team.ts:74`, `RoomTeam.colour` room.ts:213).
- **With teams off** (the default `{ kind: 'off' }`, team.ts:115, so
  `room.teams` is empty), a pawn's colour is its roster place:
  `seatPawnColourOf = (seat % 12) + 1` (`packages/core/src/board/pawn-marks.ts:5-6`).
  - It is read by `pawnNumberOf` / `usePawnNumber`
    (`presentation/components/pawn.tsx:32-40`), `trackPawnNumberOf`
    (`track-pawn.tsx:25-26`) and `pawnMarksOf` (pawn-marks.ts:33).
  - `PawnColoursProvider` overrides it for seats in a team only
    (`pawn-colours.tsx:29-37`).
  - Teams also stand down at launch below three seats
    (`team-service.ts:359-388`).
- **Even with teams, the press is hard to find.** `4fafac63` built
  `TeamColourPress` (`presentation/components/team-colour-press.tsx`): a small
  outlined button with a palette icon and **no visible text** (:59-66).
  - **Player**: it sits in the head of the player's own team inside
    `LobbyTeams` (`player-teams.tsx:59-66`), drawn only in the lobby when
    teams exist (`player-round.tsx:456-457`), or mid-game for a `chosen` seat
    with no team yet (:420-431).
  - **Host**: lobby stage only, when the roster shows teams
    (`lobby-stage.tsx:132-135`, `:231-246`).
- **The server and the screens disagree.** The server takes a recolour in
  `lobby`, `revealed` and `finished` (`team-service.ts:205-209`), and the
  CHANGELOG says « in the lobby and between rounds ». No screen offers it
  outside the lobby.
- The handoff before `4fafac63` (`git show 4fafac63^:handoffs/team-colours.md`)
  left the solo case open (« weigh offering the same choice per seat … or leave
  it to teams »). Teams alone were built.

### Decided

1. **A seat holds a colour.**
   - `colour: pawnColourSchema` on `publicPlayerSchema`, and on `Participant`.
   - On join the seat takes the colour the screen asks for, if free, else the
     first free one (as `freeColourFor` does, team-service.ts:64).
   - `player.recolourSeat { colour }` and `host.recolourSeat { playerId, colour }`
     (the latter in `HOST_ONLY_MESSAGE_TYPES`), with the teams' phase rule:
     lobby, revealed, finished.
   - A colour another seat holds is refused `colour_taken` while some colour is
     still free. Past twelve seats repeats are unavoidable, and the initials on
     the pawn (`4fafac63`) already tell them apart.
   - Follow `.claude/rules/realtime-protocol.md` for the new messages.
2. **One source for a pawn's colour.** Its team's when the seat is in a team,
   else its own. `PawnColoursProvider` maps a seat with no team to
   `player.colour`, so the ~40 `<Pawn seat=…>` call sites don't change.
   `trackPawnNumberOf` and `pawnMarksOf` read it too. `seatPawnColourOf`
   survives only as the join default, if at all.
3. **The device remembers it**, beside `melee:nickname`: a `melee:pawn-colour`
   written from the colour the room **accepted**, and asked for on the next
   join. Whether it travels in the hello or as a recolour right after joining
   is the session's call. The hello's rule for names (a returning seat keeps
   what it holds) applies to colour too.
4. **Where it is chosen: the corner menu, at every phase.**
   - `AppMenu` is where the name is read back and changed. The colour goes
     beside it, as « Mon pion »: a labelled swatch row, not an icon alone.
   - While a round is playing, it shows why it is disabled, since the server
     refuses that phase.
   - Also in the lobby, on the player's own row.
   - With teams on, the same place recolours the team. A seat in a team that
     picks its own colour would change nothing on the track, so the control
     says it is the team's.
   - `TeamColourPress` becomes one press for a seat or a team, with a visible
     label.
5. **Tests**:
   - server `[teams]`/`[seats]` suites: join takes the asked colour or the
     first free; recolour is refused mid-round and refused when taken while
     one is free; it is projected to every view;
   - core: the pawn colour resolution.

   Break each once on purpose.

## 2. Board length: not gone, hidden

> « normalement on doit pouvoir changer le nombre de cases du plateau, j'ai
> l'impression que ça a disparu, pourquoi ? C'est où ? Je ne trouve pas. »

Nothing removed it. It hides behind a switch, a tab and a phase.

### What the triage verified

- **Protocol and server**: `board.length` runs 10–60, default 30
  (`packages/protocol/src/board.ts:11-12, 30-31, 53`). The server takes a
  change in the lobby and refuses it later with `wrong_phase`
  (`socket-handler.ts:2129-2140`).
- **UI**: `BoardSetup` (`apps/game/src/features/host/board-setup.tsx`) is a
  « Plateau » switch (:53-66). The « Longueur 20/30/40 » strip appears **only
  when the switch is on** (`board.kind === 'track'`, :67; strip :69-81).
- **Where**:
  - It is rendered only in `TableTab`, lobby only
    (`setup-tabs.tsx:345, 351, 362-366`). After the lobby it is one read-only
    line « plateau de N cases · Fixé pour la partie » (:368-385).
  - The console opens on « Jeu » (`host-console-page.tsx:876`), not « Table »
    (`dictionary-fr.ts:780`).
  - Beside a wall, the tab sits in the podium's side panel, or behind a
    controls icon on a narrow screen (`host-podium.tsx:64-75, 91-103, 137-156`).
- **The decoy**: the lobby stage shows a « Plateau » preview with no controls
  (`lobby-stage.tsx:104-113`), right where a host would look.
- **History**:
  - `f68c29a7` had one visible strip: « Sans, 20, 30, 40 cases ».
  - `e53950e3` (plan 41 step 4) split it into a switch plus a hidden length.
  - `a98d6fe6` (plan 43) moved it into the Table tab.

### Decided

1. **One control again**: « Plateau : Sans · 20 · 30 · 40 cases », the
   `f68c29a7` shape, replacing the switch and the hidden strip in
   `BoardSetup`. Check the protocol range against these steps; 10–60 allows
   more if the design wants it.
2. **The lobby's « Plateau » preview becomes the way in.** Pressing it opens
   the Table tab on that control. Wherever the tab is (side panel, sheet), it
   must be reachable from there.
3. Keep « Fixé pour la partie » after the lobby. A board changing length
   mid-game would move every pawn's distance to the finish.

## Verify

Muted browser (`docs/browser-driving.md`: `melee:volume` = `'0'` by init
script before the first navigation).

- Phone 9:16 player with teams off: the menu shows « Mon pion ». Pick a
  colour, and the pawn changes on the track on the wall and the console. A
  taken colour is refused with a readable reason.
- Reload: the colour is kept. A new room on the same device asks for it again.
- Teams on: the same place recolours the team.
- Console in the lobby, with and without a wall, at phone and desktop widths:
  the board's length is visible and changeable without opening the Table tab
  by guesswork.

Check a full table (`MAX_PLAYERS_PER_ROOM` = 24 seats, long names) wherever
the colour press sits on a row. Then `pnpm validate`, the CHANGELOG,
`apps/game/DESIGN.md` if the press's anatomy changes, this file deleted,
commit with `-- <paths>`, push.
