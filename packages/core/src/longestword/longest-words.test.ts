import { describe, expect, it } from 'vitest'

import {
  indexForms,
  isSpelledFrom,
  longestWordsIn,
  SHOWN_BEST_WORD_COUNT,
  shownBestWords
} from './longest-words'

const formsByLength = (forms: readonly string[]) => {
  const byLength = new Map<number, string[]>()

  for (const form of forms.toSorted()) {
    byLength.set(form.length, [...(byLength.get(form.length) ?? []), form])
  }

  return byLength
}

const INDEX = indexForms(
  formsByLength([
    'ART',
    'NOTES',
    'RAT',
    'RATS',
    'STAR',
    'START',
    'STONES',
    'TAR',
    'TSAR'
  ])
)

const DRAW = ['S', 'T', 'A', 'R', 'E', 'I', 'O', 'N', 'L']

describe('longestWordsIn', () => {
  it('[longestword] finds every form of the greatest length the draw spells, each drawn letter used once', () => {
    expect(longestWordsIn({ index: INDEX, letters: DRAW })).toEqual({
      length: 5,
      words: ['NOTES']
    })
    expect(
      longestWordsIn({
        index: INDEX,
        letters: ['S', 'T', 'A', 'R', 'U', 'I', 'P', 'M', 'L']
      })
    ).toEqual({ length: 4, words: ['RATS', 'STAR', 'TSAR'] })
  })

  it('[longestword] passes over a form that needs a letter twice when the draw holds it once', () => {
    const best = longestWordsIn({ index: INDEX, letters: DRAW })

    expect(best?.words).not.toContain('START')
    expect(best?.words).not.toContain('STONES')
  })

  it('[longestword] answers nothing when no form is as long as asked', () => {
    expect(
      longestWordsIn({ index: INDEX, letters: DRAW, shortest: 6 })
    ).toBeNull()
  })
})

describe('isSpelledFrom', () => {
  it('[longestword] spells a word from the draw only while each letter is used as often as drawn', () => {
    expect(isSpelledFrom({ letters: DRAW, word: 'NOTES' })).toBe(true)
    expect(isSpelledFrom({ letters: DRAW, word: 'START' })).toBe(false)
    expect(isSpelledFrom({ letters: DRAW, word: 'BEST' })).toBe(false)
    expect(
      isSpelledFrom({ letters: [...DRAW.slice(0, 8), 'T'], word: 'START' })
    ).toBe(true)
  })
})

describe('shownBestWords', () => {
  it('[longestword] names familiar words first, three at most', () => {
    const familiar = new Set(['TSAR', 'ARTS'])

    expect(
      shownBestWords({
        isFamiliar: (word) => familiar.has(word),
        words: ['RATS', 'STAR', 'TSAR', 'ARTS', 'TARS']
      })
    ).toEqual(['TSAR', 'ARTS', 'RATS'])
    expect(SHOWN_BEST_WORD_COUNT).toBe(3)
  })
})
