import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAME_SETTINGS,
  type GameKind,
  type GameSettings
} from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { type GameSetup, roomSettingsFor } from './room-settings'
import { offersSkip, withEntrySkipped } from './skipped-entry'

const neverPlayed = (_game: GameKind): GameSetup | null => null

const entries = (...games: GameKind[]) =>
  games.map((game) => DEFAULT_GAME_SETTINGS[game])

const NO_KEYS: readonly (string | null)[] = []

const askedOn = ({
  at,
  challengeText = '',
  lineUp,
  played = lineUp.map(() => 0),
  slateKeys = NO_KEYS
}: {
  at: number
  challengeText?: string
  lineUp: readonly GameSettings[]
  played?: readonly number[]
  slateKeys?: readonly (string | null)[]
}) => offersSkip({ challengeText, lineUp, lineUpAt: at, played, slateKeys })

const onEntry = ({
  at,
  games
}: {
  at: number
  games: GameKind[]
}): RoomSettings => {
  const settings = roomSettingsFor({ games, locale: 'fr' })
  const entry = settings.lineUp[at]

  return entry === undefined
    ? settings
    : { ...settings, game: entry, lineUpAt: at }
}

describe('offersSkip', () => {
  it('[skip] offers to skip a challenge drawn with no line typed', () => {
    expect(askedOn({ at: 1, lineUp: entries('quiz', 'challenge') })).toBe(true)
  })

  it('[skip] keeps a challenge whose line is typed', () => {
    expect(
      askedOn({
        at: 1,
        challengeText: 'Act out a film',
        lineUp: entries('quiz', 'challenge')
      })
    ).toBe(false)
  })

  it('[skip] keeps a slate with a key noted or an item labelled', () => {
    const labelled = {
      ...DEFAULT_GAME_SETTINGS.slate,
      labels: ['Capital of Peru']
    }

    expect(
      askedOn({ at: 1, lineUp: entries('quiz', 'slate'), slateKeys: ['Lima'] })
    ).toBe(false)
    expect(
      askedOn({ at: 1, lineUp: [DEFAULT_GAME_SETTINGS.quiz, labelled] })
    ).toBe(false)
    expect(askedOn({ at: 1, lineUp: entries('quiz', 'slate') })).toBe(true)
  })

  it('[skip] offers every buzzer, whose questions are never on a screen', () => {
    expect(askedOn({ at: 1, lineUp: entries('quiz', 'buzzer') })).toBe(true)
  })

  it('[skip] never offers a game that serves its own content', () => {
    expect(askedOn({ at: 0, lineUp: entries('quiz', 'challenge') })).toBe(false)
  })

  it('[skip] never offers what would end the evening', () => {
    expect(
      askedOn({
        at: 1,
        lineUp: entries('slate', 'challenge'),
        played: [1, 0]
      })
    ).toBe(false)
    expect(askedOn({ at: 0, lineUp: entries('challenge') })).toBe(false)
  })

  it('[skip] offers it while another of the host’s entries is still owed', () => {
    expect(askedOn({ at: 1, lineUp: entries('slate', 'challenge') })).toBe(true)
  })
})

describe('withEntrySkipped', () => {
  it('[skip] takes the entry out and draws the next round among the rest', () => {
    const skipped = withEntrySkipped({
      lastAt: 0,
      locale: 'fr',
      played: [1, 0, 0],
      random: () => 0,
      rememberedFor: neverPlayed,
      roundsLeft: 5,
      settings: onEntry({ at: 1, games: ['quiz', 'challenge', 'blindtest'] })
    })

    expect(skipped.lineUp.map((entry) => entry.kind)).toEqual([
      'quiz',
      'blindtest'
    ])
    expect(skipped.lineUpAt).toBe(1)
    expect(skipped.game?.kind).toBe('blindtest')
  })

  it('[skip] keeps the evening’s length, dealing its rounds to a played entry', () => {
    const settings = onEntry({ at: 1, games: ['quiz', 'challenge'] })
    const skipped = withEntrySkipped({
      lastAt: 0,
      locale: 'fr',
      played: [3, 0],
      random: () => 0,
      rememberedFor: neverPlayed,
      roundsLeft: 4,
      settings
    })

    expect(skipped.roundCount).toBe(settings.roundCount)
    expect(skipped.game?.kind).toBe('quiz')
    expect(skipped.lineUpAt).toBe(0)
  })
})
