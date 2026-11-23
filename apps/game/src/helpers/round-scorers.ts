import type { Award } from '@melee/protocol/scoring'

import { byBetterAnswer } from '@melee/core/board/answer-order'
import { answerPointsOf } from '@melee/core/board/answer-points'

/** How many of a round's scorers stand on its podium. */
export const PODIUM_PLACES = 3

/**
 * The seats a round paid, best first. On a track the round ranks on the
 * answer, never on the squares walked: the finish stops a perfect answer one
 * square from home at +1, beside a near one that walked +1 honestly, and the
 * clock only parts two answers alike. On points, on what the round paid.
 */
export const roundScorers = ({
  awards,
  isOnTrack
}: {
  awards: readonly Award[]
  isOnTrack: boolean
}): Award[] =>
  awards
    .filter((award) =>
      isOnTrack ? answerPointsOf(award) > 0 : award.points > 0
    )
    .toSorted((left, right) =>
      isOnTrack ? byBetterAnswer(left, right) : right.points - left.points
    )
