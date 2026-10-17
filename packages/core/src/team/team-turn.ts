import type { GameKind } from '@melee/protocol/game'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { AnswerMode, RoundTurn } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { capabilitiesOf } from '../room/game-capabilities'
import { teamOfSeat } from './team-board'

/**
 * Whether a round of this game could be one team's while the others watch. A
 * race cannot be — the buzzer mode, the bare buzzer and the reflex race are
 * decided *between* players — and one team is not a set.
 */
export const canPlayByTeam = ({
  game,
  mode,
  teamCount
}: {
  game: GameKind | null
  mode: AnswerMode
  teamCount: number
}): boolean =>
  game !== null &&
  capabilitiesOf(game).playsInTeamTurns &&
  mode !== 'buzzer' &&
  teamCount > 1

/** Whether a set still owes a team its round after this one. */
export const hasTurnsAfter = (turn: RoundTurn | null): boolean =>
  turn !== null && turn.index < turn.of - 1

/**
 * Whether the wall may answer this round for the team on turn: only in a
 * team's round, everyone-at-once, of a game whose capabilities say so.
 */
export const wallAnswersRound = ({
  answerMode,
  game,
  turn
}: {
  answerMode: AnswerMode
  game: GameKind
  turn: RoundTurn | null
}): boolean =>
  turn !== null && answerMode !== 'buzzer' && capabilitiesOf(game).wallAnswers

/** Whether this seat plays the round: everyone does unless it is another team's turn. */
export const playsThisTurn = ({
  seatId,
  teams,
  turn
}: {
  seatId: PlayerId | null
  teams: readonly Team[]
  turn: RoundTurn | null
}): boolean =>
  turn === null || teamOfSeat({ playerId: seatId, teams })?.id === turn.teamId
