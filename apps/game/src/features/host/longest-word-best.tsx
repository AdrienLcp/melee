import type React from 'react'

import { DrawnWordTiles } from '@/presentation/components/drawn-word-tiles'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './longest-word-best.sass'

type LongestWordBestProps = {
  /** The draw's longest words, familiar first; the first is dealt on tiles and the others named under it. */
  bestWords: readonly string[]
}

/**
 * The longest word the draw held, turned over tile by tile at the reveal with
 * its length beside it — the moment the table argues — and any other word as
 * long named on a line under it.
 */
export const LongestWordBest: React.FC<LongestWordBestProps> = ({
  bestWords
}) => {
  const translate = useTranslate()
  const [best, ...alsoLong] = bestWords

  if (best === undefined) {
    return null
  }

  return (
    <div className='longest-word-best'>
      <h2 className='best'>
        <VisuallyHidden elementType='span'>
          {translate('longestword.bestSaid', {
            count: best.length,
            word: best
          })}
        </VisuallyHidden>
        <span aria-hidden className='had'>
          {translate('longestword.reveal.title')}
        </span>
        <DrawnWordTiles face='faceUp' word={best} />
        <b aria-hidden className='length'>
          {best.length}
        </b>
      </h2>
      {alsoLong.length > 0 && (
        <p className='also'>
          {translate('longestword.reveal.alsoLong', {
            length: best.length,
            words: alsoLong.join(', ')
          })}
        </p>
      )}
    </div>
  )
}
