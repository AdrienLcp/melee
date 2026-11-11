import type React from 'react'

import type { BlackSquareCellTiers } from '@melee/protocol/black-square'

import { CheckIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './black-square-gauge.sass'

const tokensOf = (cellTiers: BlackSquareCellTiers): number[] =>
  cellTiers.map((_, token) => token)

type BlackSquareGaugeProps = {
  /** The tier of every answer the round dealt, one token each. */
  cellTiers: BlackSquareCellTiers
  /** How many of them somebody at the table has found. */
  foundCellCount: number
}

/**
 * The room's count as a token per answer, checked left to right: a gauge, never the
 * cells themselves, so nobody across the room learns which one to stop
 * looking for.
 */
export const BlackSquareGauge: React.FC<BlackSquareGaugeProps> = ({
  cellTiers,
  foundCellCount
}) => {
  const translate = useTranslate()

  return (
    <div className='black-square-gauge'>
      <div aria-hidden='true' className='tokens'>
        {tokensOf(cellTiers).map((token) => (
          <span data-found={token < foundCellCount || undefined} key={token}>
            <CheckIcon />
          </span>
        ))}
      </div>
      <p className='count' role='status'>
        {translate('blacksquare.found', {
          count: foundCellCount,
          total: cellTiers.length
        })}
      </p>
    </div>
  )
}
