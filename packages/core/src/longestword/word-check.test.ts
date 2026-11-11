import { describe, expect, it } from 'vitest'

import { checkWord } from './word-check'

const LETTERS = ['M', 'A', 'I', 'S', 'O', 'N', 'E', 'T', 'R']

const DICTIONARY = new Set([
  'MAISON',
  'MAISONS',
  'MATES',
  'TETE',
  'SONNE',
  'A',
  'MA'
])

const check = (typed: string) =>
  checkWord({ isWord: (word) => DICTIONARY.has(word), letters: LETTERS, typed })

describe('checkWord', () => {
  it('[longestword] accepts a form spelled from the draw, folded', () => {
    expect(check(' mâtes ')).toEqual({ status: 'accepted', word: 'MATES' })
  })

  it('[longestword] refuses a word using a drawn letter twice, or a letter the draw lacks', () => {
    expect(check('tete')).toEqual({
      reason: 'letter_not_in_draw',
      status: 'refused'
    })
    expect(check('maisons')).toEqual({
      reason: 'letter_not_in_draw',
      status: 'refused'
    })
    expect(check('sonne')).toEqual({
      reason: 'letter_not_in_draw',
      status: 'refused'
    })
  })

  it('[longestword] refuses what is not one word, and a single letter or a form the dictionary lacks', () => {
    expect(check('mai-son')).toEqual({
      reason: 'not_one_word',
      status: 'refused'
    })
    expect(check('a')).toEqual({
      reason: 'not_in_dictionary',
      status: 'refused'
    })
    expect(check('ration')).toEqual({
      reason: 'not_in_dictionary',
      status: 'refused'
    })
    expect(check('ma')).toEqual({ status: 'accepted', word: 'MA' })
  })
})
