import type React from 'react'

import type { GuessNineAnswerCount } from '@melee/protocol/guess-nine'

import { CheckIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './guess-nine-gauge.sass'

type GuessNineGaugeProps = {
  /** How many answers the round dealt, one token each. */
  answerCount: GuessNineAnswerCount
  /** How many of them somebody at the table has found. */
  foundCellCount: number
}

const tokensOf = (answerCount: GuessNineAnswerCount): number[] =>
  Array.from({ length: answerCount }, (_, token) => token)

/**
 * The room's count as a token per answer, checked left to right: a gauge, never the
 * cells themselves, so nobody across the room learns which one to stop
 * looking for.
 */
export const GuessNineGauge: React.FC<GuessNineGaugeProps> = ({
  answerCount,
  foundCellCount
}) => {
  const translate = useTranslate()

  return (
    <div className='guess-nine-gauge'>
      <div aria-hidden='true' className='tokens'>
        {tokensOf(answerCount).map((token) => (
          <span data-found={token < foundCellCount || undefined} key={token}>
            {token < foundCellCount && <CheckIcon />}
          </span>
        ))}
      </div>
      <p className='count' role='status'>
        {translate('guessnine.found', {
          count: foundCellCount,
          total: answerCount
        })}
      </p>
    </div>
  )
}
