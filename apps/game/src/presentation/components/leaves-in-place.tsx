import type React from 'react'

import { useLeavingValue } from './use-leaving-value'

import './leaves-in-place.sass'

const EXIT_ANIMATION = 'piece-closes'

const isPieceClosed = (event: React.AnimationEvent): boolean =>
  event.animationName === EXIT_ANIMATION &&
  event.target === event.currentTarget.firstElementChild

type LeavesInPlaceProps<Value> = {
  /**
   * Draws the piece from the value it is shown for, or from the last one while
   * it plays its exit. Its root element is the one that fades.
   */
  children: (value: Value) => React.ReactNode
  /**
   * What the piece is drawn from, `null` once it has nothing to say. Pass a
   * value whose identity holds from one render to the next — a snapshot's own
   * field, a string — never an object built during render.
   */
  value: Value | null
}

/**
 * A piece of a line that a snapshot adds and takes away, faded in where it
 * stands and faded out from what it last said, since the snapshot that ends it
 * no longer holds that. The wrapper has no box, so the piece is still the
 * line's own item.
 */
export const LeavesInPlace = <Value,>({
  children,
  value
}: LeavesInPlaceProps<Value>) => {
  const { drawn, isLeaving, onAnimationEnd } = useLeavingValue(value, {
    isExitEnd: isPieceClosed
  })

  if (drawn === null) {
    return null
  }

  return (
    <div
      className='leaves-in-place'
      data-leaving={isLeaving || undefined}
      onAnimationEnd={onAnimationEnd}
    >
      {children(drawn)}
    </div>
  )
}
