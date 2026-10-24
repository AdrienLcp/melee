import type React from 'react'

import { GUESS_NINE_CELL_COUNT } from '@melee/protocol/guess-nine'

import { CheckIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './guess-nine-gauge.sass'

type GuessNineGaugeProps = {
  /** How many of the nine somebody at the table has found. */
  foundCellCount: number
}

const TOKENS = Array.from(
  { length: GUESS_NINE_CELL_COUNT },
  (_, token) => token
)

/**
 * The room's count as nine tokens checked left to right: a gauge, never the
 * cells themselves, so nobody across the room learns which one to stop
 * looking for.
 */
export const GuessNineGauge: React.FC<GuessNineGaugeProps> = ({
  foundCellCount
}) => {
  const translate = useTranslate()

  return (
    <div className='guess-nine-gauge'>
      <div aria-hidden='true' className='tokens'>
        {TOKENS.map((token) => (
          <span data-found={token < foundCellCount || undefined} key={token}>
            {token < foundCellCount && <CheckIcon />}
          </span>
        ))}
      </div>
      <p className='count' role='status'>
        {translate('guessnine.found', { count: foundCellCount })}
      </p>
    </div>
  )
}
