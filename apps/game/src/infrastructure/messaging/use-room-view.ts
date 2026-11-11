import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { handsOverTheFloor, type RoundOnScreen } from '@/helpers/floor-handover'
import { leavesTheReveal } from '@/helpers/reveal-departure'
import { replaceScreen } from '@/infrastructure/browser'

type ScreenChange = { from: RoundOnScreen; to: RoundOnScreen }

/**
 * What swaps the whole stage of the console and the wall: the floor changing
 * hands, and the reveal leaving.
 */
export const swapsTheWholeStage = (change: ScreenChange): boolean =>
  handsOverTheFloor(change) || leavesTheReveal(change)

/**
 * A role's latest snapshot, and the setter its socket hands each one to. A
 * snapshot `isSwap` says replaces the screen lands as one screen replacing
 * another (`replaceScreen`); every other one is drawn as it comes.
 */
export const useRoomView = <View extends NonNullable<RoundOnScreen>>(
  isSwap: (change: { from: View | null; to: View }) => boolean
): [View | null, (next: View) => void] => {
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

    if (isSwap({ from: drawn, to: next })) {
      replaceScreen(() => {
        flushSync(show)
      })

      return
    }

    show()
  }

  return [view, receive]
}
