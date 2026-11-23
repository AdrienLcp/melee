import { describe, expect, it } from 'vitest'

import { initialsOf, nameWithin, wordsOf } from './name-within'

describe('nameWithin', () => {
  it('[name-within] cuts a name at whole words, and to two initials', () => {
    expect(wordsOf('Jean-Baptiste  de la Tour')).toEqual([
      'Jean-Baptiste',
      'de',
      'la',
      'Tour'
    ])
    expect(initialsOf('Jean-Baptiste de la Tour')).toBe('JB')
    expect(initialsOf('anna')).toBe('A')
    expect(nameWithin({ name: 'Marie-Charlotte Dupont', roomEm: 12 })).toBe(
      'Marie-Charlotte'
    )
    expect(nameWithin({ name: 'Marie-Charlotte Dupont', roomEm: 4 })).toBe('MC')
  })
})
