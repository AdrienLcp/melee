import { describe, expect, it } from 'vitest'

import { firstDrawnOrder } from './first-drawn-order'

describe('firstDrawnOrder', () => {
  it('[order] keeps the first drawn order when the same keys come back reordered', () => {
    const drawn = ['mustard', 'yoghurt', 'milk']

    expect(
      firstDrawnOrder({ drawn, next: ['milk', 'mustard', 'yoghurt'] })
    ).toBe(drawn)
  })

  it('[order] lays a key drawn for the first time after every other', () => {
    expect(
      firstDrawnOrder({
        drawn: ['mustard', 'milk'],
        next: ['yogurt', 'milk', 'mustard']
      })
    ).toEqual(['mustard', 'milk', 'yogurt'])
  })

  it('[order] keeps a key that left where it stood, should it come back', () => {
    expect(
      firstDrawnOrder({
        drawn: ['mustard', 'yogurt', 'milk'],
        next: ['milk']
      })
    ).toEqual(['mustard', 'yogurt', 'milk'])
  })
})
