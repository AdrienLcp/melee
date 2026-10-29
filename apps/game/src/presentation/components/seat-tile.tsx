import type React from 'react'
import {
  Button as ReactAriaButton,
  type ButtonProps as ReactAriaButtonProps
} from 'react-aria-components'

import { Pawn } from './pawn'

import './seat-tile.sass'

type SeatTileProps = Omit<ReactAriaButtonProps, 'children' | 'className'> & {
  /** Whether this is the seat the press went to, which stays raised once spent. */
  isChosen?: boolean
  /** A word printed under the name — *You* on the reader's own seat. */
  mark?: string
  nickname: string
  /** The seat's place in the roster, which picks its pawn colour. */
  seat: number
}

/**
 * A seat as a press: its pawn and its name on a piece. Spent, the one pressed
 * keeps its piece and the rest sink into their sockets, so the screen keeps
 * saying where the press went while it waits on everyone else.
 */
export const SeatTile: React.FC<SeatTileProps> = ({
  isChosen = false,
  mark,
  nickname,
  seat,
  ...props
}) => (
  <ReactAriaButton
    {...props}
    className='seat-tile'
    data-chosen={isChosen || undefined}
  >
    <Pawn seat={seat} />
    <span className='nickname'>{nickname}</span>
    {mark !== undefined && <span className='mark'>{mark}</span>}
  </ReactAriaButton>
)
