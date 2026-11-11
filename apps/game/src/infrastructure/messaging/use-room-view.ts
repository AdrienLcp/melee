import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import type { StageOnScreen, ViewLanding } from '@/helpers/stage-replacement'
import { replaceScreen } from '@/infrastructure/browser'

/**
 * A role's latest snapshot, and the setter its socket hands each one to. How
 * each lands is `landingOf`'s to say: `swapped` as one screen replacing
 * another (`replaceScreen`), `faded-over` after `fadeOffWhatIsDrawn` has laid
 * a still copy of the screen as it stands, and `drawn` as it comes.
 */
export const useRoomView = <View extends NonNullable<StageOnScreen>>({
  fadeOffWhatIsDrawn,
  landingOf
}: {
  /** Lays what is on screen now over what the snapshot draws, before it is drawn. */
  fadeOffWhatIsDrawn?: () => void
  landingOf: (change: { from: View | null; to: View }) => ViewLanding
}): [View | null, (next: View) => void] => {
  const [view, setView] = useState<View | null>(null)
  // The transition draws its update a frame after it starts, and a snapshot
  // arriving in between must not be overwritten by the one it superseded.
  const latest = useRef<View | null>(null)

  const receive = (next: View): void => {
    const drawn = latest.current
    latest.current = next

    const show = (): void => {
      setView(latest.current)
    }

    switch (landingOf({ from: drawn, to: next })) {
      case 'swapped':
        replaceScreen(() => {
          flushSync(show)
        })

        return
      case 'faded-over':
        fadeOffWhatIsDrawn?.()
        show()

        return
      case 'drawn':
        show()
    }
  }

  return [view, receive]
}
