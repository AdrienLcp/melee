import type { LettersVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'

/** The shortest word that pays: three letters or fewer are found in any draw. */
export const SHORTEST_PAID_LENGTH = 4

const UNPAID_LETTERS = SHORTEST_PAID_LENGTH - 1

type Lengths = Pick<LettersVerdict, 'bestLength' | 'length'>

/**
 * What a seat's longest word earns on the round's scale, before the clock
 * takes its tenth: `(length − 3) / (best − 3)`, relative to the draw so a hard
 * draw is not a poor round. Only a word as long as the draw's longest earns
 * the whole round, so it alone races for the clock's tenth.
 */
export const pointsForLetters = ({ bestLength, length }: Lengths): number =>
  length < SHORTEST_PAID_LENGTH
    ? 0
    : paidShare(
        (length - UNPAID_LETTERS) / Math.max(bestLength - UNPAID_LETTERS, 1)
      )

/** Whether a seat's word is as long as the draw's longest: nothing longer can be sent. */
export const isLongestInDraw = ({ bestLength, length }: Lengths): boolean =>
  length >= bestLength
