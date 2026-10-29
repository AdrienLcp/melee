import type React from 'react'

import type { EstimateQuestion as Question } from '@melee/protocol/estimate'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import './estimate-question.sass'

type EstimateQuestionProps = {
  question: Question
}

/**
 * What is measured, small, over the name of what it is measured on, large: the
 * name is what the table reads from across the room, and the dictionary words
 * the measure so French never needs the article Wikidata's label lacks.
 */
export const EstimateQuestion: React.FC<EstimateQuestionProps> = ({
  question
}) => {
  const { locale, translate } = useI18n()

  return (
    <hgroup className='estimate-question'>
      <p className='asks'>{translate(`estimate.asks.${question.family}`)}</p>
      <h2 className='name'>{question.names[locale]}</h2>
    </hgroup>
  )
}
