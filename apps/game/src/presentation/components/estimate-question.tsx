import type React from 'react'

import type { EstimateQuestion as Question } from '@melee/protocol/estimate'

import { scaleForLength } from '@/helpers/length-scale'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './estimate-question.sass'

/** The longest name drawn at the card's full size; nineteen in twenty of the bank's are no longer. */
const NAME_LENGTH_AT_FULL_SIZE = 20

/** The longest question of the evening's own drawn at its full size: _How many kilometres did we drive?_ */
const PROMPT_LENGTH_AT_FULL_SIZE = 40

type EstimateQuestionProps = {
  question: Question
}

/**
 * What is measured, small, over the name of what it is measured on, large: the
 * name is what the table reads from across the room, and the dictionary words
 * the measure so French never needs the article Wikidata's label lacks. A
 * question the evening wrote is its own sentence, drawn alone and large.
 */
export const EstimateQuestion: React.FC<EstimateQuestionProps> = ({
  question
}) => {
  const { locale, translate } = useI18n()

  if (question.kind === 'own') {
    return (
      <hgroup className='estimate-question'>
        <h2
          className='prompt'
          style={{
            '--name-scale': scaleForLength({
              length: question.prompt.length,
              lengthAtFullSize: PROMPT_LENGTH_AT_FULL_SIZE
            })
          }}
        >
          {question.prompt}
        </h2>
      </hgroup>
    )
  }

  const name = question.names[locale]

  return (
    <hgroup className='estimate-question'>
      <p className='asks'>{translate(`estimate.asks.${question.family}`)}</p>
      <h2
        className='name'
        style={{
          '--name-scale': scaleForLength({
            length: name.length,
            lengthAtFullSize: NAME_LENGTH_AT_FULL_SIZE
          })
        }}
      >
        {name}
      </h2>
    </hgroup>
  )
}
