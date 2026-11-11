import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { foundOnTryOf } from '@melee/core/mysteryword/grid-reading'

import { mysteryWordContent } from '@/helpers/round-content'
import { LetterGrid } from '@/presentation/components/letter-grid'
import { RevealedWord } from '@/presentation/components/revealed-word'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './mystery-word-revealed.sass'

/**
 * A seat's reveal: the word dealt letter by letter, and under it the seat's
 * own grid and the try that found it. What the round paid is the round's
 * block below, as in every game.
 */
export const MysteryWordRevealed: React.FC<{
  round: RoundView
  youId: PlayerId | null
}> = ({ round, youId }) => {
  const translate = useTranslate()
  const content = mysteryWordContent(round)

  if (content?.revealedWord == null) {
    return null
  }

  const tries =
    content.revealedGrids?.find((grid) => grid.playerId === youId)?.tries ??
    content.yourTries ??
    []
  const foundOnTry = foundOnTryOf(tries.map((spelled) => spelled.marks))

  return (
    <div className='mystery-word-revealed' data-game='mysteryword'>
      <RevealedWord word={content.revealedWord} />
      {youId !== null && (
        <section className='answer-card yours'>
          <p className='found'>
            {foundOnTry === null
              ? translate('mysteryword.notFound')
              : translate('mysteryword.found.title', { count: foundOnTry })}
          </p>
          <LetterGrid
            firstLetter={null}
            label={translate('mysteryword.grid')}
            length={content.length}
            tries={tries}
            typing={null}
          />
        </section>
      )}
    </div>
  )
}
