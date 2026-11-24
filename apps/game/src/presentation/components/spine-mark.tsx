import type React from 'react'

import type { GameKind } from '@melee/protocol/game'

import { GameIcon } from './icons'

import './spine-mark.sass'

type SpineMarkProps = {
  game: GameKind
}

/**
 * A game's glyph on a square of its spine, printed in the spine's own ink:
 * the game named by its box wherever a line has no room for the box itself.
 * It is an em and a half of the line it stands in.
 */
export const SpineMark: React.FC<SpineMarkProps> = ({ game }) => (
  <span
    className='spine-mark-square'
    style={{
      '--spine': `var(--spine-${game})`,
      '--spine-ink': `var(--on-spine-${game})`
    }}
  >
    <GameIcon game={game} />
  </span>
)
