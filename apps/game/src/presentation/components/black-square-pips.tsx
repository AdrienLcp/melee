import type React from 'react'

import type {
  BlackSquareCellTiers,
  BlackSquareTier
} from '@melee/protocol/black-square'

import { pointsForTier } from '@melee/core/blacksquare/sheet-pay'

import { shownPoints } from '@/helpers/shown-points'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { usePlaysOnTrack } from './board-kind'
import { VisuallyHidden } from './visually-hidden'

import './black-square-pips.sass'

const PIPS = ['first', 'second', 'third'] as const

type BlackSquarePipsProps = {
  /** The tier of every answer the round dealt, which is what the tier's share of the sheet is cut from. */
  cellTiers: BlackSquareCellTiers
  /** How obscure the cell is, which is the number of pips and its share of the sheet. */
  tier: BlackSquareTier
}

/**
 * A cell's tier as one to three dots, which is where its place on the grid
 * says how much it pays before anybody reads a number — and the points said
 * aloud for a screen reader.
 */
export const BlackSquarePips: React.FC<BlackSquarePipsProps> = ({
  cellTiers,
  tier
}) => {
  const translate = useTranslate()
  const isOnTrack = usePlaysOnTrack()

  return (
    <span className='black-square-pips'>
      {PIPS.slice(0, tier).map((pip) => (
        <i aria-hidden='true' key={pip} />
      ))}
      <VisuallyHidden>
        {isOnTrack
          ? translate('blacksquare.tierOf', { most: PIPS.length, tier })
          : translate('blacksquare.tier', {
              points: shownPoints(pointsForTier({ cellTiers, tier }))
            })}
      </VisuallyHidden>
    </span>
  )
}
