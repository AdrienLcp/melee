import type React from 'react'

import { useTeamPawnNumber } from './pawn-colours'

import './pawn.sass'

const PAWN_COLOURS = 8

type PawnProps =
  | {
      /**
       * The player's place in the room's roster, which picks one of the box's
       * eight pawn colours — or their team's, when the room plays in teams. A
       * ninth player takes the first colour again.
       */
      seat: number
    }
  | {
      /** A team's own pawn number, 1-based, as the protocol carries it. */
      colour: number
    }

const pawnNumberOf = (seat: number): number => (seat % PAWN_COLOURS) + 1

/** A player's piece: the same colour on every screen that names them. */
export const Pawn: React.FC<PawnProps> = (props) => {
  const seat = 'seat' in props ? props.seat : -1
  const teamPawn = useTeamPawnNumber(seat)
  const pawnNumber =
    'colour' in props ? props.colour : (teamPawn ?? pawnNumberOf(seat))

  return (
    <svg
      aria-hidden='true'
      className='pawn'
      focusable='false'
      style={{ '--pawn': `var(--pawn-${pawnNumber})` }}
      viewBox='0 0 24 28'
    >
      <circle cx='12' cy='6.5' r='5.5' />
      <path d='M8.2 12.5h7.6l2.4 9.5H5.8z' />
      <rect height='5.5' rx='2.5' width='18' x='3' y='21.5' />
    </svg>
  )
}
