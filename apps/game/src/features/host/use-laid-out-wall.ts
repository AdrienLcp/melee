import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

import { moveLayout } from '@/infrastructure/browser'

/**
 * Whether the console is laid out for a wall, following `isWallConnected` —
 * `null` until the room's first view — one move behind it: a wall arriving or
 * leaving turns the whole console into the podium or back, and that is played
 * as one move rather than a cut. The first view is laid out as it comes, so a
 * reload beside a wall does not play an arrival.
 */
export const useLaidOutWall = (isWallConnected: boolean | null): boolean => {
  const [laidOut, setLaidOut] = useState<boolean | null>(isWallConnected)

  if (laidOut === null && isWallConnected !== null) {
    setLaidOut(isWallConnected)
  }

  useEffect(() => {
    if (isWallConnected === null || isWallConnected === laidOut) {
      return
    }

    let isCurrent = true

    // React refuses a `flushSync` while it is still running effects, and the
    // move needs one; the microtask runs once they are done.
    queueMicrotask(() => {
      if (isCurrent) {
        moveLayout(() => {
          flushSync(() => {
            setLaidOut(isWallConnected)
          })
        })
      }
    })

    return () => {
      isCurrent = false
    }
  }, [isWallConnected, laidOut])

  return laidOut === true
}
