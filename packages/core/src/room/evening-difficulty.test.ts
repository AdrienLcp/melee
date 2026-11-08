import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS, type GameKind } from '@melee/protocol/game'

import {
  eveningDifficultyOf,
  hasEveningDifficulty,
  withEveningDifficulty
} from './evening-difficulty'
import { withEntryAdded } from './line-up'
import { roomSettingsFor } from './room-settings'

const entries = (...games: GameKind[]) =>
  games.map((game) => DEFAULT_GAME_SETTINGS[game])

describe('the evening level', () => {
  it('[difficulty] shows none below two games that deal at a level', () => {
    expect(hasEveningDifficulty(entries('quiz'))).toBe(false)
    expect(hasEveningDifficulty(entries('quiz', 'buzzer', 'reflex'))).toBe(
      false
    )
    expect(eveningDifficultyOf(entries('quiz', 'buzzer'))).toBeNull()
    expect(hasEveningDifficulty(entries('quiz', 'atlas'))).toBe(true)
  })

  it('[difficulty] reads the level every levelled game agrees on, past the ones with none', () => {
    expect(eveningDifficultyOf(entries('quiz', 'buzzer', 'timeline'))).toBe(
      'mixed'
    )
  })

  it('[difficulty] reads custom once two games deal at different levels', () => {
    expect(eveningDifficultyOf(entries('blindtest', 'quiz'))).toBe('custom')
  })

  it('[difficulty] writes one level into every levelled entry and the next round’s game', () => {
    const settings = roomSettingsFor({
      games: ['blindtest', 'quiz', 'buzzer', 'estimate'],
      locale: 'fr'
    })
    const easy = withEveningDifficulty({ difficulty: 'hard', settings })

    expect(eveningDifficultyOf(easy.lineUp)).toBe('hard')
    expect(easy.game).toMatchObject({ difficulty: 'hard' })
    expect(easy.lineUp.find((entry) => entry.kind === 'buzzer')).toEqual(
      DEFAULT_GAME_SETTINGS.buzzer
    )
  })

  it('[difficulty] joins a game added afterwards at the level the evening shows', () => {
    const settings = withEveningDifficulty({
      difficulty: 'easy',
      settings: roomSettingsFor({ games: ['quiz', 'atlas'], locale: 'fr' })
    })
    const added = withEntryAdded({
      game: 'timeline',
      locale: 'fr',
      remembered: null,
      settings
    })

    expect(added.lineUp.at(-1)).toMatchObject({
      difficulty: 'easy',
      kind: 'timeline'
    })
  })

  it('[difficulty] joins a game on its own level while the evening shows custom', () => {
    const settings = roomSettingsFor({
      games: ['blindtest', 'quiz'],
      locale: 'fr'
    })
    const added = withEntryAdded({
      game: 'timeline',
      locale: 'fr',
      remembered: null,
      settings
    })

    expect(added.lineUp.at(-1)).toMatchObject({ difficulty: 'mixed' })
  })
})
