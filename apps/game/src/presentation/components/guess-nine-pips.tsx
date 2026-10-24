import type React from 'react'

import type { GuessNineTier } from '@melee/protocol/guess-nine'
import { POINT } from '@melee/protocol/scoring'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { VisuallyHidden } from './visually-hidden'

import './guess-nine-pips.sass'

const PIPS = ['first', 'second', 'third'] as const

type GuessNinePipsProps = {
  /** How obscure the cell is, which is the number of pips and what it pays in `POINT`s. */
  tier: GuessNineTier
}

/**
 * A cell's tier as one to three dots, which is where its place on the grid
 * says how much it pays before anybody reads a number — and the points said
 * aloud for a screen reader.
 */
export const GuessNinePips: React.FC<GuessNinePipsProps> = ({ tier }) => {
  const translate = useTranslate()

  return (
    <span className='guess-nine-pips'>
      {PIPS.slice(0, tier).map((pip) => (
        <i aria-hidden='true' key={pip} />
      ))}
      <VisuallyHidden>
        {translate('guessnine.tier', { points: tier })}
      </VisuallyHidden>
    </span>
  )
}

/** What a cell of this tier pays, in the board's own units. */
export const pointsOfTier = (tier: GuessNineTier): number => tier * POINT
