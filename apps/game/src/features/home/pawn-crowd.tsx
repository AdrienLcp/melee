import type React from 'react'

import type { GameKind } from '@melee/protocol/game'
import { PAWN_HEADS } from '@melee/protocol/team'

import { PAWN_BOX, PawnShape } from '@/presentation/components/pawn'

import './pawn-crowd.sass'

/**
 * Where each pawn stands: its left edge and the line its base rests on, in the
 * crowd's own units, its size against a seat's pawn, and how far it hops when
 * the lid is hovered — `0` for one that stays put. The back row first, so the
 * front one is drawn over it.
 */
const STANDS = [
  { base: 98, hop: 0, left: 12, scale: 1.64 },
  { base: 89, hop: 2, left: 54, scale: 1.91 },
  { base: 98, hop: 0, left: 99, scale: 1.55 },
  { base: 88, hop: 1, left: 135, scale: 2.09 },
  { base: 99, hop: 0, left: 182, scale: 1.73 },
  { base: 87, hop: 2, left: 224, scale: 1.91 },
  { base: 100, hop: 0, left: 264, scale: 1.64 },
  { base: 140, hop: 1, left: 31, scale: 2 },
  { base: 143, hop: 0, left: 80, scale: 2.18 },
  { base: 142, hop: 2, left: 125, scale: 2 },
  { base: 144, hop: 0, left: 170, scale: 2.27 },
  { base: 144, hop: 1, left: 215, scale: 2.09 },
  { base: 141, hop: 0, left: 258, scale: 1.91 }
] as const

const CROWD_VIEW_BOX = '0 20 316 126'

/**
 * The lid's colour, drawn round each pawn under its own print so one in front
 * parts from the one behind without cutting its head from its body.
 */
const PARTING_STROKE_WIDTH = 2.4

type PawnCrowdProps = {
  /** The games the line-up plays: a pawn each in its spine's colour, dealt round again when there are fewer games than pawns. */
  games: readonly GameKind[]
}

/**
 * A crowd of pawns in every colour the line-up plays, wearing every head,
 * the tallest in front: the whole table at once, for the line-up that mixes
 * every game. A few hop when the lid is hovered.
 */
export const PawnCrowd: React.FC<PawnCrowdProps> = ({ games }) => (
  <svg
    aria-hidden='true'
    className='pawn-crowd'
    focusable='false'
    viewBox={CROWD_VIEW_BOX}
  >
    {STANDS.map((stand, index) => {
      const game = games[index % games.length]
      const head = PAWN_HEADS[index % PAWN_HEADS.length] ?? 'round'

      return (
        <g
          key={`${stand.left}-${stand.base}`}
          transform={`translate(${stand.left} ${stand.base - PAWN_BOX.height * stand.scale}) scale(${stand.scale})`}
        >
          <g
            className='crowd-pawn'
            data-hop={stand.hop}
            style={{ '--pawn': `var(--spine-${game ?? 'quiz'})` }}
          >
            <g className='parting' strokeWidth={PARTING_STROKE_WIDTH}>
              <PawnShape head={head} />
            </g>
            <PawnShape head={head} />
          </g>
        </g>
      )
    })}
  </svg>
)
