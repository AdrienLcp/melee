import { useState } from 'react'

/**
 * Whether `signature` has moved off the one the component was first drawn
 * with: a reveal staggered on its first draw lays every later change in at
 * once, since lengthening a delay on an animation that has already played
 * sends it back to its first frame.
 */
export const useChangedSinceFirstDraw = (signature: string): boolean => {
  const [first] = useState(signature)

  return signature !== first
}
