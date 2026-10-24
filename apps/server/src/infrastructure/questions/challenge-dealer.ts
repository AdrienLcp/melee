import {
  CHALLENGE_HAND_SIZE,
  type ChallengeLabels
} from '@melee/protocol/challenge'

import type { DealtChallengeLine, Room } from '@/domain/room/room'
import { typedChallengeLabels } from '@/domain/round/challenge-round'

import { drawChallengeLine, playedChallengeLineId } from './challenge-bank'

/** A room stored before the hand existed reads it as `undefined`. */
const handOf = (room: Room): DealtChallengeLine[] => {
  room.challengeHand ??= []

  return room.challengeHand
}

/** Any line the room has neither played nor holds in its hand. */
const drawOutsideHand = (room: Room): DealtChallengeLine | null =>
  drawChallengeLine(
    new Set([
      ...room.playedContentIds,
      ...handOf(room).map(({ id }) => playedChallengeLineId(id))
    ])
  )

/**
 * Fills the hand the next challenge round is picked from, when the room plays
 * the challenge. Run wherever the game can become the challenge, so the
 * console always has lines to show.
 */
export const keepChallengeAhead = (room: Room): void => {
  if (room.settings.game?.kind !== 'challenge') {
    return
  }

  const hand = handOf(room)

  while (hand.length < CHALLENGE_HAND_SIZE) {
    const line = drawOutsideHand(room)

    if (line === null) {
      return
    }

    hand.push(line)
  }
}

/**
 * Another line in place of the hand's line at `at`, which goes back unplayed.
 * `false` when the bank holds no other, and the line is kept rather than lost.
 */
export const redealChallenge = (room: Room, at: number): boolean => {
  const hand = handOf(room)

  if (at >= hand.length) {
    return false
  }

  const redealt = drawOutsideHand(room)

  if (redealt === null) {
    return false
  }

  hand[at] = redealt

  return true
}

/**
 * The line a round nobody typed one for opens on: the hand's at `at`, or its
 * first when that slot is empty, marked played as the round takes it and
 * dealt again behind it. `null` once the bank is spent.
 */
export const takeChallengeLine = (
  room: Room,
  at: number
): ChallengeLabels | null => {
  keepChallengeAhead(room)

  const hand = handOf(room)
  const slot = at < hand.length ? at : 0
  const line = hand[slot]

  if (line === undefined) {
    return null
  }

  room.playedContentIds.add(playedChallengeLineId(line.id))
  hand.splice(slot, 1)
  keepChallengeAhead(room)

  return line.labels
}

/** What the press opening a challenge round said its line is. */
export type ChallengePick = {
  /** The hand's slot an untyped round opens on, the first when absent. */
  at?: number
  /** The host announces the line, so the round opens on none. */
  isSaidAloud?: boolean
  text?: string
}

/** A typed line wins, then saying it aloud, then the hand. */
export const pickChallengeLabels = (
  room: Room,
  { at = 0, isSaidAloud = false, text }: ChallengePick
): ChallengeLabels | null =>
  typedChallengeLabels(text) ??
  (isSaidAloud ? null : takeChallengeLine(room, at))
