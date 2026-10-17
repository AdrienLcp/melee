# c — Team turns

**Goal.** A set: one game played by every team in turn, each with its own
question, the others watching the wall. Fair because every team faces the same
kind of challenge and never the same answer.

## The idea that keeps it small

A team's turn is **an ordinary round whose roster is that team's seats**. The
round already stamps who it opened on and refuses everyone else
(`joined_mid_round` today, `not_your_turn` here). A set is then N rounds in a
row, one per team, which the server sequences — not a new engine, and not a
`turns` array inside a round as Gamenight planned.

## Server — done

The wire is in `docs/realtime-protocol.md` (*A set is rounds played in turn*).
Where it left the first draft of this file:

- **`byTeam`, not `set: { order }`.** The host asks for sets on
  `host.startRound` and `host.nextRound`; the server orders the teams
  (`core/team/set-order.ts`) and keeps asking for sets until told otherwise,
  which is what the reveal hold opens the next round on.
- **The team answers as one** (decision 4): the first answer from a seat or the
  wall is banked for every seat of the turn, so a pick closes the turn and the
  team's mean is that answer's worth. No designated seat, no synthetic one.
- **A set is one round of the evening**: its turns share `round.index`.
- **No set in the buzzer mode**, nor where `playsInTeamTurns` says no: refused
  `invalid_message`. A round that cannot be a team's after all opens for
  everyone and ends the set.
- The roster is stamped in `round-service.ts` (`rosterOf`), not in
  `core/round/round-roster.ts`, which had nothing to learn.

## App

- Console — *Next round* offers *everyone at once* or *team by team*, defaulted
  by the game (`playsInTeamTurns`, and never in the buzzer mode); during a set,
  *Blue plays (2 of 3)*. `useLineUpDraw` must not draw while a set has turns
  left — a new game would end the set for the teams still waiting.
- Wall — the team on turn in its colour around the round; its answer controls
  when the wall may answer.
- Phones — *your team plays* with the controls, or *Red plays* and the round
  read-only.

## Done when

A quiz set with three teams, each answering on a different surface (a phone, a
second phone, the wall), scored per team; the wall never receives an answer
before the reveal (extend `wall.test.ts`, broken once on purpose).
