import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { longestWordContent } from '@/helpers/round-content'
import { LetterTile } from '@/presentation/components/letter-tile'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './longest-word-revealed.sass'

/** A word laid on nine columns, so a seat's word stands under the draw's longest letter for letter. */
const TileRow: React.FC<{
  /** `faceUp` deals the row over, left to right. */
  face: 'faceUp' | 'still'
  word: string
}> = ({ face, word }) => (
  <p className='tile-row'>
    <VisuallyHidden elementType='span'>{word}</VisuallyHidden>
    <span aria-hidden className='tiles'>
      {[...word]
        .map((letter, position) => ({ letter, position }))
        .map(({ letter, position }) => (
          <LetterTile
            face={face}
            index={position}
            key={position}
            letter={letter}
          />
        ))}
    </span>
  </p>
)

/**
 * A seat's reveal: the longest word the draw held, dealt face up, the others
 * as long under it, then the seat's own word on the same nine columns. What
 * the round paid is the round's block below, as in every game.
 */
export const LongestWordRevealed: React.FC<{
  round: RoundView
  youId: PlayerId | null
}> = ({ round, youId }) => {
  const translate = useTranslate()
  const content = longestWordContent(round)
  const [bestWord, ...alsoLong] = content?.bestWords ?? []

  if (content?.bestLength == null || bestWord === undefined) {
    return null
  }

  const yours =
    content.revealedWords?.find((seat) => seat.playerId === youId)?.word ??
    content.yourWords?.toSorted(
      (left, right) => right.length - left.length
    )[0] ??
    null

  return (
    <div className='longest-word-revealed' data-game='longestword'>
      <section className='answer-card best'>
        <h2 className='title'>{translate('longestword.reveal.title')}</h2>
        <TileRow face='faceUp' word={bestWord} />
        {alsoLong.length > 0 && (
          <p className='also'>
            {translate('longestword.reveal.alsoLong', {
              length: content.bestLength,
              words: alsoLong.join(', ')
            })}
          </p>
        )}
      </section>
      {youId !== null && (
        <section
          aria-label={translate('longestword.seat')}
          className='answer-card yours'
        >
          {yours === null ? (
            <p className='no-word'>{translate('longestword.noWord')}</p>
          ) : (
            <TileRow face='still' word={yours} />
          )}
        </section>
      )}
    </div>
  )
}
