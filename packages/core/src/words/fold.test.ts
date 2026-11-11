import { describe, expect, it } from 'vitest'

import { foldWord } from './fold'

describe('foldWord', () => {
  it('[words] writes a word in capitals without its accents', () => {
    expect(foldWord('été')).toBe('ETE')
    expect(foldWord('Maïs')).toBe('MAIS')
    expect(foldWord('garçon')).toBe('GARCON')
    expect(foldWord('house')).toBe('HOUSE')
  })

  it('[words] spells a ligature as its two letters', () => {
    expect(foldWord('cœur')).toBe('COEUR')
    expect(foldWord('Œuvre')).toBe('OEUVRE')
    expect(foldWord('ex æquo')).toBeNull()
    expect(foldWord('cæcum')).toBe('CAECUM')
  })

  it('[words] refuses a compound, an elision, a number or an empty line', () => {
    expect(foldWord('arc-en-ciel')).toBeNull()
    expect(foldWord("aujourd'hui")).toBeNull()
    expect(foldWord('pomme de terre')).toBeNull()
    expect(foldWord('mp3')).toBeNull()
    expect(foldWord('')).toBeNull()
  })
})
