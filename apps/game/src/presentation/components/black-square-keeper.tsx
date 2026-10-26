import type React from 'react'
import { useState } from 'react'
import { Button as PressablePiece, ToggleButton } from 'react-aria-components'

import type {
  BlackSquareAnswer,
  BlackSquareBlackWord,
  BlackSquareCell
} from '@melee/protocol/black-square'

import { blackSquareCellStyle } from '@/helpers/black-square-cell-place'
import { Button } from '@/presentation/components/button'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { BlackSquarePips } from './black-square-pips'
import { BlackSquareSheet } from './black-square-sheet'
import { CheckIcon } from './icons'

import './black-square-keeper.sass'

/** A cell's place on the grid is its identity: the list is dealt once a round and never reordered. */
const cellKeyOf = (cell: number): string => `cell-${cell}`

type BlackSquareKeeperProps = {
  /** The name of the team saying its answers aloud, in this screen's language. */
  guessingTeam: string
  /** The answers dealt and the black word, which this seat alone is sent. */
  list: { answers: BlackSquareAnswer[]; blackWord: BlackSquareBlackWord }
  /** `false` from the socket means the frame was never written. */
  onTick: (cell: BlackSquareCell | 'blackWord', isTicked: boolean) => boolean
  /** What the server holds ticked, which is what every screen draws. */
  tickedCells: readonly BlackSquareCell[]
}

/**
 * The keeper's list in a spoken round: the answers as presses on paper, ticked as
 * the guessing team says them and taken back on a second press, and the black
 * word in its ink under them, which asks once more before it ends the round.
 *
 * It opens hidden, the grid printing its pips alone, because the screen is
 * often held up to the room or turned round on a table: one press shows the
 * names, one hides them again.
 */
export const BlackSquareKeeper: React.FC<BlackSquareKeeperProps> = ({
  guessingTeam,
  list,
  onTick,
  tickedCells
}) => {
  const { locale, translate } = useI18n()
  const [isShown, setIsShown] = useState(false)
  const [isAsking, setIsAsking] = useState(false)

  return (
    <section className='black-square-keeper' data-shown={isShown || undefined}>
      <p className='brief'>
        {translate('blacksquare.spoken.keep', { team: guessingTeam })}
      </p>
      {isShown ? (
        <ol aria-label={translate('blacksquare.grid')} className='keeper-cells'>
          {list.answers.map((answer, cell) => (
            <li
              key={cellKeyOf(cell)}
              style={blackSquareCellStyle({
                cell,
                cellCount: list.answers.length
              })}
            >
              <ToggleButton
                className='keeper-cell'
                isSelected={tickedCells.includes(cell)}
                onChange={(isTicked) => onTick(cell, isTicked)}
              >
                <span className='name'>{answer.labels[locale]}</span>
                <span className='foot'>
                  <CheckIcon />
                  <BlackSquarePips tier={answer.tier} />
                </span>
              </ToggleButton>
            </li>
          ))}
        </ol>
      ) : (
        <BlackSquareSheet
          cellCount={list.answers.length}
          lines={[]}
          tickedCells={tickedCells}
        />
      )}
      {!isShown ? (
        <p className='hidden-note'>{translate('blacksquare.spoken.hidden')}</p>
      ) : isAsking ? (
        <div className='black-word-ask'>
          <p className='ask' role='status'>
            <span className='word'>{list.blackWord.labels[locale]}</span>
            <span className='what'>
              {translate('blacksquare.spoken.blackWord.ask')}
            </span>
          </p>
          <div className='answers'>
            <Button
              onPress={() => {
                onTick('blackWord', true)
              }}
            >
              {translate('blacksquare.spoken.blackWord.confirm')}
            </Button>
            <Button
              onPress={() => {
                setIsAsking(false)
              }}
              variant='underlined'
            >
              {translate('blacksquare.spoken.blackWord.keep')}
            </Button>
          </div>
        </div>
      ) : (
        <PressablePiece
          className='black-word-press'
          onPress={() => {
            setIsAsking(true)
          }}
        >
          <span className='stamp'>
            {translate('blacksquare.blackWord.stamp')}
          </span>
          <span className='word'>{list.blackWord.labels[locale]}</span>
        </PressablePiece>
      )}
      <Button
        onPress={() => {
          setIsShown(!isShown)
          setIsAsking(false)
        }}
        variant='outlined'
      >
        {translate(
          isShown ? 'blacksquare.spoken.hide' : 'blacksquare.spoken.show'
        )}
      </Button>
    </section>
  )
}
