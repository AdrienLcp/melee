import {
  CHALLENGE_HAND_SIZE,
  type ChallengeLabels
} from '@melee/protocol/challenge'

import {
  isDeckItemId,
  isOwnLineId,
  ownLineId
} from '@melee/core/room/evening-decks'

import type { DealtChallengeLine, Room } from '@/domain/room/room'
import { typedChallengeLabels } from '@/domain/round/challenge-round'
import {
  type EveningLine,
  unplayedEveningLines
} from '@/domain/round/deck-dealer'

import { drawChallengeLine, playedChallengeLineId } from './challenge-bank'

/** A room stored before the hand existed reads it as `undefined`. */
const handOf = (room: Room): DealtChallengeLine[] => {
  room.challengeHand ??= []

  return room.challengeHand
}

const isEveningLineId = (id: string): boolean =>
  isDeckItemId(id) || isOwnLineId(id)

/** An evening's line is remembered under its own id, a bank's under the bank's prefix. */
const playedIdOf = (line: DealtChallengeLine): string =>
  isEveningLineId(line.id) ? line.id : playedChallengeLineId(line.id)

/** The evening's lines ahead of the bank's, each side in the order it held. */
const eveningLinesFirst = (
  hand: DealtChallengeLine[]
): DealtChallengeLine[] => [
  ...hand.filter(({ id }) => isEveningLineId(id)),
  ...hand.filter(({ id }) => !isEveningLineId(id))
]

const dealtOf = ({ id, text }: EveningLine): DealtChallengeLine => ({
  id,
  labels: { en: text, fr: text }
})

const unplayedChallengeLines = (room: Room): EveningLine[] =>
  unplayedEveningLines({
    game: 'challenge',
    lineUpAt: room.settings.lineUpAt,
    room
  })

/**
 * Any line the room has neither played nor holds in its hand: the next the
 * evening brought — the entry's deck, then the host's own — then the bank's.
 */
const drawOutsideHand = (room: Room): DealtChallengeLine | null => {
  const held = new Set(handOf(room).map(({ id }) => id))
  const evening = unplayedChallengeLines(room).find(({ id }) => !held.has(id))

  return evening === undefined
    ? drawChallengeLine(
        new Set([...room.playedContentIds, ...handOf(room).map(playedIdOf)])
      )
    : dealtOf(evening)
}

/**
 * The hand in the dealing order: the first unplayed lines the evening brought,
 * as many as it holds, then as many of its bank lines as are left room for.
 * A line that stays keeps its slot, and one that arrives goes ahead of every
 * bank line and of every evening line dealt after it — so a deck switched to,
 * or a line written mid-evening, leads the hand while a hand that has not
 * changed is left exactly as the console shows it.
 */
const handInDealingOrder = (room: Room): DealtChallengeLine[] => {
  const leading = unplayedChallengeLines(room).slice(0, CHALLENGE_HAND_SIZE)
  const rankOf = new Map(leading.map(({ id }, rank) => [id, rank]))
  const hand = handOf(room)
  const bankSlots = CHALLENGE_HAND_SIZE - leading.length
  const bankKept = new Set(
    hand.filter(({ id }) => !isEveningLineId(id)).slice(0, bankSlots)
  )
  const kept = hand.filter((line) =>
    isEveningLineId(line.id) ? rankOf.has(line.id) : bankKept.has(line)
  )
  const held = new Set(kept.map(({ id }) => id))

  for (const [rank, line] of leading.entries()) {
    if (held.has(line.id)) {
      continue
    }

    const at = kept.findIndex(
      ({ id }) => (rankOf.get(id) ?? CHALLENGE_HAND_SIZE) > rank
    )

    kept.splice(at === -1 ? kept.length : at, 0, dealtOf(line))
  }

  return kept
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

  room.challengeHand = handInDealingOrder(room)

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
 * save one the evening brought, which is set aside for good, or it would lead
 * the hand again. A bank line dealt in an evening line's place goes behind
 * every evening line. `false` when nothing else is left to deal, and the line
 * is kept rather than lost.
 */
export const redealChallenge = (room: Room, at: number): boolean => {
  const hand = handOf(room)
  const line = hand[at]

  if (line === undefined) {
    return false
  }

  if (isEveningLineId(line.id) && drawOutsideHand(room) !== null) {
    room.playedContentIds.add(line.id)
  }

  const redealt = drawOutsideHand(room)

  if (redealt === null) {
    return false
  }

  hand[at] = redealt
  room.challengeHand = eveningLinesFirst(hand)

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

/**
 * A typed line, which is played like any line the host wrote when it is one:
 * it leaves the hand, and no later round deals it again.
 */
const takeTypedLine = (
  room: Room,
  text: string | undefined
): ChallengeLabels | undefined => {
  const labels = typedChallengeLabels(text)

  if (labels !== undefined && room.ownLines.challenge.includes(labels.en)) {
    room.playedContentIds.add(ownLineId({ game: 'challenge', text: labels.en }))
    keepChallengeAhead(room)
  }

  return labels
}

/** A typed line wins, then saying it aloud, then the hand. */
export const pickChallengeLabels = (
  room: Room,
  { at = 0, isSaidAloud = false, text }: ChallengePick
): ChallengeLabels | null =>
  takeTypedLine(room, text) ??
  (isSaidAloud ? null : takeChallengeLine(room, at))
