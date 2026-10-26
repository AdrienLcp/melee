import type React from 'react'

import type { PetitBacLineOutcome } from '@melee/protocol/petit-bac'
import type { PlayerRoomView, RoundView } from '@melee/protocol/room'

import { PETIT_BAC_POINTS } from '@melee/core/petitbac/sheet-pay'

import { petitBacCategoryId } from '@/features/player/petit-bac-sheet'
import { petitBacContent } from '@/helpers/round-content'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { petitBacCategoryName } from '@/presentation/i18n/petit-bac-category-name'

import './petit-bac-reveal.sass'
import { shownPoints } from '@/helpers/shown-points'

const OUTCOME_WORDS = {
  empty: 'petitbac.reveal.outcome.empty',
  refused: 'petitbac.reveal.outcome.refused',
  shared: 'petitbac.reveal.outcome.shared',
  unique: 'petitbac.reveal.outcome.unique'
} as const satisfies Record<Exclude<PetitBacLineOutcome, 'offLetter'>, string>

type PetitBacRevealProps = {
  round: RoundView
  youId: PlayerRoomView['youId']
}

/**
 * This seat's own sheet turned over: every line beside what the room made of
 * it and what it paid, so a refused word or a blank reads at a glance. The
 * round's total stays under it, where every game puts it.
 */
export const PetitBacReveal: React.FC<PetitBacRevealProps> = ({
  round,
  youId
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)

  if (content === null) {
    return null
  }

  const yours = content.categories.map((category, index) => ({
    category,
    line: content.lines[index]?.find((line) => line.playerId === youId) ?? null
  }))

  if (yours.every(({ line }) => line === null)) {
    return null
  }

  return (
    <section className='petit-bac-reveal'>
      <h2 className='head'>
        <VisuallyHidden elementType='span'>
          {`${translate('petitbac.reveal.title')} `}
        </VisuallyHidden>
        <span className='letter-piece'>{content.letter}</span>
      </h2>
      <ol className='lines'>
        {yours.map(({ category, line }) => {
          const outcome = line?.outcome ?? 'empty'
          const points = PETIT_BAC_POINTS[outcome]

          return (
            <li
              className='line'
              data-outcome={outcome}
              key={petitBacCategoryId(category)}
            >
              <span className='category'>
                {petitBacCategoryName({ category, translate })}
              </span>
              <span className='text'>{line?.text || '—'}</span>
              <span className='word'>
                {outcome === 'offLetter'
                  ? translate('petitbac.reveal.outcome.offLetter', {
                      letter: content.letter
                    })
                  : translate(OUTCOME_WORDS[outcome])}
              </span>
              <span className='points'>
                {points > 0
                  ? translate('round.scored', { points: shownPoints(points) })
                  : '0'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
