import type React from 'react'

import type { Calculation } from '@melee/protocol/make-number'

import {
  calculationLines,
  OPERATOR_SIGNS
} from '@melee/core/makenumber/calculation-check'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './make-number-shortest.sass'

type MakeNumberShortestProps = {
  /** The draw's shortest exact calculation. */
  solution: Calculation
  target: number
  tiles: readonly number[]
}

/**
 * The shortest way the tiles made the target, a line a step written out
 * one after the other, the last result on the found face: at the reveal,
 * _it was there_; on the console beside a wall, what the host alone follows
 * the race against.
 */
export const MakeNumberShortest: React.FC<MakeNumberShortestProps> = ({
  solution,
  target,
  tiles
}) => {
  const translate = useTranslate()

  return (
    <div className='make-number-shortest'>
      <h2 className='title'>
        {translate('makenumber.reveal.shortest', { target })}
      </h2>
      <ol className='lines'>
        {(calculationLines({ steps: solution, tiles }) ?? [])
          .map((line, step) => ({ line, step }))
          .map(({ line, step }) => (
            <li key={step} style={{ '--line-index': step }}>
              {line.left} {OPERATOR_SIGNS[line.operator]} {line.right} ={' '}
              <span className='result'>{line.result}</span>
            </li>
          ))}
      </ol>
    </div>
  )
}
