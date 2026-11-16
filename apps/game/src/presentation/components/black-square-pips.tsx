import type React from 'react'

import type { BlackSquareTier } from '@melee/protocol/black-square'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { VisuallyHidden } from './visually-hidden'

import './black-square-pips.sass'

const PIPS = ['first', 'second', 'third'] as const

/** The rarest tier, which a tier said aloud is counted out of. */
export const MOST_PIPS = PIPS.length

type BlackSquarePipsProps = {
  /** How obscure the cell is, which is the number of pips and its weight on the sheet. */
  tier: BlackSquareTier
}

/**
 * A cell's tier as one to three dots, which is where its place on the grid
 * says how much it weighs before anybody reads a number — and the tier said
 * aloud for a screen reader. No figure: a sheet re-weighs what it found, so
 * the seat's real pay is its own line on the podium and the standings.
 */
export const BlackSquarePips: React.FC<BlackSquarePipsProps> = ({ tier }) => {
  const translate = useTranslate()

  return (
    <span className='black-square-pips'>
      {PIPS.slice(0, tier).map((pip) => (
        <i aria-hidden='true' key={pip} />
      ))}
      <VisuallyHidden>
        {translate('blacksquare.tierOf', { most: MOST_PIPS, tier })}
      </VisuallyHidden>
    </span>
  )
}
