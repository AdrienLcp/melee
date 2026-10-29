import type { PlayerId } from '@melee/protocol/identifiers'
import type { Verdict } from '@melee/protocol/scoring'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { clockFeedback } from '@/infrastructure/browser'
import {
  currentDeadline,
  type Deadline,
  type TimedView,
  useLastSeconds
} from '@/presentation/timing/last-seconds'

const NUDGE_AT_SECOND = 3

type RacingView = TimedView & {
  round:
    | (NonNullable<TimedView['round']> & { lockedOutPlayerIds: PlayerId[] })
    | null
  youId: PlayerId | null
  yourVerdict: Verdict | null
}

/**
 * The deadline this seat is still racing against, and `null` once it is not:
 * an answer already given, a lockout, or a floor somebody else holds. A thumb
 * that has nothing left to do is not told the time.
 */
const racingDeadline = ({
  clock,
  view
}: {
  clock: ClockEstimate | null
  view: RacingView
}): Deadline | null => {
  const deadline = currentDeadline({ clock, view })
  const youId = view.youId

  if (deadline === null || youId === null) {
    return null
  }

  switch (deadline.kind) {
    case 'countdown':
      return null
    case 'floor':
      return view.round?.activeBuzz?.playerId === youId ? deadline : null
    case 'round':
      return view.yourVerdict === null &&
        view.round?.lockedOutPlayerIds.includes(youId) !== true
        ? deadline
        : null
    default:
      return deadline.kind satisfies never
  }
}

/**
 * Felt rather than heard, because the room's speaker already ticks and eight
 * phones ticking with it is noise: one pulse three seconds out, and one when
 * time is up — on a screen still in the race only.
 */
export const useTimeOutNudge = ({
  clock,
  view
}: {
  clock: ClockEstimate | null
  view: RacingView | null
}): void => {
  useLastSeconds({
    deadline: view === null ? null : racingDeadline({ clock, view }),
    fromSecond: NUDGE_AT_SECOND,
    onEnd: () => {
      clockFeedback('timeUp')
    },
    onSecond: (second) => {
      if (second === NUDGE_AT_SECOND) {
        clockFeedback('closing')
      }
    }
  })
}
