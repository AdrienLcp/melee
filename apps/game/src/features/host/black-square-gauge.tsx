import type React from 'react'

import type { BlackSquareAnswerCount } from '@melee/protocol/black-square'

import { CheckIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './black-square-gauge.sass'

type BlackSquareGaugeProps = {
  /** How many answers the round dealt, one token each. */
  answerCount: BlackSquareAnswerCount
  /** How many of them somebody at the table has found. */
  foundCellCount: number
}

const tokensOf = (answerCount: BlackSquareAnswerCount): number[] =>
  Array.from({ length: answerCount }, (_, token) => token)

/**
 * The room's count as a token per answer, checked left to right: a gauge, never the
 * cells themselves, so nobody across the room learns which one to stop
 * looking for.
 */
export const BlackSquareGauge: React.FC<BlackSquareGaugeProps> = ({
  answerCount,
  foundCellCount
}) => {
  const translate = useTranslate()

  return (
    <div className='black-square-gauge'>
      <div aria-hidden='true' className='tokens'>
        {tokensOf(answerCount).map((token) => (
          <span data-found={token < foundCellCount || undefined} key={token}>
            {token < foundCellCount && <CheckIcon />}
          </span>
        ))}
      </div>
      <p className='count' role='status'>
        {translate('blacksquare.found', {
          count: foundCellCount,
          total: answerCount
        })}
      </p>
    </div>
  )
}
