import type React from 'react'

import { useSeatPawnColour } from './pawn-colours'

import './pawn.sass'

type PawnColourProps =
  | {
      /**
       * The player's place in the room's roster, looked up in the page's
       * `PawnColoursProvider`: the colour the seat picked, or its team's when
       * the room plays in teams.
       */
      seat: number
    }
  | {
      /** A pawn number, 1-based, as the protocol carries it. */
      colour: number
    }

export type PawnProps = PawnColourProps & {
  /**
   * Printed on the head, for a pawn standing with no name beside it: a seat's
   * initial on the track, from `pawnMarksOf`. Omitted, the head stays plain.
   */
  mark?: string
}

/** Which pawn colour a seat plays in, its team's when there are teams. */
export const usePawnNumber = (props: PawnColourProps): number => {
  const seatPawn = useSeatPawnColour('seat' in props ? props.seat : -1)

  return 'colour' in props ? props.colour : seatPawn
}

/** The pawn's outline in a 24 × 28 box, standing on its base at the bottom. */
export const PAWN_BOX = { height: 28, width: 24 } as const

/** The piece's three shapes, for an SVG that places the pawn itself. */
export const PawnShape: React.FC = () => (
  <>
    <circle cx='12' cy='6.5' r='5.5' />
    <path d='M8.2 12.5h7.6l2.4 9.5H5.8z' />
    <rect height='5.5' rx='2.5' width='18' x='3' y='21.5' />
  </>
)

/** A player's piece: the same colour on every screen that names them. */
export const Pawn: React.FC<PawnProps> = (props) => {
  const pawnNumber = usePawnNumber(props)

  return (
    <svg
      aria-hidden='true'
      className='pawn'
      focusable='false'
      style={{
        '--on-pawn': `var(--on-pawn-${pawnNumber})`,
        '--pawn': `var(--pawn-${pawnNumber})`
      }}
      viewBox={`0 0 ${PAWN_BOX.width} ${PAWN_BOX.height}`}
    >
      <PawnShape />
      {props.mark !== undefined && props.mark !== '' && (
        <text
          className='mark'
          dominantBaseline='central'
          fontSize={[...props.mark].length > 1 ? 5.6 : 7.5}
          textAnchor='middle'
          x='12'
          y='6.8'
        >
          {props.mark}
        </text>
      )}
    </svg>
  )
}
