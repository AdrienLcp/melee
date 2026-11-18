import { describe, expect, it } from 'vitest'

import { compareText } from './collation'

describe('compareText', () => {
  it('[collation] orders Portuguese names as a Portuguese table reads them', () => {
    expect(
      [
        'Zé',
        'Óscar',
        'Conceição',
        'Olga',
        'Ângela',
        'Celeste',
        'Álvaro'
      ].toSorted(compareText)
    ).toEqual([
      'Álvaro',
      'Ângela',
      'Celeste',
      'Conceição',
      'Olga',
      'Óscar',
      'Zé'
    ])
  })
})
