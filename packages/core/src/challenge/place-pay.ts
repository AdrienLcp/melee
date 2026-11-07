import type { ChallengePlace } from '@melee/protocol/challenge'

import { thirdsOfARound } from '../scoring/round-share'

/**
 * Decision 19: a fixed scale, so placing a team is one press — the whole
 * round, two thirds and one third of it.
 */
const POINTS_BY_PLACE = {
  1: 3,
  2: 2,
  3: 1
} as const satisfies Record<ChallengePlace, number>

/** What a finisher of a challenge is paid, in the board's units. */
export const pointsForPlace = (place: ChallengePlace): number =>
  thirdsOfARound(POINTS_BY_PLACE[place])
