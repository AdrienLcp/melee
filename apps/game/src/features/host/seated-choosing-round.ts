import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoundView } from '@melee/protocol/room'

import { playsThisRound } from '@melee/core/team/duel'

/**
 * The seated host's four tiles, which take the screen the way a player's do:
 * the header, the footer and the standings fold away for as long as the round
 * runs, and the one control a round in play offers moves into the menu.
 */
export type SeatedChoosing = { round: RoundView; youId: PlayerId }

/**
 * The round a seated console answers on its own framed screen, or `null`
 * where it keeps the console's: a seat that arrived after the round opened is
 * refused the round anyway, a paused round shows the pause card and the
 * press that lifts it, which the framed screen has no room for, and a climb
 * draws its four names under its own ladder, which the framed screen's card
 * would leave out.
 */
export const seatedChoosingRound = (
  view: HostRoomView
): SeatedChoosing | null =>
  view.phase === 'playing' &&
  !view.isPaused &&
  view.round?.answerMode === 'choice' &&
  view.youId !== null &&
  view.round !== null &&
  view.round.content.kind !== 'fiveclues' &&
  !view.round.joinedAfterStart &&
  playsThisRound({ duel: view.round.duel, seatId: view.youId })
    ? { round: view.round, youId: view.youId }
    : null
