import type React from 'react'

import type { LetterMark } from '@melee/protocol/mystery-word'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { VisuallyHidden } from './visually-hidden'

import './letter-cell.sass'

/**
 * What a cell of a word grid holds: one of the three marks a try comes back
 * with, a letter being typed, the first letter every screen is given, or
 * nothing yet.
 */
export type CellMark = LetterMark | 'empty' | 'given' | 'typed'

type LetterCellProps = {
  /** The bar under the next letter of the row being typed. */
  hasCaret?: boolean
  /** Where the cell stands in its row, which deals its turn over left to right. */
  index: number
  /** One letter, or empty for a cell drawn in colour alone — the wall's grids, a legend's swatch. */
  letter: string
  mark: CellMark
}

/**
 * The printed shape beside a mark's ink, so a mark is never told by colour
 * alone: a diamond for a letter in place, a ring for one elsewhere in the word.
 * Drawn by the stylesheet off `data-mark`, on the cell or on its own.
 */
export const MarkShape: React.FC<{ mark: 'placed' | 'present' }> = ({
  mark
}) => <span aria-hidden className='mark-shape' data-mark={mark} />

/**
 * One letter tile of a word game. A marked cell turns over when its mark is
 * first drawn, dealt left to right along its row (`--letter-index`), so a try
 * coming back reads as its letters being turned face up one by one.
 */
export const LetterCell: React.FC<LetterCellProps> = ({
  hasCaret = false,
  index,
  letter,
  mark
}) => {
  const translate = useTranslate()
  const isMarked = mark === 'placed' || mark === 'present' || mark === 'absent'

  return (
    <span
      className='letter-cell'
      data-caret={hasCaret || undefined}
      data-mark={mark}
      style={{ '--letter-index': index }}
    >
      {(mark === 'placed' || mark === 'present') && <MarkShape mark={mark} />}
      <span className='letter'>{letter}</span>
      {isMarked && (
        <VisuallyHidden elementType='span'>
          {`, ${translate(`mysteryword.mark.${mark}`)}`}
        </VisuallyHidden>
      )}
    </span>
  )
}
