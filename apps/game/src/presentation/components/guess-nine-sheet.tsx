import type React from 'react'

import {
  GUESS_NINE_CELL_COUNT,
  type GuessNineCell,
  type GuessNineSentLine
} from '@melee/protocol/guess-nine'

import { tierOfCell } from '@melee/core/guessnine/sheet-pay'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { GuessNinePips } from './guess-nine-pips'

import './guess-nine-sheet.sass'

type GuessNineSheetProps = {
  /** The seat's own lines as the server read them back, which is all it knows of a cell's text. */
  lines: readonly GuessNineSentLine[]
  /**
   * The cells a keeper ticked in a spoken round, lit with their pips alone: the
   * table said them aloud, and the screen was never sent their names.
   */
  tickedCells?: readonly GuessNineCell[]
}

const CELLS = Array.from({ length: GUESS_NINE_CELL_COUNT }, (_, cell) => cell)

/**
 * A seat's grid, three by three in cell order so a cell's place says its tier:
 * an empty cell is a socket printing its pips, a found one a green piece with
 * the line the seat typed — never the answer's own name, which it is not sent.
 *
 * The black word lies over the grid once the seat lands on it, the cells under
 * it voided: the round is cut and worth nothing.
 */
export const GuessNineSheet: React.FC<GuessNineSheetProps> = ({
  lines,
  tickedCells = []
}) => {
  const translate = useTranslate()
  const blackWord = lines.find((line) => line.hitBlackWord)?.line ?? null

  return (
    <div
      className='guess-nine-sheet'
      data-voided={blackWord !== null || undefined}
    >
      <ol aria-label={translate('guessnine.grid')}>
        {CELLS.map((cell) => {
          const typed = lines.find((line) => line.cells.includes(cell))?.line
          const isFound = typed !== undefined || tickedCells.includes(cell)

          return (
            <li data-found={isFound || undefined} key={cell}>
              {typed !== undefined && <span className='typed'>{typed}</span>}
              <GuessNinePips tier={tierOfCell(cell)} />
            </li>
          )
        })}
      </ol>
      {blackWord !== null && (
        <div className='black-word-piece' role='status'>
          <span className='stamp'>
            {translate('guessnine.blackWord.stamp')}
          </span>
          <span className='word'>{blackWord}</span>
          <span className='what'>{translate('guessnine.blackWord.ends')}</span>
        </div>
      )}
    </div>
  )
}
