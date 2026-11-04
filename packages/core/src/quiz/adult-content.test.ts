import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAME_SETTINGS,
  DEFAULT_QUIZ_SETTINGS
} from '@melee/protocol/game'

import { dealsAdultContent } from './adult-content'

describe('dealsAdultContent', () => {
  it('[adult-content] finds the rating in a French quiz ticked beside other games', () => {
    expect(
      dealsAdultContent({
        game: DEFAULT_GAME_SETTINGS.buzzer,
        lineUp: [DEFAULT_GAME_SETTINGS.buzzer, DEFAULT_QUIZ_SETTINGS]
      })
    ).toBe(true)
  })

  it('[adult-content] finds none in a quiz drawing from an unrated language', () => {
    const englishQuiz = { ...DEFAULT_QUIZ_SETTINGS, language: 'en' } as const

    expect(
      dealsAdultContent({ game: englishQuiz, lineUp: [englishQuiz] })
    ).toBe(false)
  })

  it('[adult-content] finds none before a game is picked', () => {
    expect(dealsAdultContent({ game: null, lineUp: [] })).toBe(false)
  })
})
