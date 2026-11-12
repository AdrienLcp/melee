import { describe, expect, it } from 'vitest'

import { slateDeckProblems } from './slate-deck'

describe('slateDeckProblems', () => {
  it('[slate] finds nothing in keys within the sheet, trailing blanks included', () => {
    expect(
      slateDeckProblems({
        itemCount: 3,
        items: ['Merlot', null, 'Syrah', null],
        path: 'decks[0]'
      })
    ).toEqual([])
  })

  it('[slate] refuses a key past the sheet the entry opens', () => {
    expect(
      slateDeckProblems({
        itemCount: 2,
        items: ['Merlot', 'Syrah', 'Gamay'],
        path: 'decks[1]'
      })
    ).toEqual([
      "decks[1].items[2]: the entry's sheet opens with 2 items — raise its itemCount to 3 or drop the keys past it."
    ])
  })

  it('[slate] refuses a deck with no key at all', () => {
    expect(
      slateDeckProblems({ itemCount: 2, items: [null, null], path: 'decks[0]' })
    ).toEqual(['decks[0].items: the deck holds no key.'])
  })
})
