import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { Calculation } from '@melee/protocol/make-number'
import type { RoundView } from '@melee/protocol/room'

import {
  calculationLines,
  calculationValue,
  OPERATOR_SIGNS
} from '@melee/core/makenumber/calculation-check'

import { makeNumberContent } from '@/helpers/round-content'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './make-number-revealed.sass'

/** A calculation written out a line per step, the last result its value. */
const CalculationSheet: React.FC<{
  /** Where the sheet's lines start in the reveal's stagger, so the second sheet writes after the first. */
  delayFrom: number
  steps: Calculation
  tiles: readonly number[]
}> = ({ delayFrom, steps, tiles }) => (
  <ol className='sheet-lines'>
    {(calculationLines({ steps, tiles }) ?? [])
      .map((line, step) => ({ line, step }))
      .map(({ line, step }) => (
        <li key={step} style={{ '--line-index': delayFrom + step }}>
          {line.left} {OPERATOR_SIGNS[line.operator]} {line.right} ={' '}
          <span className='result'>{line.result}</span>
        </li>
      ))}
  </ol>
)

/**
 * A seat's reveal: its kept calculation written out step by step beside the
 * shortest one the draw allowed — _it was there_. What the round paid is the
 * round's block below, as in every game.
 */
export const MakeNumberRevealed: React.FC<{
  round: RoundView
  youId: PlayerId | null
}> = ({ round, youId }) => {
  const translate = useTranslate()
  const content = makeNumberContent(round)

  if (content?.solution == null) {
    return null
  }

  const nearestSent = (content.yourCalculations ?? []).reduce<{
    distance: number
    steps: Calculation
  } | null>((nearest, steps) => {
    const value = calculationValue({ steps, tiles: content.tiles })
    const distance = value === null ? null : Math.abs(value - content.target)

    return distance === null ||
      (nearest !== null && nearest.distance <= distance)
      ? nearest
      : { distance, steps }
  }, null)
  const yours =
    content.revealedCalculations?.find((seat) => seat.playerId === youId)
      ?.steps ??
    nearestSent?.steps ??
    null
  const yourValue =
    yours === null
      ? null
      : calculationValue({ steps: yours, tiles: content.tiles })

  return (
    <div className='make-number-revealed' data-game='makenumber'>
      {youId !== null && (
        <section className='answer-card yours'>
          <h2 className='title'>{translate('makenumber.reveal.yours')}</h2>
          {yours === null || yourValue === null ? (
            <p className='none'>{translate('makenumber.reveal.none')}</p>
          ) : (
            <>
              <CalculationSheet
                delayFrom={0}
                steps={yours}
                tiles={content.tiles}
              />
              <p
                className='distance'
                data-good={yourValue === content.target || undefined}
              >
                {yourValue === content.target
                  ? translate('makenumber.exact')
                  : translate('makenumber.distance', {
                      distance: Math.abs(yourValue - content.target)
                    })}
              </p>
            </>
          )}
        </section>
      )}
      <section className='answer-card shortest'>
        <h2 className='title'>
          {translate('makenumber.reveal.shortest', { target: content.target })}
        </h2>
        <CalculationSheet
          delayFrom={yours?.length ?? 0}
          steps={content.solution}
          tiles={content.tiles}
        />
      </section>
    </div>
  )
}
