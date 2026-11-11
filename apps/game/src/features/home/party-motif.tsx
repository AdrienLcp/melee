import type React from 'react'

import type { ReadyMadeLineUpId } from '@melee/core/room/ready-made-line-ups'

type MotifId = Exclude<ReadyMadeLineUpId, 'grandMix'>

const DIE_PIPS = [
  { x: 30, y: 30 },
  { x: 70, y: 30 },
  { x: 50, y: 50 },
  { x: 30, y: 70 },
  { x: 70, y: 70 }
] as const

const RECORD_GROOVES = [34, 26] as const

const MOTIFS = {
  firstGame: (
    <g transform='rotate(14 50 50)'>
      <rect
        className='outline'
        height='84'
        rx='18'
        strokeWidth='9'
        width='84'
        x='8'
        y='8'
      />
      {DIE_PIPS.map(({ x, y }) => (
        <circle cx={x} cy={y} key={`${x}-${y}`} r='8' />
      ))}
    </g>
  ),
  generalKnowledge: (
    <g transform='rotate(10 50 50)'>
      <path
        className='outline'
        d='M29 33a21 21 0 1 1 30 19c-6 3-9 7-9 13v4'
        strokeLinecap='round'
        strokeWidth='15'
      />
      <circle cx='50' cy='89' r='9' />
    </g>
  ),
  music: (
    <g>
      <circle className='outline' cx='50' cy='50' r='46' strokeWidth='7' />
      {RECORD_GROOVES.map((radius) => (
        <circle
          className='outline'
          cx='50'
          cy='50'
          key={radius}
          r={radius}
          strokeWidth='3'
        />
      ))}
      <circle cx='50' cy='50' r='12' />
    </g>
  ),
  quick: <path d='M58 2 16 58h28L36 98l48-60H55z' />
} satisfies Record<MotifId, React.ReactNode>

/**
 * What a ready-made line-up plays, as one large mark printed tone on tone in
 * its lid's corner and cropped by it: a die for a first game, a record for
 * music, a question mark for general knowledge, a bolt for the quick one.
 */
export const PartyMotif: React.FC<{ id: MotifId }> = ({ id }) => (
  <svg
    aria-hidden='true'
    className='party-motif'
    focusable='false'
    viewBox='0 0 100 100'
  >
    {MOTIFS[id]}
  </svg>
)
