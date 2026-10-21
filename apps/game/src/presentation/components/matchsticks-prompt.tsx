import type React from 'react'

import type {
  MatchsticksGoal,
  MatchsticksPuzzle,
  MatchsticksSolution
} from '@melee/protocol/matchsticks'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { MatchstickRow } from './matchstick-row'
import { VisuallyHidden } from './visually-hidden'

import './matchsticks-prompt.sass'

const GOAL_KEYS = {
  biggest: 'matchsticks.goal.biggest',
  equation: 'matchsticks.goal.equation',
  smallest: 'matchsticks.goal.smallest'
} as const satisfies Record<MatchsticksGoal, PlainTranslationKey>

type MatchsticksPromptProps = {
  puzzle: MatchsticksPuzzle
  /** The move once the room is shown it, drawn travelling into place; `null` while the puzzle is still to solve. */
  solution?: MatchsticksSolution | null
}

/**
 * What one move has to do, said in words over the sticks it is done to. The
 * same piece on the wall, the console and a player's screen, printed on
 * whatever card the caller lays it on and sized by that card.
 */
export const MatchsticksPrompt: React.FC<MatchsticksPromptProps> = ({
  puzzle,
  solution = null
}) => {
  const translate = useTranslate()

  return (
    <div
      className='matchsticks-prompt'
      data-solved={solution !== null || undefined}
    >
      <p className='goal'>{translate(GOAL_KEYS[puzzle.goal])}</p>
      {solution === null ? (
        <MatchstickRow glyphs={puzzle.glyphs} />
      ) : (
        <>
          <VisuallyHidden>
            {translate('matchsticks.reveal.title')}
          </VisuallyHidden>
          <MatchstickRow glyphs={solution.glyphs} move={solution.move} />
        </>
      )}
    </div>
  )
}
