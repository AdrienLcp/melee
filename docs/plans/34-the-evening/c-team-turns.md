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

## Protocol

- `host.startRound` gains an optional `set: { order: TeamId[] }`; the server
  opens one round per team in that order, each with its own draw. Round view:
  `turn: { teamId, index, of } | null`.
- `round.content` is untouched: each round is the game's own arm.
- The wall may answer: in a team turn, `wall.answer` is accepted for the team
  on turn, through the same path as `player.answer`. The wall still receives
  no answer before the reveal, so the anti-leak tests stand; what changes is
  that it can *send*. Only games whose capability says so (`game-capabilities.ts`).
- Refusals `not_your_turn`, `wall_cannot_answer`.

## Who answers for a team

Working assumption (decision 4): the first submission from any member's phone
or from the wall counts, and the round closes on it. In a choice round that is
one press; a typed round keeps its guesses until the clock runs out.

## Rules

- `core/round/round-roster.ts` — a roster can be a team's seats.
- `core/team/set-order.ts` — the order teams play in: rotate who goes first
  from set to set, so no team always plays blind of the others' answers.
- The draw takes one question per team from the bank without repeats — the
  quiz and the map banks already draw without repeats per room.

## App

- Console — *Next round* offers *everyone at once* or *team by team*, defaulted
  by the game; during a set, *Blue plays (2 of 3)*.
- Wall — the team on turn in its colour around the round; its answer controls
  when the wall may answer.
- Phones — *your team plays* with the controls, or *Red plays* and the round
  read-only.

## Done when

A quiz set with three teams, each answering on a different surface (a phone, a
second phone, the wall), scored per team; the wall never receives an answer
before the reveal (extend `wall.test.ts`, broken once on purpose).
