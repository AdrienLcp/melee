import { useState } from 'react'

import type { RoundId } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

/** What every role's view says about the round on screen. */
type RoundOnScreen = {
  phase: RoomPhase
  round: { id: RoundId } | null
} | null

type Seen = {
  dealtRoundId: RoundId | null
  phase: RoomPhase | null
  roundId: RoundId | null
}

/**
 * True while the round a countdown just counted in is in play, from the first
 * frame after the countdown to the first frame of anything else: the page
 * stamps it as `data-round-dealt` and the round's stage is laid down under it.
 *
 * Keyed on the change from countdown to round, never on the phase: a wrong
 * buzz takes the round `playing → buzzed → playing`, and an entry read off
 * `playing` would deal the whole screen again there. A screen that arrives
 * mid-round never saw the countdown, and is laid down by its page instead.
 */
export const useRoundDealt = (view: RoundOnScreen): boolean => {
  const phase = view?.phase ?? null
  const roundId = view?.round?.id ?? null
  const [seen, setSeen] = useState<Seen>({
    dealtRoundId: null,
    phase,
    roundId
  })

  if (seen.phase === phase && seen.roundId === roundId) {
    return seen.dealtRoundId !== null
  }

  const isCountedIn = seen.phase === 'countdown' && seen.roundId === roundId
  const dealtRoundId =
    phase === 'playing' && roundId !== null && isCountedIn ? roundId : null

  setSeen({ dealtRoundId, phase, roundId })

  return dealtRoundId !== null
}
