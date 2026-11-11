import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { LetterCell } from './letter-cell'
import { VisuallyHidden } from './visually-hidden'

import './revealed-word.sass'

/**
 * The hidden word put up at the reveal, every letter in place and turned over
 * one after the other: on the wall and the console over the spelled grids, on
 * a seat over its own.
 */
export const RevealedWord: React.FC<{ word: string }> = ({ word }) => {
  const translate = useTranslate()

  return (
    <h2 className='revealed-word'>
      <VisuallyHidden elementType='span'>
        {`${translate('mysteryword.reveal.title')} ${word}`}
      </VisuallyHidden>
      <span
        aria-hidden
        className='letter-row'
        style={{ '--grid-columns': word.length }}
      >
        {[...word]
          .map((letter, position) => ({ letter, position }))
          .map(({ letter, position }) => (
            <LetterCell
              index={position}
              key={position}
              letter={letter}
              mark='placed'
            />
          ))}
      </span>
    </h2>
  )
}
