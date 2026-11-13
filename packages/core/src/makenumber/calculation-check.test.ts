import { describe, expect, it } from 'vitest'

import { calculationValue, combined } from './calculation-check'

const TILES = [75, 25, 7, 3, 10, 10]

describe('combined', () => {
  it('[makenumber] adds, multiplies, subtracts down to one and divides exactly', () => {
    expect(combined({ left: 75, operator: 'add', right: 25 })).toBe(100)
    expect(combined({ left: 7, operator: 'multiply', right: 3 })).toBe(21)
    expect(combined({ left: 10, operator: 'subtract', right: 7 })).toBe(3)
    expect(combined({ left: 75, operator: 'divide', right: 25 })).toBe(3)
  })

  it('[makenumber] refuses a subtraction reaching zero or below and a division with a remainder', () => {
    expect(combined({ left: 10, operator: 'subtract', right: 10 })).toBeNull()
    expect(combined({ left: 3, operator: 'subtract', right: 7 })).toBeNull()
    expect(combined({ left: 75, operator: 'divide', right: 7 })).toBeNull()
  })
})

describe('calculationValue', () => {
  it('[makenumber] reads a calculation’s last result, prior results usable as tiles', () => {
    expect(
      calculationValue({
        steps: [
          { left: 0, operator: 'add', right: 1 },
          { left: 6, operator: 'multiply', right: 2 },
          { left: 7, operator: 'add', right: 3 }
        ],
        tiles: TILES
      })
    ).toBe(703)
  })

  it('[makenumber] lets the two equal tiles each be used once', () => {
    expect(
      calculationValue({
        steps: [{ left: 4, operator: 'multiply', right: 5 }],
        tiles: TILES
      })
    ).toBe(100)
  })

  it('[makenumber] refuses a value used twice, in one step or across two', () => {
    expect(
      calculationValue({
        steps: [{ left: 2, operator: 'add', right: 2 }],
        tiles: TILES
      })
    ).toBeNull()
    expect(
      calculationValue({
        steps: [
          { left: 0, operator: 'add', right: 1 },
          { left: 0, operator: 'add', right: 2 }
        ],
        tiles: TILES
      })
    ).toBeNull()
    expect(
      calculationValue({
        steps: [
          { left: 0, operator: 'add', right: 1 },
          { left: 6, operator: 'add', right: 2 },
          { left: 6, operator: 'add', right: 3 }
        ],
        tiles: TILES
      })
    ).toBeNull()
  })

  it('[makenumber] refuses a result not reached yet and a step the rule refuses', () => {
    expect(
      calculationValue({
        steps: [{ left: 6, operator: 'add', right: 1 }],
        tiles: TILES
      })
    ).toBeNull()
    expect(
      calculationValue({
        steps: [
          { left: 0, operator: 'add', right: 1 },
          { left: 6, operator: 'divide', right: 2 }
        ],
        tiles: TILES
      })
    ).toBeNull()
    expect(
      calculationValue({
        steps: [{ left: 4, operator: 'subtract', right: 5 }],
        tiles: TILES
      })
    ).toBeNull()
  })
})
