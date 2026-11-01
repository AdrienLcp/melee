import { useEffect, useRef } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { ClipFault } from '@melee/protocol/sound'

/**
 * Tells the room what the speaker hears of the round on screen's clip: a fault
 * as it appears, and `null` once the clip plays again. Only changes are sent —
 * a round that plays is never reported at all — and a frame the socket could
 * not take is sent again on the next render that finds it open.
 */
export const useSilentClipReport = ({
  fault,
  roundId,
  send
}: {
  fault: ClipFault | null
  /** The round on screen, and `null` on a screen that is not the speaker. */
  roundId: string | null
  send: (message: ClientMessage) => boolean
}): void => {
  const reportedRef = useRef<{
    fault: ClipFault | null
    roundId: string
  } | null>(null)

  useEffect(() => {
    if (roundId === null) {
      return
    }

    const reported = reportedRef.current
    const isAlreadySaid =
      reported?.roundId === roundId ? reported.fault === fault : fault === null

    if (isAlreadySaid) {
      return
    }

    if (send({ fault, roundId, type: 'speaker.reportClip' })) {
      reportedRef.current = { fault, roundId }
    }
  })
}
