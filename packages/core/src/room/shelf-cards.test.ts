import { describe, expect, it } from 'vitest'

import { shelvedGames } from '@melee/protocol/game'

import { cardOf, cardOfFormat, isOwnCard, shelfCards } from './shelf-cards'

describe('a game played as a format of another', () => {
  it('[shelf] picks higher or lower under the estimate’s card', () => {
    expect(cardOf('higherlower')).toBe('estimate')
    expect(cardOfFormat('higherlower')).toBe('estimate')
    expect(isOwnCard('higherlower')).toBe(false)
  })

  it('[shelf] leaves every other game on a card of its own', () => {
    expect(cardOf('estimate')).toBe('estimate')
    expect(cardOfFormat('quiz')).toBeNull()
    expect(cardOfFormat('toString')).toBeNull()
  })

  it('[shelf] draws one card fewer than the games it serves, in shelf order', () => {
    expect(shelfCards).not.toContain('higherlower')
    expect(shelfCards).toEqual(
      shelvedGames.filter((game) => game !== 'higherlower')
    )
  })
})
