import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { MAX_ESTIMATE, UNIT_OF_FAMILY } from '@melee/protocol/estimate'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { estimateContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { QuantityField } from '@/presentation/components/quantity-field'
import { useQuantityWords } from '@/presentation/components/use-quantity-words'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './estimate-answer.sass'

const GUESS_FORMAT = { maximumFractionDigits: 2 } as const

type EstimateAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
  /** The seat answering: a player's, a seated console's, or the wall's team. */
  youId: PlayerId | null
}

/**
 * The estimate typed with its unit beside it and sent once: a number seen
 * again after a second thought is a guess at the room, not at the question.
 *
 * Mounted under `key={round.id}`, so every round opens on an empty slot.
 */
export const EstimateAnswer: React.FC<EstimateAnswerProps> = ({
  onAnswer,
  round,
  youId
}) => {
  const translate = useTranslate()
  const quantityWords = useQuantityWords()
  const [guess, setGuess] = useState(Number.NaN)
  const [sentGuess, setSentGuess] = useState<number | null>(null)
  const content = estimateContent(round)
  // The server's record is what survives a reload, and it carries the guess
  // back with it.
  const sent = sentGuess ?? content?.yourGuess ?? null
  const hasAnswered =
    sent !== null || round.answers.some((answer) => answer.playerId === youId)

  if (content === null) {
    return null
  }

  const unit = UNIT_OF_FAMILY[content.question.family]
  if (hasAnswered) {
    return (
      <section className='answer-form estimate-answer' data-sent>
        {sent !== null && <p className='yours'>{quantityWords(sent, unit)}</p>}
        <p className='hint' role='status'>
          {translate('estimate.answer.sent')}
        </p>
      </section>
    )
  }

  return (
    <section className='answer-form estimate-answer'>
      <Form
        onSubmit={(event) => {
          event.preventDefault()

          if (guess > 0 && onAnswer({ guess, kind: 'number' })) {
            setSentGuess(guess)
          }
        }}
      >
        <QuantityField
          // The form only ever mounts on `playing`, so this opens the keyboard
          // when the round does and never over a countdown.
          autoFocus
          formatOptions={GUESS_FORMAT}
          label={translate('estimate.answer.label')}
          maxValue={MAX_ESTIMATE}
          minValue={0}
          onChange={setGuess}
          unit={translate(`estimate.unitNames.${unit}`)}
          value={guess}
        />
        {/* Never disabled: the field commits its number on blur, so a button
          waiting for it is still disabled under the very press that blurs. */}
        <Button size='large' type='submit'>
          {translate('estimate.answer.send')}
        </Button>
      </Form>
    </section>
  )
}
