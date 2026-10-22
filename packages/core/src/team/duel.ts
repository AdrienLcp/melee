import type { GameKind } from '@melee/protocol/game'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { AnswerMode, RoundDuel } from '@melee/protocol/room'

import { capabilitiesOf } from '../room/game-capabilities'

/**
 * Whether a round of this game could be a duel while the room watches. A race
 * cannot — the buzzer mode, the bare buzzer and the reflex race are decided
 * *between* players — and one team has nobody to duel.
 */
export const canPlayDuel = ({
  game,
  mode,
  teamCount
}: {
  game: GameKind | null
  mode: AnswerMode
  teamCount: number
}): boolean =>
  game !== null &&
  capabilitiesOf(game).playsDuels &&
  mode !== 'buzzer' &&
  teamCount > 1

/** Whether this seat plays the round: everyone does, unless it is a duel between two others. */
export const playsThisRound = ({
  duel,
  seatId
}: {
  duel: RoundDuel | null
  seatId: PlayerId | null
}): boolean =>
  duel === null || (seatId !== null && duel.seatIds.includes(seatId))
