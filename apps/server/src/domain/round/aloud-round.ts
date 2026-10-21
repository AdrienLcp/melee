import { Result } from '@adrienlcp/result'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { RoundId } from '@melee/protocol/identifiers'
import type { TeamVerdict } from '@melee/protocol/team'

import { pointsFor, verdictKindFor } from '@melee/core/scoring/verdict'

import type { Room, TeamAward } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'
import { closeRound } from '@/domain/round/round-service'

export type AloudRejection = Extract<
  ProtocolErrorCode,
  'invalid_message' | 'stale_round' | 'wrong_phase'
>

/**
 * The host's word on which teams had it, at a table answering aloud. Sent
 * while the round is open, it pays and ends it the way its game ends one —
 * the answer goes up with the scores; sent again on that reveal, it corrects
 * it, each team's pay rebuilt rather than added to. Nothing is banked until
 * the next round opens, so the pawns redraw from the correction too.
 *
 * The challenge is paid by `host.awardPlaces`, whose placings already name
 * teams: a podium is not a list of who had it.
 */
export const awardTeams = ({
  now,
  room,
  roundId,
  verdicts
}: {
  now: number
  room: Room
  roundId: RoundId
  verdicts: readonly TeamVerdict[]
}): Result<void, AloudRejection> => {
  const round = room.round

  if (
    round === null ||
    room.settings.teams.kind !== 'aloud' ||
    round.content.kind === 'challenge'
  ) {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  if (room.phase !== 'playing' && room.phase !== 'revealed') {
    return Result.failure('wrong_phase')
  }

  const awards = teamAwardsFor({
    room,
    verdictKind: verdictKindFor(round.content.kind),
    verdicts
  })

  if (awards === null) {
    return Result.failure('invalid_message')
  }

  round.teamAwards = awards

  if (room.phase === 'playing') {
    closeRound(room, now)
  } else {
    touch(room, now)
  }

  return Result.success()
}

/** `null` for a verdict naming a team twice, a team not there, or the wrong shape. */
const teamAwardsFor = ({
  room,
  verdictKind,
  verdicts
}: {
  room: Room
  verdictKind: TeamVerdict['verdict']['kind']
  verdicts: readonly TeamVerdict[]
}): TeamAward[] | null => {
  const named = new Set(verdicts.map(({ teamId }) => teamId))

  const isSound =
    named.size === verdicts.length &&
    verdicts.every(
      ({ teamId, verdict }) =>
        verdict.kind === verdictKind &&
        room.teams.some((team) => team.id === teamId)
    )

  return isSound
    ? verdicts.map(({ teamId, verdict }) => ({
        points: pointsFor(verdict),
        teamId
      }))
    : null
}
