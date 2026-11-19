import { describe, expect, it } from 'vitest'

import { shelvedGames } from '@melee/protocol/game'

import { cardOf, cardOfFormat, isOwnCard, shelfCards } from './shelf-cards'

describe('a game played as a format of another', () => {
  it('[shelf] picks higher or lower under the estimate’s card', () => {
    expect(cardOf('higherlower')).toBe('estimate')
    expect(cardOfFormat('higherlower')).toBe('estimate')
    expect(isOwnCard('higherlower')).toBe(false)
  })

  it('[shelf] picks the lights under the reflex race’s card', () => {
    expect(cardOf('lights')).toBe('reflex')
    expect(cardOfFormat('lights')).toBe('reflex')
    expect(isOwnCard('lights')).toBe(false)
  })

  it('[shelf] leaves every other game on a card of its own', () => {
    expect(cardOf('estimate')).toBe('estimate')
    expect(cardOfFormat('quiz')).toBeNull()
    expect(cardOfFormat('toString')).toBeNull()
  })

  it('[shelf] draws a card fewer for each format, in shelf order', () => {
    expect(shelfCards).not.toContain('higherlower')
    expect(shelfCards).not.toContain('lights')
    expect(shelfCards).toEqual(
      shelvedGames.filter((game) => game !== 'higherlower' && game !== 'lights')
    )
  })
})
