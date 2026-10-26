import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import {
  ChoiceAnswer,
  candidatesIn,
  longestChoiceLength,
  type PlayerAnswer
} from '@/features/player/answer-forms'
import { PrintedChoices } from '@/features/player/printed-choices'
import { RoundQuestion } from '@/features/player/round-question'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './choosing-round.sass'

/**
 * Past this a candidate is a sentence rather than a name, and four of them
 * read better as four full-width rows than as a grid of narrow columns, at any
 * ratio: the words per tile stay the same, the lines per tile halve.
 */
const LONG_CHOICE_LENGTH = 60

type ChoosingRoundProps = {
  /** Sends the pick, and says whether the socket took it; `null` for a seat watching a duel, which is shown the tiles printed. */
  onAnswer: ((answer: PlayerAnswer) => boolean) | null
  round: RoundView
  /** The seat answering: a player's, or the console's once its host sat down. */
  youId: PlayerId | null
}

/**
 * A question card and four tiles, held to the box a framed page gives them —
 * on a player's screen and on a seated host's console alike, because the rule
 * that none of it scrolls is the same on both.
 */
export const ChoosingRound: React.FC<ChoosingRoundProps> = ({
  onAnswer,
  round,
  youId
}) => {
  const { locale } = useI18n()
  const choiceLength = longestChoiceLength(candidatesIn({ locale, round }))

  return (
    <section
      className='choosing-round'
      data-long-choices={choiceLength > LONG_CHOICE_LENGTH || undefined}
      style={{ '--choice-length': choiceLength }}
    >
      <RoundQuestion round={round} />
      {onAnswer === null ? (
        <PrintedChoices round={round} />
      ) : (
        <ChoiceAnswer
          key={round.id}
          onAnswer={onAnswer}
          round={round}
          youId={youId}
        />
      )}
    </section>
  )
}
