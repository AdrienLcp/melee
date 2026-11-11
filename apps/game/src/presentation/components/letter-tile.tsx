import type React from 'react'

import { VOWELS } from '@melee/core/longestword/letter-draw'

import './letter-tile.sass'

const VOWEL_SET: ReadonlySet<string> = new Set(VOWELS)

/** Whether a drawn letter is printed on a vowel's tile. */
export const isVowelTile = (letter: string): boolean => VOWEL_SET.has(letter)

type LetterTileProps = {
  /** Where the tile stands in its row, which deals a turned-over row left to right. */
  index?: number
  /** `faceDown` hides the letter behind the game's spine, `faceUp` turns it over when it is first drawn. */
  face?: 'faceDown' | 'faceUp' | 'still'
  letter: string
}

/**
 * One drawn letter on a tile of the longest word, the vowels on a warmer
 * face: the draw, a word laid out of it, a word spelled at the reveal.
 */
export const LetterTile: React.FC<LetterTileProps> = ({
  face = 'still',
  index = 0,
  letter
}) => (
  <span
    className='letter-tile'
    data-face={face === 'still' ? undefined : face}
    data-vowel={isVowelTile(letter) || undefined}
    style={{ '--letter-index': index }}
  >
    {letter}
  </span>
)
