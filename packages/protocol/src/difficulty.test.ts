import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_ESTIMATE_SETTINGS,
  DEFAULT_HIGHER_LOWER_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_TIMELINE_SETTINGS,
  gameSettingsSchema
} from './game'
import { playlistPreviewQuerySchema } from './http'

const storedWithout = <TSettings extends { difficulty: unknown }>({
  difficulty: _level,
  ...rest
}: TSettings) => rest

describe('a setup stored before the level existed', () => {
  it('[difficulty] parses every game that deals content onto mixed', () => {
    for (const settings of [
      DEFAULT_ATLAS_SETTINGS,
      DEFAULT_ESTIMATE_SETTINGS,
      DEFAULT_HIGHER_LOWER_SETTINGS,
      DEFAULT_QUIZ_SETTINGS,
      DEFAULT_TIMELINE_SETTINGS
    ]) {
      expect(gameSettingsSchema.parse(storedWithout(settings))).toEqual({
        ...settings,
        difficulty: 'mixed'
      })
    }
  })

  it('[difficulty] reads a quiz that still carries the retired switch', () => {
    expect(
      gameSettingsSchema.parse({
        ...storedWithout(DEFAULT_QUIZ_SETTINGS),
        wellKnownOnly: false
      })
    ).toEqual({ ...DEFAULT_QUIZ_SETTINGS, difficulty: 'mixed' })
  })

  it('[difficulty] reads the blind test in the words it used to take', () => {
    expect(
      gameSettingsSchema.parse({
        ...DEFAULT_BLINDTEST_SETTINGS,
        difficulty: 'wellKnown'
      })
    ).toEqual({ ...DEFAULT_BLINDTEST_SETTINGS, difficulty: 'easy' })
    expect(
      gameSettingsSchema.parse({
        ...DEFAULT_BLINDTEST_SETTINGS,
        difficulty: 'obscure'
      })
    ).toEqual({ ...DEFAULT_BLINDTEST_SETTINGS, difficulty: 'hard' })
    expect(playlistPreviewQuerySchema.parse({ difficulty: 'obscure' })).toEqual(
      { difficulty: 'hard' }
    )
  })

  it('[difficulty] refuses a level no game takes', () => {
    expect(
      gameSettingsSchema.safeParse({
        ...DEFAULT_QUIZ_SETTINGS,
        difficulty: 'normal'
      }).success
    ).toBe(false)
  })
})
