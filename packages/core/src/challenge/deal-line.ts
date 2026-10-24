import type { ChallengeCategory } from '@melee/protocol/challenge'

import { pickRandom } from '../helpers/random'

type Categorised = { category: ChallengeCategory; id: string }

/**
 * One line nobody in the room has been dealt, from another category than the
 * last round's when one is left — two *bring back* rounds in a row is a room
 * running the same lap twice — and from the same one rather than none at all.
 * A festive line is dealt only to a host who asked for them. `null` once
 * nothing is left.
 */
export const dealLine = <TLine extends Categorised>({
  avoidCategory,
  hasFestiveLines,
  lines,
  playedIds
}: {
  avoidCategory: ChallengeCategory | null
  hasFestiveLines: boolean
  lines: readonly TLine[]
  playedIds: ReadonlySet<string>
}): TLine | null => {
  const unplayed = lines.filter(
    ({ category, id }) =>
      !playedIds.has(id) && (hasFestiveLines || category !== 'festive')
  )
  const varied = unplayed.filter(({ category }) => category !== avoidCategory)

  return pickRandom(varied.length > 0 ? varied : unplayed)
}
