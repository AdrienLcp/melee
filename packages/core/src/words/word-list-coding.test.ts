import { describe, expect, it } from 'vitest'

import {
  CODED_WORD_LIST,
  type CodedWord,
  decodeWordList,
  encodeWordList
} from './word-list-coding'

const WORDS: CodedWord[] = [
  { mark: null, word: 'MAISONS' },
  { mark: 'easy', word: 'MAISON' },
  { mark: null, word: 'MAIS' },
  { mark: 'familiar', word: 'MAISONNEE' },
  { mark: 'hard', word: 'ABACA' },
  { mark: 'medium', word: 'ZEBRE' },
  { mark: null, word: 'ZE' }
]

describe('the coded word list', () => {
  it('[words] spells each shared prefix once, in code-unit order', () => {
    expect(encodeWordList(WORDS)).toBe('0ABACAh0MAIS4ONe6NEEf6S0ZE2BREm')
  })

  it('[words] reads back every word and its mark', () => {
    const coded = encodeWordList(WORDS)

    expect(coded).toMatch(CODED_WORD_LIST)
    expect(decodeWordList(coded)).toEqual(
      WORDS.toSorted((left, right) => (left.word < right.word ? -1 : 1))
    )
  })

  it('[words] reads an empty list as no word', () => {
    expect(decodeWordList(encodeWordList([]))).toEqual([])
  })
})
