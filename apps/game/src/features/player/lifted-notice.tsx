import type React from 'react'
import { useState } from 'react'

import './lifted-notice.sass'

/**
 * A card that froze the round, faded off over the round come back once the
 * freeze is lifted — the pause taken back, the host returned. Never a swap of
 * the screen: the round reopens a race the moment the freeze lifts, and a
 * transition would hold its first press. It draws nothing while the card is
 * up, which is the round's own to draw, and nothing once it has faded.
 */
export const LiftedNotice: React.FC<{
  /** The card as it stood, drawn again while it fades. */
  children: React.ReactNode
  /** Whether the card is up now. */
  isShown: boolean
  /** Whether the card going now fades off: `false` where the screen swaps under it anyway. */
  liftsInPlace: boolean
}> = ({ children, isShown, liftsInPlace }) => {
  const [wasShown, setWasShown] = useState(isShown)
  const [isLifting, setIsLifting] = useState(false)

  if (isShown !== wasShown) {
    setWasShown(isShown)
    setIsLifting(!isShown && liftsInPlace)
  }

  if (!isLifting) {
    return null
  }

  return (
    <section
      aria-hidden
      className='player-round notice lifted'
      inert
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setIsLifting(false)
        }
      }}
    >
      {children}
    </section>
  )
}
