import type { PlayerId } from '@melee/protocol/identifiers'
import type { MostLikelyLabels } from '@melee/protocol/most-likely'

import {
  POINTS_FOR_VOTING_WITH_THE_ROOM,
  roomsChoice,
  tallyBallots
} from '@melee/core/mostlikely/tally'

import type { Room, Round } from '@/domain/room/room'

type MostLikelyContent = Extract<Round['content'], { kind: 'mostlikely' }>

export const mostLikelyContent = (
  labels: MostLikelyLabels
): MostLikelyContent => ({ ballots: [], kind: 'mostlikely', labels })

/** Whether `seatId` is a seat the round opened on, the only seats a ballot may name. */
export const isOnTheBallot = ({
  round,
  seatId
}: {
  round: Round
  seatId: PlayerId
}): boolean => round.openedWithPlayerIds?.has(seatId) ?? false

/**
 * Pays every ballot for the room's choice, before the round is revealed, and
 * rewrites each voter's verdict to match: grading at answer time cannot know
 * the majority. A seat that never voted holds no award, as in any other game.
 */
export const payBallotsWithTheRoom = (room: Room): void => {
  const round = room.round

  if (round?.content.kind !== 'mostlikely') {
    return
  }

  const chosen = roomsChoice(tallyBallots(round.content.ballots))

  for (const { playerId, seatId } of round.content.ballots) {
    const isCorrect = chosen.includes(seatId)
    const points = isCorrect ? POINTS_FOR_VOTING_WITH_THE_ROOM : 0
    const verdict = { isCorrect, kind: 'single' } as const
    const participant = room.players.get(playerId)
    const attempts = round.attempts.find((entry) => entry.playerId === playerId)

    if (participant !== undefined) {
      participant.score += points
    }

    if (attempts !== undefined) {
      attempts.verdict = verdict
    }

    round.awards.push({ playerId, points, speedBonus: 0, verdict })
  }
}
