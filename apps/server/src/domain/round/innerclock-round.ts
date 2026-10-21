import { Result } from '@adrienlcp/result'

import type { PlayerId, RoundId } from '@melee/protocol/identifiers'

import { pointsForGap } from '@melee/core/innerclock/gap-pay'
import { drawTargetSeconds } from '@melee/core/innerclock/target'
import {
  type BuzzRejection,
  findBuzzRejection
} from '@melee/core/round/buzz-eligibility'
import {
  hasJoinedAfterStart,
  isExpectedInRound
} from '@melee/core/round/round-roster'

import type { Room, Round } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'

/** The count the host typed, or one drawn for a round nobody pressed for. */
export const innerclockContent = (
  targetSeconds: number | undefined
): Round['content'] => ({
  kind: 'innerclock',
  presses: [],
  targetSeconds: targetSeconds ?? drawTargetSeconds()
})

/** Where the count is measured from, and `null` for a round that is not one. */
const innerclockOf = (round: Round | null) =>
  round?.content.kind === 'innerclock' ? round.content : null

/** One press per seat, stamped on arrival: the press carries no time of its own. */
export const registerInnerclockPress = ({
  now,
  playerId,
  room,
  roundId
}: {
  now: number
  playerId: PlayerId
  room: Room
  roundId: RoundId
}): Result<void, BuzzRejection> => {
  const round = room.round
  const content = innerclockOf(round)

  if (round === null || content === null) {
    return Result.failure('wrong_phase')
  }

  const rejection = findBuzzRejection({
    claimedRoundId: roundId,
    currentRoundId: round.id,
    hasActiveBuzz: content.presses.some((press) => press.playerId === playerId),
    isLockedOut: false,
    phase: room.phase
  })

  if (rejection !== null) {
    return Result.failure(rejection)
  }

  if (
    hasJoinedAfterStart({
      openedWithPlayerIds: round.openedWithPlayerIds,
      playerId
    })
  ) {
    return Result.failure('joined_mid_round')
  }

  content.presses.push({ atServerTime: now, playerId })
  touch(room, now)

  return Result.success()
}

/** Whether every seat the round still expects has stopped counting. */
export const everyoneHasCounted = (room: Room, now: number): boolean => {
  const round = room.round
  const content = innerclockOf(round)

  if (round === null || content === null) {
    return false
  }

  const expected = [...room.players.values()].filter((participant) =>
    isExpectedInRound({
      now,
      openedWithPlayerIds: round.openedWithPlayerIds,
      participant
    })
  )
  const pressed = new Set(content.presses.map((press) => press.playerId))

  return (
    expected.length > 0 &&
    expected.every((participant) => pressed.has(participant.id))
  )
}

/**
 * Pays every press its gap to the target, before the round is revealed. A seat
 * that never pressed is paid nothing and holds no award, the way a player who
 * never answered holds none in any other game.
 */
export const payInnerclockCounts = (room: Room): void => {
  const round = room.round
  const content = innerclockOf(round)

  if (round === null || content === null || round.startsAt === null) {
    return
  }

  const targetMs = content.targetSeconds * 1_000

  for (const press of content.presses) {
    const points = pointsForGap({
      countedMs: press.atServerTime - round.startsAt,
      targetMs
    })
    const participant = room.players.get(press.playerId)

    if (participant !== undefined) {
      participant.score += points
    }

    round.awards.push({
      playerId: press.playerId,
      points,
      speedBonus: 0,
      verdict: { isCorrect: points > 0, kind: 'single' }
    })
  }
}
