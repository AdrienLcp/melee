import type React from 'react'

import type {
  BlackSquareCell,
  BlackSquareCellTiers,
  BlackSquareSentLine,
  BlackSquareTier
} from '@melee/protocol/black-square'

import {
  blackSquareCellStyle,
  blackSquareGridStyle
} from '@/helpers/black-square-cell-place'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { BlackSquarePips } from './black-square-pips'

import './black-square-sheet.sass'

type DealtCell = { cell: BlackSquareCell; tier: BlackSquareTier }

const cellsOf = (cellTiers: BlackSquareCellTiers): DealtCell[] =>
  cellTiers.map((tier, cell) => ({ cell, tier }))

type BlackSquareSheetProps = {
  /** The tier of every answer the round dealt, three to nine of them. */
  cellTiers: BlackSquareCellTiers
  /** The seat's own lines as the server read them back, which is all it knows of a cell's text. */
  lines: readonly BlackSquareSentLine[]
  /**
   * The cells a keeper ticked in a spoken round, lit with their pips alone: the
   * table said them aloud, and the screen was never sent their names.
   */
  tickedCells?: readonly BlackSquareCell[]
}

/**
 * A seat's grid, one tier a row in cell order so a cell's place says what it pays:
 * an empty cell is a socket printing its pips, a found one a green piece with
 * the line the seat typed — never the answer's own name, which it is not sent.
 *
 * The black word lies over the grid once the seat lands on it, the cells under
 * it voided: the round is cut and worth nothing.
 */
export const BlackSquareSheet: React.FC<BlackSquareSheetProps> = ({
  cellTiers,
  lines,
  tickedCells = []
}) => {
  const translate = useTranslate()
  const blackWord = lines.find((line) => line.hitBlackWord)?.line ?? null

  return (
    <div
      className='black-square-sheet'
      data-voided={blackWord !== null || undefined}
    >
      <ol
        aria-label={translate('blacksquare.grid')}
        style={{
          ...blackSquareGridStyle(cellTiers),
          '--cell-count': cellTiers.length
        }}
      >
        {cellsOf(cellTiers).map(({ cell, tier }) => {
          const typed = lines.find((line) => line.cells.includes(cell))?.line
          const isFound = typed !== undefined || tickedCells.includes(cell)

          return (
            <li
              data-found={isFound || undefined}
              key={cell}
              style={blackSquareCellStyle({ cell, cellTiers })}
            >
              {typed !== undefined && <span className='typed'>{typed}</span>}
              <BlackSquarePips cellTiers={cellTiers} tier={tier} />
            </li>
          )
        })}
      </ol>
      {blackWord !== null && (
        <div className='black-word-piece' role='status'>
          <span className='stamp'>
            {translate('blacksquare.blackWord.stamp')}
          </span>
          <span className='word'>{blackWord}</span>
          <span className='what'>
            {translate('blacksquare.blackWord.ends')}
          </span>
        </div>
      )}
    </div>
  )
}
