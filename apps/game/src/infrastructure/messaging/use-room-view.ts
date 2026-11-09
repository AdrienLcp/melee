import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { handsOverTheFloor, type RoundOnScreen } from '@/helpers/floor-handover'
import { replaceScreen } from '@/infrastructure/browser'

/**
 * The room's latest snapshot as the console and the wall draw it, and the
 * setter their socket hands each one to. A snapshot that hands the floor over
 * — a buzz taking it, a verdict giving it back — swaps the whole stage, so it
 * lands as one screen replacing another (`replaceScreen`). Never on a
 * player's screen: the transition holds every press for its length, and the
 * race reopens the moment the floor is given back.
 */
export const useRoomView = <View extends NonNullable<RoundOnScreen>>(): [
  View | null,
  (next: View) => void
] => {
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

    if (handsOverTheFloor({ from: drawn, to: next })) {
      replaceScreen(() => {
        flushSync(show)
      })

      return
    }

    show()
  }

  return [view, receive]
}
