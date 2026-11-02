import { useState } from 'react'

/**
 * Marks a block a host's choice shows — `data-arrived` — so it rises in when
 * the choice brings it, and stands still when it was already there as its page
 * or tab opened: that opening is the entrance. Hidden and shown again, it
 * rises again. The mark only ever lands in the render that mounts the block,
 * because a mark landing on a block already drawn would start its entrance
 * over.
 */
export const useArrivedLater = (isShown: boolean): true | undefined => {
  const [wasShownAtFirstDraw, setWasShownAtFirstDraw] = useState(isShown)

  if (wasShownAtFirstDraw && !isShown) {
    setWasShownAtFirstDraw(false)
  }

  return (isShown && !wasShownAtFirstDraw) || undefined
}
