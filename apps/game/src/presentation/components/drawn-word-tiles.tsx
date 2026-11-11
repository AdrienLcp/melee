import type React from 'react'

import { LONGEST_WORD_LETTER_COUNT } from '@melee/protocol/longest-word'

import { LetterTile } from './letter-tile'

import './drawn-word-tiles.sass'

const SLOTS = Array.from({ length: LONGEST_WORD_LETTER_COUNT }, (_, at) => at)

type DrawnWordTilesProps = {
  /** `faceUp` turns the tiles over one after the other as they mount; `still` lays them as they are. */
  face?: 'faceUp' | 'still'
  /** A word made from the draw, laid from the first slot; the slots it leaves stay empty sockets. */
  word: string
}

/**
 * A word of the longest word on tiles in the draw's nine slots, so two words
 * laid one over the other read their lengths at a glance. Hidden from
 * assistive technology: the caller says the word.
 */
export const DrawnWordTiles: React.FC<DrawnWordTilesProps> = ({
  face = 'still',
  word
}) => (
  <span aria-hidden className='drawn-word-tiles'>
    {SLOTS.map((slot) => {
      const letter = word[slot]

      return letter === undefined ? (
        <span className='slot' key={slot} />
      ) : (
        <LetterTile face={face} index={slot} key={slot} letter={letter} />
      )
    })}
  </span>
)
