import type React from 'react'

import './number-tile.sass'

type NumberTileProps = {
  /** A tile a merge made, on the warm face with its printed bar; a dealt one otherwise. */
  isMade?: boolean
  value: number
}

/**
 * One make-the-number tile as printed, pressed nowhere: the draw on a wall,
 * a tile in a written calculation. The seat's rack presses the same face as
 * a button (`.number-tile`), sized by `--tile-font-size`.
 */
export const NumberTile: React.FC<NumberTileProps> = ({
  isMade = false,
  value
}) => (
  <span className='number-tile' data-made={isMade || undefined}>
    {value}
    <span aria-hidden className='made-mark' />
  </span>
)
