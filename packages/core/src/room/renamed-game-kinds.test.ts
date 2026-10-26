import { describe, expect, it } from 'vitest'

import { renamedGameKindOf, withCurrentGameKinds } from './renamed-game-kinds'

describe('a game shipped under an older id', () => {
  it('[rename] reads the old id as the game it names today', () => {
    expect(renamedGameKindOf('guessnine')).toBe('blacksquare')
    expect(renamedGameKindOf('worldmap')).toBe('atlas')
  })

  it('[rename] answers null for a current id and for an inherited key', () => {
    expect(renamedGameKindOf('atlas')).toBeNull()
    expect(renamedGameKindOf('toString')).toBeNull()
  })

  it('[rename] renames a stored setup keyed by game, its kinds and a list of games', () => {
    const stored = {
      games: {
        quiz: { game: { kind: 'quiz' } },
        worldmap: { game: { kind: 'worldmap' } }
      },
      lineUp: [{ kind: 'guessnine', themeCount: 3 }],
      lineUpGames: ['guessnine', 'quiz']
    }

    expect(withCurrentGameKinds(stored)).toEqual({
      games: {
        atlas: { game: { kind: 'atlas' } },
        quiz: { game: { kind: 'quiz' } }
      },
      lineUp: [{ kind: 'blacksquare', themeCount: 3 }],
      lineUpGames: ['blacksquare', 'quiz']
    })
  })

  it('[rename] leaves a name the host typed as it was', () => {
    expect(withCurrentGameKinds({ name: 'worldmap' })).toEqual({
      name: 'worldmap'
    })
  })
})
