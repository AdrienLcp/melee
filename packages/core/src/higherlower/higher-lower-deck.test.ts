import { describe, expect, it } from 'vitest'

import { higherLowerDeckProblems } from './higher-lower-deck'

const pair = (left: number, right: number) => ({
  left: { name: 'Léa', value: left },
  prompt: 'Who has the longer commute?',
  right: { name: 'Hugo', value: right },
  unit: 'km'
})

describe('higherLowerDeckProblems', () => {
  it('[higherlower] finds nothing in a pair a table can tell apart', () => {
    expect(
      higherLowerDeckProblems({ items: [pair(12, 40)], path: 'decks[0]' })
    ).toEqual([])
  })

  it('[higherlower] refuses a tie and a near tie', () => {
    expect(
      higherLowerDeckProblems({
        items: [pair(12, 12), pair(100, 110)],
        path: 'decks[1]'
      })
    ).toEqual([
      expect.stringMatching(/^decks\[1\]\.items\[0\]: .*a tie/),
      expect.stringMatching(/^decks\[1\]\.items\[1\]: .*a near tie/)
    ])
  })

  it('[higherlower] refuses two sides of one name', () => {
    expect(
      higherLowerDeckProblems({
        items: [{ ...pair(12, 40), right: { name: 'léa', value: 40 } }],
        path: 'decks[0]'
      })
    ).toEqual([expect.stringContaining('both sides')])
  })
})
