import type { MYSTERY_WORD_TRY_COUNT } from '@melee/protocol/mystery-word'

import { paidShare } from '../scoring/round-share'

/**
 * The share of the round a word found on each try earns, first try first. The
 * first two pay the same, because a first try that lands is luck.
 */
export const SHARE_BY_TRY = [1, 1, 0.85, 0.7, 0.55, 0.4] as const satisfies {
  length: typeof MYSTERY_WORD_TRY_COUNT
}

/**
 * What finding the word earns on the round's scale, before the clock takes
 * its tenth: the share its try earns, and nothing for a word never found.
 * Only the first two tries earn the whole round, so they alone race for the
 * clock's tenth — `clockedPay` pays no speed to an answer short of perfect.
 */
export const pointsForWord = ({
  foundOnTry
}: {
  /** Which try found the word, counted from one, or `null` when none did. */
  foundOnTry: number | null
}): number =>
  foundOnTry === null ? 0 : paidShare(SHARE_BY_TRY[foundOnTry - 1] ?? 0)
