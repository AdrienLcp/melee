import { describe, expect, it } from 'vitest'

import { challengePlaces } from '@melee/protocol/challenge'

import { pointsForPlace } from './place-pay'

describe('pointsForPlace', () => {
  it('[challenge] pays three, two and one points down the podium', () => {
    expect(challengePlaces.map(pointsForPlace)).toEqual([3_000, 2_000, 1_000])
  })
})
