import { describe, expect, it } from 'vitest'

import { challengePlaces } from '@melee/protocol/challenge'

import { pointsForPlace } from './place-pay'

describe('pointsForPlace', () => {
  it('[challenge] pays the whole round, two thirds and one third down the podium', () => {
    expect(challengePlaces.map(pointsForPlace)).toEqual([
      100_000, 66_667, 33_333
    ])
  })
})
