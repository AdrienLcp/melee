# a — Teams in the shell

**Goal.** Any game can be played in teams when the host turns Teams on. Games
keep reporting per-seat results; the shell groups seats into teams and sums
per team. Nothing in a game's arm learns what a team is.

This is the catalogue's *team relay* shape arriving through the shell rather
than through one game, which is why it is a room setting and not a game's.

**State (17/10/2026).** Protocol, core and server have landed with
`teams.test.ts`; what is left is the **App** section below. The wire is
documented in `docs/realtime-protocol.md` (*Teams are the shell's*). Where the
build settled what this file left open:

- `host.moveSeat` and `host.adjustScore` name the seat `playerId`, like
  `host.removePlayer`; `adjustScore`'s `target` is `{kind:'team'|'seat'}`.
- A team's `name` is `null` until the host renames it, and every screen draws
  its dictionary's name for the team's colour — that list is the app's.
- Under `drawn`, a seat arriving in the lobby before the first deal waits for
  it; after the deal, or once the game runs, it is placed at once. Under
  `chosen`, a seat arriving after the start picks once; any seat still without
  a team when a round opens is placed by the late-seat rule.
- A team's score is banked as the next round opens or the board goes up, and
  the round on screen is added live. `host.playAgain` zeroes it and keeps the
  teams.

## Protocol (`packages/protocol`)

- `room.ts` — `settings.teams`: a discriminated union on `kind`:
  `{ kind: 'off' }`, `{ kind: 'drawn', count }` (2–6),
  `{ kind: 'chosen', count }` (2–6, each seat picks its team) and
  `{ kind: 'teamsOnly' }`. It is a room setting by the three-owner test in
  `docs/game-catalogue.md`: true of any game, in any mode.
- `teamSchema` `{ id, name, colour, seatIds }` and `teams` on
  `baseRoomViewSchema` — public, every role reads it: a team is never hidden
  information.
- New host frames: `host.drawTeams { assignment }`, `host.renameTeam`,
  `host.moveSeat { seatId, teamId }`, and `host.adjustScore { teamId | seatId,
  points }` — Gamenight's `score.adjust`, which Melee never had and which
  the board and aloud answers both need.
- New player frame: `player.chooseTeam { teamId }`, accepted in the lobby
  under `chosen` alone (`teams_locked` otherwise). A seat that has not chosen
  is placed by the late-seat rule when the host starts, so *Start* never
  waits on a phone.
- `PROTOCOL_VERSION` bump.

## Rules (`packages/core/src/team/`)

- `team-draw.ts` — the console draws (`shuffled` from `helpers/random.ts`)
  and sends the whole assignment; the server checks it is a partition of the
  current seats into non-empty teams whose sizes differ by at most one.
  Re-drawing is sending another.
- `late-seat.ts` — a seat arriving with Teams on joins the team with the
  fewest connected seats, ties to the lowest id, decided on the server so
  every screen agrees.
- `team-score.ts` — a team's round result from its seats' results. Working
  assumption: the **mean over the seats the round stamped** — the roster stamp
  already says who a round opened on, and a sum would pay the team of four
  over the team of three (decision 2).
- **Teams only** needs no team model at all: each team takes one seat named
  after itself, on one phone or on the wall. The setting only changes what
  the screens say (team names, no pseudos) and turns the line-up's defaults
  towards team turns.

## Server

- `room-service.ts` — the four frames, refused outside the lobby where the
  open decisions say so (`teams_locked`); a removed or departed seat leaves
  its team, an empty team keeps its place and pawn.
- Scoring calls `team-score.ts` after `settleSimultaneousRound` and after a
  verdict; seat scores stay what they are, for the individual podium.

## App

- `host/` — the lobby gains a Teams strip (off / drawn / chosen / teams
  only), the team count, *Draw*, *Re-draw*, rename, move by drag or menu.
- `player/` — under `chosen`, the lobby lists the teams with their colour and
  members, one press to join or switch.
- Wall and console — the roster grouped by team; the score track and the final
  board rank teams, pseudos under them.
- `player/` — the phone shows its team's name and colour from the draw on.
- i18n — `team.*` in the shell's namespace; the drawn names (a list per
  locale) are dictionary values.

## Done when

Twelve tabs drawn into three teams, re-drawn, one moved, a late tab lands in
the smallest team; the same twelve under `chosen` pick their teams, one never
does and is placed at *Start*; a quiz round and a blind-test round score per team on the
console, the wall and the phones. Socket suite `teams.test.ts` covers the
partition check, the late seat and the mean, each broken once on purpose.
