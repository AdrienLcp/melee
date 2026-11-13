import { Result } from '@adrienlcp/result'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PlayerId, RoundId } from '@melee/protocol/identifiers'
import type { RoundContent } from '@melee/protocol/room'
import type { ThinkAlikeGroup } from '@melee/protocol/think-alike'

import { crowdGroups } from '@melee/core/thinkalike/crowd-key'
import { matchesOf, pointsForMatch } from '@melee/core/thinkalike/crowd-pay'

import type { Room, Round } from '@/domain/room/room'
import { touch } from '@/domain/room/room-service'

type ThinkAlikeContent = Extract<Round['content'], { kind: 'thinkalike' }>

export type ThinkAlikeRejection = Extract<
  ProtocolErrorCode,
  'invalid_message' | 'stale_round' | 'wrong_phase'
>

export const thinkAlikeContent = (prompt: string): ThinkAlikeContent => ({
  answers: [],
  kind: 'thinkalike',
  merges: [],
  prompt
})

export const groupsOf = (content: ThinkAlikeContent): ThinkAlikeGroup[] =>
  crowdGroups({ answers: content.answers, merges: content.merges })

/**
 * The seats a round is matched over: the ones it opened on, or every seat that
 * sent when it never stamped any.
 */
const rosterOf = (round: Round): ReadonlySet<PlayerId> =>
  round.openedWithPlayerIds ??
  new Set(round.attempts.map(({ playerId }) => playerId))

/**
 * Pays every sent answer by how many of the other seats wrote it, and rewrites
 * each seat's verdict to match: grading as it is sent cannot know the room.
 * Run at the close and again on every merge, so a seat's score moves by the
 * difference with what the round already paid it. A seat that never sent
 * holds no award, as in any other game, and the clock pays nothing.
 */
export const payThinkAlike = (room: Room): void => {
  const round = room.round

  if (round?.content.kind !== 'thinkalike') {
    return
  }

  const matches = matchesOf({
    groups: groupsOf(round.content),
    roster: rosterOf(round)
  })

  round.awards = round.attempts.map((attempts) => {
    const verdict = {
      kind: 'match' as const,
      ...(matches.get(attempts.playerId) ?? { matched: 0, others: 0 })
    }
    const points = pointsForMatch(verdict)
    const paid =
      round.awards.find((award) => award.playerId === attempts.playerId)
        ?.points ?? 0
    const participant = room.players.get(attempts.playerId)

    if (participant !== undefined) {
      participant.score += points - paid
    }

    attempts.verdict = verdict

    return {
      isUnsent: attempts.isUnsent,
      playerId: attempts.playerId,
      points,
      speedBonus: 0,
      verdict
    }
  })
}

const revealedRoundIn = ({
  room,
  roundId
}: {
  room: Room
  roundId: RoundId
}): Result<ThinkAlikeContent, ThinkAlikeRejection> => {
  const round = room.round

  if (round === null || round.content.kind !== 'thinkalike') {
    return Result.failure('wrong_phase')
  }

  if (round.id !== roundId) {
    return Result.failure('stale_round')
  }

  if (room.phase !== 'revealed') {
    return Result.failure('wrong_phase')
  }

  return Result.success(round.content)
}

/**
 * The console putting one group into another at the reveal, paid again on the
 * spot. Both must be groups standing on their own: merging into a group that
 * was itself merged would make taking it back out two presses.
 */
export const mergeThinkAlikeGroups = ({
  from,
  into,
  now,
  room,
  roundId
}: {
  from: string
  into: string
  now: number
  room: Room
  roundId: RoundId
}): Result<void, ThinkAlikeRejection> => {
  const found = revealedRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const content = found.data
  const standing = new Set(groupsOf(content).map(({ key }) => key))

  if (from === into || !standing.has(from) || !standing.has(into)) {
    return Result.failure('invalid_message')
  }

  content.merges.push({ from, into })
  payThinkAlike(room)
  touch(room, now)

  return Result.success()
}

/** The console taking a merged group back out, with whatever was merged into it, and the round paid again. */
export const splitThinkAlikeGroup = ({
  key,
  now,
  room,
  roundId
}: {
  key: string
  now: number
  room: Room
  roundId: RoundId
}): Result<void, ThinkAlikeRejection> => {
  const found = revealedRoundIn({ room, roundId })

  if (found.status === 'failure') {
    return found
  }

  const content = found.data

  if (!content.merges.some(({ from }) => from === key)) {
    return Result.failure('invalid_message')
  }

  content.merges = content.merges.filter(({ from }) => from !== key)
  payThinkAlike(room)
  touch(room, now)

  return Result.success()
}

/**
 * The round as a seat, the wall or a console reads it. Every screen reads the
 * prompt; the reader reads its own answer, and nobody reads another's before
 * the reveal puts every answer up, grouped.
 */
export const thinkAlikeContentView = ({
  content,
  isRevealed,
  youId
}: {
  content: ThinkAlikeContent
  isRevealed: boolean
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'thinkalike' }> => ({
  groups: isRevealed ? groupsOf(content) : null,
  kind: 'thinkalike',
  prompt: content.prompt,
  yourAnswer:
    youId === null
      ? null
      : (content.answers.find(({ playerId }) => playerId === youId)?.text ??
        null)
})
