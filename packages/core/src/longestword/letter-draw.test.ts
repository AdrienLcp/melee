import { describe, expect, it } from 'vitest'

import { LONGEST_WORD_LETTER_COUNT } from '@melee/protocol/longest-word'

import {
  drawLetters,
  FEWEST_VOWELS,
  MOST_OF_ONE_LETTER,
  MOST_VOWELS,
  vowelCountOf
} from './letter-draw'

const DRAWS = 2_000

describe('drawLetters', () => {
  it.each(['fr', 'en'] as const)(
    '[longestword] draws nine letters in %s, three or four of them vowels, none more than twice',
    (language) => {
      const vowelCounts = new Set<number>()

      for (let draw = 0; draw < DRAWS; draw++) {
        const letters = drawLetters(language)
        const most = Math.max(
          ...letters.map(
            (letter) => letters.filter((held) => held === letter).length
          )
        )

        expect(letters).toHaveLength(LONGEST_WORD_LETTER_COUNT)
        expect(letters.every((letter) => /^[A-Z]$/.test(letter))).toBe(true)
        expect(most).toBeLessThanOrEqual(MOST_OF_ONE_LETTER)
        vowelCounts.add(vowelCountOf(letters))
      }

      expect([...vowelCounts].toSorted()).toEqual([FEWEST_VOWELS, MOST_VOWELS])
    }
  )

  it('[longestword] draws a frequent letter more often than a rare one', () => {
    const tally = (letter: string) =>
      Array.from({ length: DRAWS }, () => drawLetters('fr')).filter((letters) =>
        letters.includes(letter)
      ).length

    expect(tally('E')).toBeGreaterThan(tally('W') * 5)
  })

  it('[longestword] counts Y as a vowel', () => {
    expect(vowelCountOf(['Y', 'A', 'B', 'C', 'D', 'F', 'G', 'H', 'J'])).toBe(2)
  })
})
