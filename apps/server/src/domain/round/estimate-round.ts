import type { EstimateQuestion } from '@melee/protocol/estimate'

import {
  estimateVerdictsOf,
  pointsForEstimate
} from '@melee/core/estimate/estimate-pay'

import type { Room, Round } from '@/domain/room/room'

type EstimateContent = Extract<Round['content'], { kind: 'estimate' }>

export const estimateContent = ({
  question,
  value
}: {
  question: EstimateQuestion
  value: number
}): EstimateContent => ({ guesses: [], kind: 'estimate', question, value })

/**
 * Pays every guess by its place among the room's, before the round is
 * revealed, and rewrites each seat's verdict to match: grading at answer time
 * cannot know who else came closer. A seat that never sent holds no award, as
 * in any other game, and no speed bonus is paid — rushing an estimate is
 * guessing.
 */
export const payEstimatesByPlace = (room: Room): void => {
  const round = room.round

  if (round?.content.kind !== 'estimate') {
    return
  }

  const verdicts = estimateVerdictsOf({
    guesses: round.content.guesses,
    truth: round.content.value
  })

  for (const [playerId, verdict] of verdicts) {
    const points = pointsForEstimate(verdict)
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
