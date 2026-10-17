# a — Teams in the shell

**Goal.** Any game can be played in teams when the host turns Teams on. Games
keep reporting per-seat results; the shell groups seats into teams and sums
per team. Nothing in a game's arm learns what a team is.

This is the catalogue's *team relay* shape arriving through the shell rather
than through one game, which is why it is a room setting and not a game's.

## Protocol (`packages/protocol`)

- `room.ts` — `settings.teams`: a discriminated union on `kind`:
  `{ kind: 'off' }`, `{ kind: 'drawn', count }` (2–6) and
  `{ kind: 'teamsOnly' }`. It is a room setting by the three-owner test in
  `docs/game-catalogue.md`: true of any game, in any mode.
- `teamSchema` `{ id, name, colour, seatIds }` and `teams` on
  `baseRoomViewSchema` — public, every role reads it: a team is never hidden
  information.
- New host frames: `host.drawTeams { assignment }`, `host.renameTeam`,
  `host.moveSeat { seatId, teamId }`, and `host.adjustScore { teamId | seatId,
  points }` — Gamenight's `score.adjust`, which Taverla never had and which
  the board and aloud answers both need.
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
  verdict; seat scores stay what they are, for the podium and the booby prize.

## App

- `host/` — the lobby gains a Teams strip (off / drawn / teams only), the team
  count, *Draw*, *Re-draw*, rename, move by drag or menu.
- Wall and console — the roster grouped by team; the score track and the final
  board rank teams, pseudos under them.
- `player/` — the phone shows its team's name and colour from the draw on.
- i18n — `team.*` in the shell's namespace; the drawn names (a list per
  locale) are dictionary values.

## Done when

Twelve tabs drawn into three teams, re-drawn, one moved, a late tab lands in
the smallest team; a quiz round and a blind-test round score per team on the
console, the wall and the phones. Socket suite `teams.test.ts` covers the
partition check, the late seat and the mean, each broken once on purpose.
