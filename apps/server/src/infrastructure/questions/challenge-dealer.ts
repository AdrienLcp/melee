import {
  CHALLENGE_HAND_SIZE,
  type ChallengeLabels
} from '@melee/protocol/challenge'

import { isDeckItemId } from '@melee/core/room/evening-decks'

import type { DealtChallengeLine, Room } from '@/domain/room/room'
import { typedChallengeLabels } from '@/domain/round/challenge-round'
import { unplayedDeckLines } from '@/domain/round/deck-dealer'

import { drawChallengeLine, playedChallengeLineId } from './challenge-bank'

/** A room stored before the hand existed reads it as `undefined`. */
const handOf = (room: Room): DealtChallengeLine[] => {
  room.challengeHand ??= []

  return room.challengeHand
}

/** A deck's line is remembered under its own id, a bank's under the bank's prefix. */
const playedIdOf = (line: DealtChallengeLine): string =>
  isDeckItemId(line.id) ? line.id : playedChallengeLineId(line.id)

const deckLinesOutsideHand = (room: Room): DealtChallengeLine[] => {
  const held = new Set(handOf(room).map(({ id }) => id))

  return unplayedDeckLines({
    game: 'challenge',
    lineUpAt: room.settings.lineUpAt,
    room
  })
    .filter(({ id }) => !held.has(id))
    .map(({ id, text }) => ({ id, labels: { en: text, fr: text } }))
}

/**
 * Any line the room has neither played nor holds in its hand: the next of the
 * entry's deck while it has one, then the bank's.
 */
const drawOutsideHand = (room: Room): DealtChallengeLine | null =>
  deckLinesOutsideHand(room)[0] ??
  drawChallengeLine(
    new Set([...room.playedContentIds, ...handOf(room).map(playedIdOf)])
  )

/**
 * The hand less every line that no longer belongs in it: another entry's deck
 * lines, and the bank's while the entry's own deck still has lines to deal —
 * so a deck loaded, or an entry switched to, leads the hand at once.
 */
const handForCurrentDeck = (room: Room): DealtChallengeLine[] => {
  const current = new Set(
    unplayedDeckLines({
      game: 'challenge',
      lineUpAt: room.settings.lineUpAt,
      room
    }).map(({ id }) => id)
  )
  const isDeckLeft = deckLinesOutsideHand(room).length > 0

  return handOf(room).filter((line) =>
    isDeckItemId(line.id) ? current.has(line.id) : !isDeckLeft
  )
}

/**
 * Fills the hand the next challenge round is picked from, when the room plays
 * the challenge. Run wherever the game can become the challenge, so the
 * console always has lines to show.
 */
export const keepChallengeAhead = (room: Room): void => {
  if (room.settings.game?.kind !== 'challenge') {
    return
  }

  room.challengeHand = handForCurrentDeck(room)

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
 * Another line in place of the hand's line at `at`, which goes back unplayed —
 * save a deck's, which is set aside for good, or it would lead the hand again.
 * `false` when nothing else is left to deal, and the line is kept rather than lost.
 */
export const redealChallenge = (room: Room, at: number): boolean => {
  const hand = handOf(room)
  const line = hand[at]

  if (line === undefined) {
    return false
  }

  if (isDeckItemId(line.id) && drawOutsideHand(room) !== null) {
    room.playedContentIds.add(line.id)
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

  room.playedContentIds.add(playedIdOf(line))
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
