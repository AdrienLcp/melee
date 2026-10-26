import type React from 'react'

import type { BlackSquareTier } from '@melee/protocol/black-square'
import { POINT } from '@melee/protocol/scoring'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { VisuallyHidden } from './visually-hidden'

import './black-square-pips.sass'

const PIPS = ['first', 'second', 'third'] as const

type BlackSquarePipsProps = {
  /** How obscure the cell is, which is the number of pips and what it pays in `POINT`s. */
  tier: BlackSquareTier
}

/**
 * A cell's tier as one to three dots, which is where its place on the grid
 * says how much it pays before anybody reads a number — and the points said
 * aloud for a screen reader.
 */
export const BlackSquarePips: React.FC<BlackSquarePipsProps> = ({ tier }) => {
  const translate = useTranslate()

  return (
    <span className='black-square-pips'>
      {PIPS.slice(0, tier).map((pip) => (
        <i aria-hidden='true' key={pip} />
      ))}
      <VisuallyHidden>
        {translate('blacksquare.tier', { points: tier })}
      </VisuallyHidden>
    </span>
  )
}

/** What a cell of this tier pays, in the board's own units. */
export const pointsOfTier = (tier: BlackSquareTier): number => tier * POINT
