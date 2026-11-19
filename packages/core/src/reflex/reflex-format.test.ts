import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LIGHTS_SETTINGS,
  DEFAULT_REFLEX_SETTINGS
} from '@melee/protocol/game'

import { inReflexFormat, isReflexFormat } from './reflex-format'

describe('the reflex race played the other way', () => {
  it('[format] opens the chase on its own defaults', () => {
    expect(
      inReflexFormat({ format: 'lights', game: DEFAULT_REFLEX_SETTINGS })
    ).toEqual(DEFAULT_LIGHTS_SETTINGS)
  })

  it('[format] comes back to the flip with nothing of the chase', () => {
    expect(
      inReflexFormat({
        format: 'reflex',
        game: { ...DEFAULT_LIGHTS_SETTINGS, hasTraps: false, windowMs: 30_000 }
      })
    ).toEqual(DEFAULT_REFLEX_SETTINGS)
  })

  it('[format] keeps a chase already in the format it is asked for', () => {
    const game = { ...DEFAULT_LIGHTS_SETTINGS, windowMs: 15_000 }

    expect(inReflexFormat({ format: 'lights', game })).toBe(game)
  })

  it('[format] knows its two formats and nothing else', () => {
    expect(isReflexFormat('lights')).toBe(true)
    expect(isReflexFormat('reflex')).toBe(true)
    expect(isReflexFormat('estimate')).toBe(false)
  })
})
