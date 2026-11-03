import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'
import { catalogueOf, EVERY_STRAND } from '@melee/protocol/track'

import { withCatalogueSources } from './stored-settings'

/** A blind test as protocol 66 stored it, which no type of this build can hold. */
const storedOn = (source: unknown): GameSettings =>
  JSON.parse(JSON.stringify({ ...DEFAULT_BLINDTEST_SETTINGS, source }))

describe('blind tests stored before the catalogue', () => {
  it('[stored] reads every blind test the room holds as the strands it drew', () => {
    const restored = withCatalogueSources({
      openedEntries: [storedOn({ kind: 'film' })],
      settings: {
        ...DEFAULT_ROOM_SETTINGS,
        game: storedOn({ kind: 'all' }),
        lineUp: [
          storedOn({ decades: ['1980s'], kind: 'decade' }),
          DEFAULT_QUIZ_SETTINGS
        ]
      }
    })

    expect(restored.settings.game).toEqual({
      ...DEFAULT_BLINDTEST_SETTINGS,
      source: EVERY_STRAND
    })
    expect(restored.settings.lineUp).toEqual([
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ decades: ['1980s'] })
      },
      DEFAULT_QUIZ_SETTINGS
    ])
    expect(restored.openedEntries).toEqual([
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ hasFilmScores: true })
      }
    ])
  })
})
