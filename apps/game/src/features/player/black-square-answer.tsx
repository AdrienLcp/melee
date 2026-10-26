import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { BLACK_SQUARE_CELL_COUNT } from '@melee/protocol/black-square'
import type { RoundView } from '@melee/protocol/room'
import type { Verdict } from '@melee/protocol/scoring'

import { isSheetClosed, tierOfCell } from '@melee/core/blacksquare/sheet-pay'

import { blackSquareContent } from '@/helpers/round-content'
import { pointsOfTier } from '@/presentation/components/black-square-pips'
import { BlackSquareSheet } from '@/presentation/components/black-square-sheet'
import { Button } from '@/presentation/components/button'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './black-square-answer.sass'

type BlackSquareAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
  /** The seat's sheet as the server holds it, `null` before its first line. */
  verdict: Verdict | null
}

/**
 * A seat's sheet: the grid filling with its own hits, the last line it sent
 * echoed above one field that empties on every send, and the round going on
 * after a hit — it closes on the black word, on every answer, or on the clock.
 *
 * Mounted under `key={round.id}`, so a draft never crosses into the next round.
 */
export const BlackSquareAnswer: React.FC<BlackSquareAnswerProps> = ({
  onAnswer,
  round,
  verdict
}) => {
  const translate = useTranslate()
  const [guess, setGuess] = useState('')
  const content = blackSquareContent(round)
  const cellCount = content?.answerCount ?? BLACK_SQUARE_CELL_COUNT
  const lines = content?.yourLines ?? []
  const isClosed = verdict?.kind === 'cells' && isSheetClosed(verdict)
  const isEmpty = guess.trim() === ''
  const last = lines.at(-1) ?? null

  return (
    <section className='answer-form black-square-answer'>
      <BlackSquareSheet cellCount={cellCount} lines={lines} />
      <p
        className='echo'
        data-hit={(last?.cells.length ?? 0) > 0 || undefined}
        role='status'
      >
        {last === null
          ? translate('blacksquare.answer.retry')
          : !last.hitBlackWord &&
            (last.cells.length === 0
              ? translate('blacksquare.answer.miss', { line: last.line })
              : translate('blacksquare.answer.hit', {
                  line: last.line,
                  points: last.cells.reduce(
                    (total, cell) =>
                      total + pointsOfTier(tierOfCell({ cell, cellCount })),
                    0
                  )
                }))}
      </p>
      {isClosed ? (
        <p className='others'>{translate('blacksquare.othersLooking')}</p>
      ) : (
        <Form
          onSubmit={(event) => {
            event.preventDefault()

            if (!isEmpty && onAnswer({ guess: guess.trim(), kind: 'typed' })) {
              setGuess('')
            }
          }}
        >
          <TextField
            autoComplete='off'
            autoFocus
            enterKeyHint='send'
            label={translate('blacksquare.answer.label')}
            onChange={setGuess}
            value={guess}
          />
          <Button isDisabled={isEmpty} type='submit'>
            {translate('round.answer.submit')}
          </Button>
        </Form>
      )}
    </section>
  )
}
