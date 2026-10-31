import type React from 'react'

import type { PlayerRoomView } from '@melee/protocol/room'

import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { revealHoldOf } from '@/helpers/reveal-hold'
import {
  RevealHold,
  RoundProgress
} from '@/presentation/components/round-progress'

type RoundClockProps = {
  clock: ClockEstimate | null
  /** A seat's view, or a seated console's: the clock reads nothing a seat alone holds. */
  view: Pick<
    PlayerRoomView,
    | 'isHostConnected'
    | 'isPaused'
    | 'phase'
    | 'round'
    | 'roundElapsedMs'
    | 'settings'
  >
}

/**
 * The clock the console is showing, on the player's screen that is answering
 * against it — and then the wait until the next round, which is the same
 * question one phase later.
 *
 * Absent whenever nothing is counting. For the round that is the host being
 * away or holding the room on pause, because the server has it frozen and a groove still draining would be
 * timing nobody; for the hold `advancesAt` says the same thing on its own,
 * covering a host who advances by hand and a host who has gone at once.
 */
export const RoundClock: React.FC<RoundClockProps> = ({ clock, view }) => {
  const hold =
    view.round == null
      ? null
      : revealHoldOf({ round: view.round, settings: view.settings })

  if (view.phase === 'revealed' && hold !== null) {
    return <RevealHold clock={clock} {...hold} />
  }

  const durationMs = view.round?.durationMs ?? null

  if (
    durationMs === null ||
    view.phase !== 'playing' ||
    !view.isHostConnected ||
    view.isPaused
  ) {
    return null
  }

  return (
    <RoundProgress durationMs={durationMs} elapsedMs={view.roundElapsedMs} />
  )
}
