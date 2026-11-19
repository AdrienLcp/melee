import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ESTIMATE_SETTINGS,
  DEFAULT_HIGHER_LOWER_SETTINGS
} from '@melee/protocol/game'

import { inEstimateFormat, isEstimateFormat } from './estimate-format'

describe('the estimate played the other way', () => {
  it('[format] carries the level and the country, and takes the format’s own clock', () => {
    expect(
      inEstimateFormat({
        format: 'higherlower',
        game: {
          ...DEFAULT_ESTIMATE_SETTINGS,
          difficulty: 'hard',
          homeCountry: 'PT',
          roundDurationMs: 60_000,
          topics: ['price']
        }
      })
    ).toEqual({
      ...DEFAULT_HIGHER_LOWER_SETTINGS,
      difficulty: 'hard',
      homeCountry: 'PT'
    })
  })

  it('[format] comes back to every topic on the estimate’s clock', () => {
    expect(
      inEstimateFormat({
        format: 'estimate',
        game: { ...DEFAULT_HIGHER_LOWER_SETTINGS, difficulty: 'easy' }
      })
    ).toEqual({ ...DEFAULT_ESTIMATE_SETTINGS, difficulty: 'easy' })
  })

  it('[format] keeps a game already in the format it is asked for', () => {
    const game = { ...DEFAULT_ESTIMATE_SETTINGS, roundDurationMs: 15_000 }

    expect(inEstimateFormat({ format: 'estimate', game })).toBe(game)
  })

  it('[format] names the two formats and nothing else', () => {
    expect(isEstimateFormat('higherlower')).toBe(true)
    expect(isEstimateFormat('quiz')).toBe(false)
  })
})
