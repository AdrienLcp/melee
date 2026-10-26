import type React from 'react'

import type { RoundView } from '@melee/protocol/room'

import { candidatesIn } from '@/features/player/answer-forms'
import { AnswerTileFace, tileInks } from '@/presentation/components/answer-tile'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './printed-choices.sass'

type PrintedChoicesProps = {
  round: RoundView
}

/**
 * The four candidates as the room reads them on the screen it shares: the same
 * tiles every player is choosing between, printed rather than pressable,
 * because nobody picks on this screen and a button nobody may press is a lie.
 */
export const PrintedChoices: React.FC<PrintedChoicesProps> = ({ round }) => {
  const { locale } = useI18n()

  return (
    <ol className='printed-choices'>
      {candidatesIn({ locale, round }).map((candidate, index) => (
        <li className='answer-tile' key={candidate.key} style={tileInks(index)}>
          <AnswerTileFace
            index={index}
            subtitle={candidate.subtitle}
            title={candidate.title}
          />
        </li>
      ))}
    </ol>
  )
}
