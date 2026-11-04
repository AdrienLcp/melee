import type React from 'react'

import type { PawnHead, PawnPiece } from '@melee/protocol/team'

import { TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'

import { useSeatPawnPiece } from './pawn-pieces'

import './pawn.sass'

export type PawnProps =
  | {
      /**
       * The player's place in the room's roster, looked up in the page's
       * `PawnPiecesProvider`: the piece the seat picked, or its team's when
       * the room plays in teams.
       */
      seat: number
    }
  | {
      /** A pawn number, 1-based, as the protocol carries it. */
      colour: number
      /** The head it wears; round, a team's, when omitted. */
      head?: PawnHead
    }

/** Which piece a pawn stands as: its seat's, or the colour and head it was handed. */
export const usePawnPiece = (props: PawnProps): PawnPiece => {
  const seatPiece = useSeatPawnPiece('seat' in props ? props.seat : -1)

  return 'colour' in props
    ? { colour: props.colour, head: props.head ?? TEAM_PAWN_HEAD }
    : seatPiece
}

/** The pawn's outline in a 24 × 28 box, standing on its base at the bottom. */
export const PAWN_BOX = { height: 28, width: 24 } as const

/** The round head, which every other head is measured against and centred on. */
const ROUND_HEAD = { centreX: 12, centreY: 6.5, size: 11 } as const

const SQUARE_HEAD_SIDE = ROUND_HEAD.size * 0.86

const roundedTo = (value: number): number => Number(value.toFixed(3))

/**
 * An upright triangle 1.02 heads tall and 1.1 wide, its apex further above the
 * centre than its base sits below so it weighs as much as the round head, then
 * grown 0.07 of a head all round with rounded corners. That outline is what a
 * stroke in the piece's own colour softened the corners to, drawn as a fill so
 * a dashed socket outlines it as it outlines the other heads.
 */
const pointHeadPath = (): string => {
  const height = ROUND_HEAD.size * 1.02
  const halfBase = ROUND_HEAD.size * 0.55
  const softening = ROUND_HEAD.size * 0.07
  const apexY = ROUND_HEAD.centreY - height * 0.56
  const baseY = ROUND_HEAD.centreY + height * 0.44
  const side = Math.hypot(halfBase, height)
  const outX = (height / side) * softening
  const outY = (halfBase / side) * softening
  const left = ROUND_HEAD.centreX - halfBase
  const right = ROUND_HEAD.centreX + halfBase
  const corner = `A${roundedTo(softening)} ${roundedTo(softening)} 0 0 1`
  const at = (x: number, y: number): string => `${roundedTo(x)} ${roundedTo(y)}`

  return [
    `M${at(ROUND_HEAD.centreX + outX, apexY - outY)}`,
    `L${at(right + outX, baseY - outY)}`,
    `${corner} ${at(right, baseY + softening)}`,
    `L${at(left, baseY + softening)}`,
    `${corner} ${at(left - outX, baseY - outY)}`,
    `L${at(ROUND_HEAD.centreX - outX, apexY - outY)}`,
    `${corner} ${at(ROUND_HEAD.centreX + outX, apexY - outY)}z`
  ].join('')
}

const POINT_HEAD_PATH = pointHeadPath()

/**
 * The piece's head, body and base, for an SVG that places the pawn itself.
 * Every head is drawn and the one worn shown, so a seat changing its head
 * fades from one to the other.
 */
export const PawnShape: React.FC<{ head: PawnHead }> = ({ head }) => (
  <>
    <g className='pawn-heads'>
      <circle
        className='pawn-head'
        cx={ROUND_HEAD.centreX}
        cy={ROUND_HEAD.centreY}
        data-worn={head === 'round' || undefined}
        r={ROUND_HEAD.size / 2}
      />
      <rect
        className='pawn-head'
        data-worn={head === 'square' || undefined}
        height={SQUARE_HEAD_SIDE}
        rx={ROUND_HEAD.size * 0.12}
        width={SQUARE_HEAD_SIDE}
        x={ROUND_HEAD.centreX - SQUARE_HEAD_SIDE / 2}
        y={ROUND_HEAD.centreY - SQUARE_HEAD_SIDE / 2}
      />
      <path
        className='pawn-head'
        d={POINT_HEAD_PATH}
        data-worn={head === 'point' || undefined}
      />
    </g>
    <path className='pawn-body' d='M8.2 12.5h7.6l2.4 9.5H5.8z' />
    <rect
      className='pawn-body'
      height='5.5'
      rx='2.5'
      width='18'
      x='3'
      y='21.5'
    />
  </>
)

/** A player's piece: the same colour and head on every screen that names them. */
export const Pawn: React.FC<PawnProps> = (props) => {
  const piece = usePawnPiece(props)

  return (
    <svg
      aria-hidden='true'
      className='pawn'
      focusable='false'
      style={{ '--pawn': `var(--pawn-${piece.colour})` }}
      viewBox={`0 0 ${PAWN_BOX.width} ${PAWN_BOX.height}`}
    >
      <PawnShape head={piece.head} />
    </svg>
  )
}
