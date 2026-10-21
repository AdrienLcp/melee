import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { isPerfectOrder, pointsForOrder, swappedPairsOf } from './order-pay'

const TRUE_ORDER = ['a', 'b', 'c', 'd', 'e']

const swapped = (sent: string[]) =>
  swappedPairsOf({ sent, trueOrder: TRUE_ORDER })

describe('how far an order is from the true one', () => {
  it('[timeline] counts nothing for the true order', () => {
    expect(swapped(['a', 'b', 'c', 'd', 'e'])).toBe(0)
  })

  it('[timeline] counts one pair for two neighbours swapped', () => {
    expect(swapped(['a', 'c', 'b', 'd', 'e'])).toBe(1)
  })

  it('[timeline] counts every pair for the order reversed', () => {
    expect(swapped(['e', 'd', 'c', 'b', 'a'])).toBe(10)
  })

  it('[timeline] counts the pairs one event jumped over, not the places it left', () => {
    expect(swapped(['b', 'c', 'd', 'e', 'a'])).toBe(4)
  })

  it('[timeline] refuses an order that is not every event once', () => {
    expect(swapped(['a', 'b', 'c', 'd'])).toBeNull()
    expect(swapped(['a', 'a', 'c', 'd', 'e'])).toBeNull()
    expect(swapped(['a', 'b', 'c', 'd', 'z'])).toBeNull()
  })
})

describe('what an order earns', () => {
  it('[timeline] pays the typed answer’s price for the true order', () => {
    expect(pointsForOrder({ swappedPairs: 0 })).toBe(3 * POINT)
    expect(isPerfectOrder({ swappedPairs: 0 })).toBe(true)
  })

  it('[timeline] still pays a near miss, less the further it is', () => {
    expect(pointsForOrder({ swappedPairs: 1 })).toBe(2 * POINT)
    expect(pointsForOrder({ swappedPairs: 2 })).toBe(POINT)
    expect(isPerfectOrder({ swappedPairs: 1 })).toBe(false)
  })

  it('[timeline] pays nothing for what a shuffle gets on its own', () => {
    expect(pointsForOrder({ swappedPairs: 3 })).toBe(0)
    expect(pointsForOrder({ swappedPairs: 5 })).toBe(0)
  })
})
