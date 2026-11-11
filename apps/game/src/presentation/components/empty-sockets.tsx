import type React from 'react'
import { useState } from 'react'

import { Pawn } from './pawn'
import { glidesWhenTheGridResizes } from './use-rows-travel'

/** How many seats a roster draws at the least: the taken ones, then a socket each to this. */
export const PAWNS_IN_THE_BOX = 8

const SEAT_TAKING_THE_SOCKET =
  '.scoreboard > li:nth-last-child(1 of :not([data-leaving]))'
const SEAT_LEAVING_OVER_THE_SOCKET = '.scoreboard > li[data-leaving]:last-child'

/**
 * Hands a socket the height of the seat `seatSelector` finds pinned on it,
 * out of the grid, so the row the two share grows or shrinks with the socket
 * rather than in one frame as the seat goes back into the grid or off it.
 */
const holdsHeightOf =
  (seatSelector: string) =>
  (socket: HTMLLIElement | null): void => {
    const seat =
      socket?.parentElement?.parentElement?.querySelector<HTMLElement>(
        seatSelector
      )

    if (socket !== null && seat !== null && seat !== undefined) {
      socket.style.setProperty('--seat-height', `${seat.offsetHeight}px`)
    }
  }

const holdsTheTakingSeatHeight = holdsHeightOf(SEAT_TAKING_THE_SOCKET)
const holdsTheLeavingSeatHeight = holdsHeightOf(SEAT_LEAVING_OVER_THE_SOCKET)

type EmptySocketsProps = {
  /** How many seats are taken; the sockets carry on from the next pawn. */
  seated: number
}

/**
 * A recess for every pawn still in the box, beside the seats already taken.
 * The socket the newest seat filled stays in its cell until its exit ends,
 * and the seat's chip lands on it rather than on an empty cell. Each socket is
 * keyed by its pawn, so none changes cells as seats come and go, and a row
 * of seats growing or shrinking above them slides them along.
 */
export const EmptySockets: React.FC<EmptySocketsProps> = ({ seated }) => {
  const { filledSeat, onFilled } = useFilledSocket(seated)
  const empty = Math.max(0, PAWNS_IN_THE_BOX - seated)

  if (empty === 0 && filledSeat === null) {
    return null
  }

  return (
    <ul aria-hidden='true' className='sockets' ref={glidesWhenTheGridResizes}>
      {filledSeat !== null && (
        <li
          className='socket'
          data-filled
          data-key={filledSeat}
          key={filledSeat}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              onFilled()
            }
          }}
          ref={holdsTheTakingSeatHeight}
        >
          <Pawn seat={filledSeat} />
        </li>
      )}
      {Array.from({ length: empty }, (_, offset) => seated + offset).map(
        (seat) => (
          <li
            className='socket'
            data-key={seat}
            key={seat}
            ref={seat === seated ? holdsTheLeavingSeatHeight : undefined}
          >
            <Pawn seat={seat} />
          </li>
        )
      )}
    </ul>
  )
}

const useFilledSocket = (
  seated: number
): { filledSeat: number | null; onFilled: () => void } => {
  const [held, setHeld] = useState(seated)
  const [filledSeat, setFilledSeat] = useState<number | null>(null)

  if (seated !== held) {
    setFilledSeat(
      seated > held && seated <= PAWNS_IN_THE_BOX ? seated - 1 : null
    )
    setHeld(seated)
  }

  return {
    filledSeat,
    onFilled: () => {
      setFilledSeat(null)
    }
  }
}
