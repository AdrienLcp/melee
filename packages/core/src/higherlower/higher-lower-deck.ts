import type { HigherLowerDeckItem } from '@melee/protocol/deck'

import { normalizeAnswer } from '../round/answer-matching'
import { MIN_PAIR_RATIO } from './pair-deal'

const ratioOf = ({ left, right }: HigherLowerDeckItem): number =>
  Math.max(left.value, right.value) / Math.min(left.value, right.value)

/**
 * Everything wrong with a higher or lower deck, each problem led by its path:
 * two sides of one name, and two values closer than the bank's own
 * `MIN_PAIR_RATIO` — a tie has no higher side, and a near one is a coin toss
 * a table cannot know. Empty when the deck holds.
 */
export const higherLowerDeckProblems = ({
  items,
  path
}: {
  items: readonly HigherLowerDeckItem[]
  path: string
}): string[] =>
  items.flatMap((item, index) => {
    const at = `${path}.items[${index}]`
    const ratio = ratioOf(item)

    return [
      ...(normalizeAnswer(item.left.name) === normalizeAnswer(item.right.name)
        ? [`${at}.right.name: both sides are “${item.left.name}”.`]
        : []),
      ...(ratio < MIN_PAIR_RATIO
        ? [
            `${at}: ${item.left.value} against ${item.right.value} is ${ratio === 1 ? 'a tie' : 'a near tie'} — the larger must be at least ×${MIN_PAIR_RATIO} the smaller, or the pick is a coin toss.`
          ]
        : [])
    ]
  })
