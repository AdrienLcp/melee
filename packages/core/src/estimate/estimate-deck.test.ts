import { describe, expect, it } from 'vitest'

import { estimateDeckProblems, isUnitNearAKnownValue } from './estimate-deck'

const item = (
  value: number,
  unit: string | null = 'km',
  prompt = 'How many kilometres did we drive this summer?'
) => ({ prompt, unit, value })

describe('estimateDeckProblems', () => {
  it('[estimate] finds nothing in counts, lengths and sums', () => {
    expect(
      estimateDeckProblems({
        items: [
          item(4200),
          item(12, null, 'How many cousins do we have?'),
          item(340, 'litres par an', 'How much water does the pool lose?')
        ],
        path: 'decks[0]'
      })
    ).toEqual([])
  })

  it('[estimate] refuses a unit naming a year, an age, a percentage or a rank', () => {
    expect(
      ['année', 'ans', 'years old', '%', 'pour cent', 'Percent', 'rang'].map(
        isUnitNearAKnownValue
      )
    ).toEqual([true, true, true, true, true, true, true])
    expect(
      estimateDeckProblems({
        items: [item(1995, 'année')],
        path: 'decks[2]'
      })
    ).toEqual([expect.stringMatching(/^decks\[2\]\.items\[0\]\.unit: /)])
  })

  it('[estimate] refuses a bare whole number that reads as a year', () => {
    expect(
      estimateDeckProblems({
        items: [item(1995, null)],
        path: 'decks[0]'
      })
    ).toEqual([expect.stringContaining('reads as a year')])
  })

  it('[estimate] refuses a question asked twice', () => {
    expect(
      estimateDeckProblems({
        items: [item(4200), item(4300)],
        path: 'decks[0]'
      })
    ).toEqual([expect.stringMatching(/^decks\[0\]\.items\[1\]\.prompt: /)])
  })
})
