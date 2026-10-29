import type { StickMove, StickPlace } from '@melee/protocol/matchsticks'

import { isSamePlace } from './matchstick-geometry'

const isMovedStick = ({
  lifted,
  placed
}: {
  lifted: StickPlace
  placed: StickMove | null
}): boolean =>
  placed !== null && isSamePlace({ left: lifted, right: placed.to })

/**
 * The move a board draws while this stick is held: the one already placed,
 * unless the stick held is another, which puts the first one back — one stick
 * moved at a time.
 */
export const shownMoveOf = ({
  lifted,
  placed
}: {
  lifted: StickPlace | null
  placed: StickMove | null
}): StickMove | null =>
  lifted === null || isMovedStick({ lifted, placed }) ? placed : null

/**
 * The move once the held stick is laid on `to`: the moved stick laid again
 * keeps where it was first lifted from, and laid back there is no move at all.
 */
export const placedBy = ({
  lifted,
  placed,
  to
}: {
  lifted: StickPlace
  placed: StickMove | null
  to: StickPlace
}): StickMove | null => {
  if (placed === null || !isMovedStick({ lifted, placed })) {
    return { from: lifted, to }
  }

  return isSamePlace({ left: to, right: placed.from })
    ? null
    : { from: placed.from, to }
}
