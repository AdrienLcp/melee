import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { FinishIcon, StartIcon } from './icons'
import { VisuallyHidden } from './visually-hidden'

import './case-mark.sass'

const CASES_PER_MARK = 5

/** How the track prints a case: its two ends and every fifth stand out. */
export type CaseMarkKind = 'finish' | 'five' | 'start'

/** What the track prints on `caseIndex`, the plain cases printing nothing more than their number. */
export const caseMarkOf = ({
  caseIndex,
  length
}: {
  caseIndex: number
  length: number
}): CaseMarkKind | undefined => {
  if (caseIndex === 0) {
    return 'start'
  }

  if (caseIndex === length) {
    return 'finish'
  }

  return caseIndex % CASES_PER_MARK === 0 ? 'five' : undefined
}

type CaseMarkProps = {
  /** The case a pawn stands on: 0 is the start, `length` the finish. */
  at: number
  /** The track's length, which says where the finish is. */
  length: number
}

/**
 * The case a pawn stands on, drawn as the track draws it — a printed case with
 * its number in the corner, the start's house and the finish's flag at the
 * ends — so a list beside the names reads as squares, never as a score.
 */
export const CaseMark: React.FC<CaseMarkProps> = ({ at, length }) => {
  const translate = useTranslate()
  const mark = caseMarkOf({ caseIndex: at, length })

  return (
    <span className='case-mark' data-mark={mark}>
      {mark === 'start' ? (
        <StartIcon className='glyph' />
      ) : mark === 'finish' ? (
        <FinishIcon className='glyph' />
      ) : (
        <span aria-hidden='true' className='number'>
          {at}
        </span>
      )}
      <VisuallyHidden elementType='span'>
        {translate('board.at', { case: at })}
      </VisuallyHidden>
    </span>
  )
}
