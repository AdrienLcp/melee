import { describe, expect, it } from 'vitest'

import { checkTry, type TryRules } from './try-check'

const DICTIONARY = new Set(['MAISON', 'MOUTON', 'MARRON', 'ETE'])

const SIX_LETTERS_FROM_M: TryRules = {
  firstLetter: 'M',
  isWord: (word) => DICTIONARY.has(word),
  length: 6
}

const checked = (typed: string) =>
  checkTry({ rules: SIX_LETTERS_FROM_M, typed })

describe('checkTry', () => {
  it('[mysteryword] accepts a word of the length from the first letter, folded', () => {
    expect(checked('mouton')).toEqual({ status: 'accepted', word: 'MOUTON' })
    expect(checked(' Marron ')).toEqual({ status: 'accepted', word: 'MARRON' })
  })

  it('[mysteryword] says which rule a refused try broke', () => {
    expect(checked('mai-son')).toEqual({
      reason: 'not_one_word',
      status: 'refused'
    })
    expect(checked('mais')).toEqual({
      reason: 'wrong_length',
      status: 'refused'
    })
    expect(checked('poison')).toEqual({
      reason: 'wrong_first_letter',
      status: 'refused'
    })
    expect(checked('mxyzzz')).toEqual({
      reason: 'not_in_dictionary',
      status: 'refused'
    })
  })

  it('[mysteryword] asks the dictionary for the folded form', () => {
    const asked: string[] = []

    checkTry({
      rules: {
        ...SIX_LETTERS_FROM_M,
        isWord: (word) => {
          asked.push(word)

          return true
        }
      },
      typed: 'Maisôn'
    })

    expect(asked).toEqual(['MAISON'])
  })
})
