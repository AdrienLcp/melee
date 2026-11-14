import { useState } from 'react'

/**
 * Whether `signature` has moved off the one the component was first drawn
 * with, and stays so once it has, a change undone included: a reveal staggered
 * on its first draw lays every later change in at once, since lengthening a
 * delay on an animation that has already played sends it back to its first
 * frame, and a row arriving after the first draw opens its room.
 */
export const useChangedSinceFirstDraw = (signature: string): boolean => {
  const [first] = useState(signature)
  const [hasChanged, setHasChanged] = useState(false)
  const isChanged = hasChanged || signature !== first

  if (isChanged && !hasChanged) {
    setHasChanged(true)
  }

  return isChanged
}
