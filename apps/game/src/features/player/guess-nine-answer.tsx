import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { GUESS_NINE_CELL_COUNT } from '@melee/protocol/guess-nine'
import type { RoundView } from '@melee/protocol/room'
import type { Verdict } from '@melee/protocol/scoring'

import { isSheetClosed, tierOfCell } from '@melee/core/guessnine/sheet-pay'

import { guessNineContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { pointsOfTier } from '@/presentation/components/guess-nine-pips'
import { GuessNineSheet } from '@/presentation/components/guess-nine-sheet'
import { TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './guess-nine-answer.sass'

type GuessNineAnswerProps = {
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
export const GuessNineAnswer: React.FC<GuessNineAnswerProps> = ({
  onAnswer,
  round,
  verdict
}) => {
  const translate = useTranslate()
  const [guess, setGuess] = useState('')
  const content = guessNineContent(round)
  const cellCount = content?.answerCount ?? GUESS_NINE_CELL_COUNT
  const lines = content?.yourLines ?? []
  const isClosed = verdict?.kind === 'cells' && isSheetClosed(verdict)
  const isEmpty = guess.trim() === ''
  const last = lines.at(-1) ?? null

  return (
    <section className='answer-form guess-nine-answer'>
      <GuessNineSheet cellCount={cellCount} lines={lines} />
      <p
        className='echo'
        data-hit={(last?.cells.length ?? 0) > 0 || undefined}
        role='status'
      >
        {last === null
          ? translate('guessnine.answer.retry')
          : !last.hitBlackWord &&
            (last.cells.length === 0
              ? translate('guessnine.answer.miss', { line: last.line })
              : translate('guessnine.answer.hit', {
                  line: last.line,
                  points: last.cells.reduce(
                    (total, cell) =>
                      total + pointsOfTier(tierOfCell({ cell, cellCount })),
                    0
                  )
                }))}
      </p>
      {isClosed ? (
        <p className='others'>{translate('guessnine.othersLooking')}</p>
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
            label={translate('guessnine.answer.label')}
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
