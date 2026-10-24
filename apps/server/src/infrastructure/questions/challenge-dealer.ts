import type { ChallengeLabels } from '@melee/protocol/challenge'

import type { DealtChallengeLine, Room } from '@/domain/room/room'

import { drawChallengeLine, playedChallengeLineId } from './challenge-bank'

/** Any line but `after`, which the room is about to be dealt or has just been. */
const drawAfter = (
  room: Room,
  after: DealtChallengeLine | null
): DealtChallengeLine | null =>
  drawChallengeLine(
    after === null
      ? room.playedContentIds
      : new Set([...room.playedContentIds, playedChallengeLineId(after.id)])
  )

/**
 * Deals the line the next challenge round opens on, when the room plays the
 * challenge and holds none. Run wherever the game can become the challenge, so
 * the console always has one to show.
 */
export const keepChallengeAhead = (room: Room): void => {
  // A room stored before the field existed reads it as `undefined`.
  if (
    room.settings.game?.kind !== 'challenge' ||
    (room.nextChallenge ?? null) !== null
  ) {
    return
  }

  room.nextChallenge = drawAfter(room, null)
}

/**
 * Another line in place of the one held ahead. `false` when the bank holds no
 * other, and the one held ahead is kept rather than lost.
 */
export const redealChallenge = (room: Room): boolean => {
  const redealt = drawAfter(room, room.nextChallenge ?? null)

  if (redealt === null) {
    return false
  }

  room.nextChallenge = redealt

  return true
}

/**
 * The line a round nobody typed one for opens on: the one held ahead, marked
 * played as the round takes it, with the next one dealt behind it. `null` once
 * the bank is spent.
 */
export const takeChallengeLine = (room: Room): ChallengeLabels | null => {
  keepChallengeAhead(room)

  const line = room.nextChallenge ?? null

  if (line === null) {
    return null
  }

  room.playedContentIds.add(playedChallengeLineId(line.id))
  room.nextChallenge = drawAfter(room, line)

  return line.labels
}
