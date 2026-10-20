import type { ChallengePlace } from '@melee/protocol/challenge'
import { POINT } from '@melee/protocol/scoring'

/**
 * Decision 19: a fixed scale, so placing a team is one press. On a track it is
 * three, two and one cases, under the one-point-one-case rule.
 */
const POINTS_BY_PLACE = {
  1: 3,
  2: 2,
  3: 1
} as const satisfies Record<ChallengePlace, number>

/** What a finisher of a challenge is paid, in the board's units. */
export const pointsForPlace = (place: ChallengePlace): number =>
  POINTS_BY_PLACE[place] * POINT
