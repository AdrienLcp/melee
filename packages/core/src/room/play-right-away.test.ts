import { describe, expect, it } from 'vitest'

import { DEFAULT_MODE_SETTINGS } from '@melee/protocol/room'

import { rememberSettings } from './host-preferences'
import {
  canPlayRightAway,
  launchesWithHostSeated,
  settingsToPlayRightAway
} from './play-right-away'
import { roomSettingsFor } from './room-settings'

const onTheQuiz = roomSettingsFor({ game: 'quiz', locale: 'fr' })

describe('canPlayRightAway', () => {
  it('[play-right-away] offers it where a way of answering owes no verdict', () => {
    expect(canPlayRightAway('blindtest')).toBe(true)
    expect(canPlayRightAway('quiz')).toBe(true)
    expect(canPlayRightAway('reflex')).toBe(true)
  })

  it('[play-right-away] withholds it from the games their host judges', () => {
    expect(canPlayRightAway('buzzer')).toBe(false)
    expect(canPlayRightAway('slate')).toBe(false)
  })
})

describe('settingsToPlayRightAway', () => {
  it('[play-right-away] opens on the setup the host left the game in', () => {
    const preferences = rememberSettings({
      preferences: null,
      settings: {
        ...onTheQuiz,
        mode: DEFAULT_MODE_SETTINGS.typed,
        roundCount: 20
      }
    })

    const settings = settingsToPlayRightAway({
      preferences,
      settings: onTheQuiz
    })

    expect(settings.mode).toEqual(DEFAULT_MODE_SETTINGS.typed)
    expect(settings.roundCount).toBe(20)
  })

  it('[play-right-away] trades a remembered buzzer for four choices, keeping the rest', () => {
    const preferences = rememberSettings({
      preferences: null,
      settings: {
        ...onTheQuiz,
        mode: DEFAULT_MODE_SETTINGS.buzzer,
        roundCount: 15
      }
    })

    const settings = settingsToPlayRightAway({
      preferences,
      settings: onTheQuiz
    })

    expect(settings.mode).toEqual({ kind: 'choice' })
    expect(settings.roundCount).toBe(15)
  })

  it('[play-right-away] keeps the reflex race on the buzzer it is raced on', () => {
    const onTheRace = roomSettingsFor({ game: 'reflex', locale: 'en' })

    expect(
      settingsToPlayRightAway({ preferences: null, settings: onTheRace }).mode
    ).toEqual(DEFAULT_MODE_SETTINGS.buzzer)
  })

  it('[play-right-away] opens on the game’s defaults for a host who never set one', () => {
    expect(
      settingsToPlayRightAway({ preferences: null, settings: onTheQuiz })
    ).toEqual(onTheQuiz)
  })
})

describe('launchesWithHostSeated', () => {
  it('[play-right-away] seats the host at an empty table that lets them play', () => {
    expect(
      launchesWithHostSeated({ game: 'quiz', mode: 'choice', seated: 0 })
    ).toBe(true)
  })

  it('[play-right-away] hands the launch back to the group once anybody sits', () => {
    expect(
      launchesWithHostSeated({ game: 'quiz', mode: 'choice', seated: 1 })
    ).toBe(false)
  })

  it('[play-right-away] waits for a game, and for a way of answering with no judge', () => {
    expect(
      launchesWithHostSeated({ game: null, mode: 'choice', seated: 0 })
    ).toBe(false)
    expect(
      launchesWithHostSeated({ game: 'quiz', mode: 'buzzer', seated: 0 })
    ).toBe(false)
  })
})
