import { Result } from '@adrienlcp/result'

import type { ChallengeFinisher } from '@melee/protocol/challenge'
import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PlayerId, RoundId } from '@melee/protocol/identifiers'
import type { Award } from '@melee/protocol/scoring'

import { pointsForPlace } from '@melee/core/challenge/place-pay'

import type { Room, Round, TeamAward } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'
import { seatsOf } from '@/domain/room/team-service'
import { revealRound } from '@/domain/round/round-service'

export type ChallengeRejection = Extract<
  ProtocolErrorCode,
  'invalid_message' | 'stale_round' | 'wrong_phase'
>

/** An empty line is no challenge: the host says that one aloud. */
export const challengeContent = (
  text: string | undefined
): Round['content'] => ({
  kind: 'challenge',
  text: text === undefined || text === '' ? null : text
})

/**
 * The host's word on who finished where. Sent while the table plays, it pays
 * and reveals; sent again on that reveal, it corrects it. The awards are
 * rebuilt from the placement rather than added to, and each score moves by the
 * difference from what the round had already paid — nothing is banked until
 * the next round opens, so the pawns redraw from the correction too.
 *
 * A placed team pays every seat it opened the round with the same points, and
 * a team answering as one is paid that once, so its round result is exactly
 * the place's pay and the pawn walks it on the reveal like any round's.
 */
export const awardChallengePlaces = ({
  now,
  places,
  room,
  roundId
}: {
  now: number
  places: readonly ChallengeFinisher[]
  room: Room
  roundId: RoundId
}): Result<void, ChallengeRejection> => {
  const round = room.round

  if (round === null || round.content.kind !== 'challenge') {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  if (room.phase !== 'playing' && room.phase !== 'revealed') {
    return Result.failure('wrong_phase')
  }

  const pay = payPerSeat({ places, room, round })

  if (pay === null) {
    return Result.failure('invalid_message')
  }

  round.awards = rebuildAwards({ pay, room, round })
  round.teamAwards = payPerSeatlessTeam({ places, room })

  if (room.phase === 'playing') {
    revealRound(room, now)
  } else {
    touch(room, now)
  }

  return Result.success()
}

/**
 * What each seat is owed, or `null` for a placement naming something the room
 * does not hold: a team in a room without teams, a seat in one that has them,
 * or the same finisher twice.
 */
const payPerSeat = ({
  places,
  room,
  round
}: {
  places: readonly ChallengeFinisher[]
  room: Room
  round: Round
}): Map<PlayerId, number> | null => {
  const playsInTeams = room.teams.length > 0
  const pay = new Map<PlayerId, number>()
  const placed = new Set<string>()

  for (const { place, target } of places) {
    const key = target.kind === 'team' ? target.teamId : target.playerId

    if (placed.has(key) || (target.kind === 'team') !== playsInTeams) {
      return null
    }

    placed.add(key)

    if (target.kind === 'seat') {
      if (!room.players.has(target.playerId)) {
        return null
      }

      pay.set(target.playerId, pointsForPlace(place))
      continue
    }

    if (!room.teams.some((team) => team.id === target.teamId)) {
      return null
    }

    for (const seat of seatsOf(room, target.teamId)) {
      if (round.openedWithPlayerIds?.has(seat.id) === true) {
        pay.set(seat.id, pointsForPlace(place))
      }
    }
  }

  return pay
}

/**
 * A table answering aloud has no seat to pay, so its placed teams are paid
 * straight — the same pay a seated team's round result comes to.
 */
const payPerSeatlessTeam = ({
  places,
  room
}: {
  places: readonly ChallengeFinisher[]
  room: Room
}): TeamAward[] =>
  room.settings.teams.kind === 'aloud'
    ? places.flatMap(({ place, target }) =>
        target.kind === 'team'
          ? [{ points: pointsForPlace(place), teamId: target.teamId }]
          : []
      )
    : []

const rebuildAwards = ({
  pay,
  room,
  round
}: {
  pay: ReadonlyMap<PlayerId, number>
  room: Room
  round: Round
}): Award[] => {
  for (const award of round.awards) {
    const participant = room.players.get(award.playerId)

    if (participant !== undefined) {
      participant.score -= award.points
    }
  }

  return [...pay].map(([playerId, points]) => {
    const participant = room.players.get(playerId)

    if (participant !== undefined) {
      participant.score += points
    }

    return {
      playerId,
      points,
      speedBonus: 0,
      verdict: { isCorrect: true, kind: 'single' }
    }
  })
}
