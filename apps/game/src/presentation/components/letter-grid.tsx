import type React from 'react'

import {
  MYSTERY_WORD_TRY_COUNT,
  type SpelledTry
} from '@melee/protocol/mystery-word'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { type CellMark, LetterCell } from './letter-cell'

import './letter-grid.sass'

type LetterGridProps = {
  /** The letter every try starts with, given on the row being typed; `null` on a grid that types nothing. */
  firstLetter: string | null
  /** Names the grid for a screen reader: whose tries these are. */
  label: string
  length: number
  tries: readonly SpelledTry[]
  /** The row being typed, its given first letter included; `null` once the grid is done, or where nothing is typed. */
  typing: string | null
}

type Row = {
  cells: {
    hasCaret: boolean
    letter: string
    mark: CellMark
    /** Its place in the row, which is what tells a letter written twice apart. */
    position: number
  }[]
  /** Its place in the grid: a row is one try for its whole life, typed then marked. */
  position: number
  state: 'current' | 'done' | 'later' | 'unused'
}

const rowsOf = ({
  firstLetter,
  length,
  tries,
  typing
}: Omit<LetterGridProps, 'label'>): Row[] =>
  Array.from({ length: MYSTERY_WORD_TRY_COUNT }, (_, rowIndex) => {
    const spelled = tries[rowIndex]

    if (spelled !== undefined) {
      return {
        cells: [...spelled.word].map((letter, position) => ({
          hasCaret: false,
          letter,
          mark: spelled.marks[position] ?? 'absent',
          position
        })),
        position: rowIndex,
        state: 'done'
      }
    }

    if (typing !== null && rowIndex === tries.length) {
      return {
        cells: Array.from({ length }, (_, index) => {
          const letter =
            index === 0 ? (firstLetter ?? '') : (typing[index] ?? '')

          return {
            hasCaret: index === Math.max(1, typing.length),
            letter,
            mark: index === 0 ? 'given' : letter === '' ? 'empty' : 'typed',
            position: index
          }
        }),
        position: rowIndex,
        state: 'current'
      }
    }

    return {
      cells: Array.from({ length }, (_, position) => ({
        hasCaret: false,
        letter: '',
        mark: 'empty',
        position
      })),
      position: rowIndex,
      state: typing === null ? 'unused' : 'later'
    }
  })

/**
 * A seat's six rows of a hidden word: every try with its letters and marks,
 * the row being typed with its caret, and the rows still to come. Sized off
 * the box it is given — a size container — so the same grid is a phone's
 * board and one of twenty-four on the wall's reveal.
 */
export const LetterGrid: React.FC<LetterGridProps> = ({ label, ...grid }) => {
  const translate = useTranslate()

  return (
    <div className='letter-grid' style={{ '--grid-columns': grid.length }}>
      <ol aria-label={label}>
        {rowsOf(grid).map((row) => (
          <li
            aria-label={
              row.state === 'current' && grid.typing !== null
                ? translate('mysteryword.typing', { word: grid.typing })
                : undefined
            }
            className='letter-row'
            data-row={row.state}
            key={row.position}
          >
            {row.cells.map((cell) => (
              <LetterCell
                hasCaret={cell.hasCaret}
                index={cell.position}
                key={cell.position}
                letter={cell.letter}
                mark={cell.mark}
              />
            ))}
          </li>
        ))}
      </ol>
    </div>
  )
}
