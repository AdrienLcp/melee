import { describe, expect, it } from 'vitest'

import { DEFAULT_MODE_SETTINGS } from '@melee/protocol/room'

import { launchesWithHostSeated } from './play-right-away'
import { roomSettingsFor } from './room-settings'

const onTheQuiz = roomSettingsFor({ games: ['quiz'], locale: 'fr' })

describe('launchesWithHostSeated', () => {
  it('[play-right-away] seats the host at an empty table that lets them play', () => {
    expect(launchesWithHostSeated({ seated: 0, settings: onTheQuiz })).toBe(
      true
    )
  })

  it('[play-right-away] hands the launch back to the group once anybody sits', () => {
    expect(launchesWithHostSeated({ seated: 1, settings: onTheQuiz })).toBe(
      false
    )
  })

  it('[play-right-away] waits for a game, and for a way of answering with no judge', () => {
    expect(
      launchesWithHostSeated({
        seated: 0,
        settings: { ...onTheQuiz, game: null }
      })
    ).toBe(false)
    expect(
      launchesWithHostSeated({
        seated: 0,
        settings: { ...onTheQuiz, mode: DEFAULT_MODE_SETTINGS.buzzer }
      })
    ).toBe(false)
  })
})
