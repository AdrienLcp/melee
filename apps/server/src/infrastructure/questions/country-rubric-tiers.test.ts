import { describe, expect, it } from 'vitest'

import { DEFAULT_QUIZ_SETTINGS } from '@melee/protocol/game'
import {
  type QuestionCategory,
  questionLanguages
} from '@melee/protocol/question'

import { bankedCapitals } from './capital-bank'
import { drawCity } from './city-bank'
import { drawCountry } from './country-bank'
import { countryTierOf } from './flag-questions'
import {
  type BankedQuestion,
  bankedQuestions,
  drawQuestion,
  hostQuestionOf
} from './question-bank'
import { drawCapital } from './world-capitals'

const TIERED_RUBRICS = [
  'capitals',
  'flags',
  'rebus',
  'silhouettes'
] as const satisfies readonly QuestionCategory[]

/** Fewer than any rubric's easy share in either language, so a fall-through would not hide a leak. */
const DRAWS = 40

const rowsOf = (category: QuestionCategory): BankedQuestion[] =>
  bankedQuestions().filter((question) => question.category === category)

describe('a tiered country rubric', () => {
  it.each(TIERED_RUBRICS)(
    '[difficulty] tiers every %s row, and fills all three tiers',
    (category) => {
      const tiers = Map.groupBy(rowsOf(category), (question) => question.tier)

      expect([...tiers.keys()].toSorted()).toEqual(['easy', 'hard', 'medium'])

      for (const share of tiers.values()) {
        expect(share.length).toBeGreaterThan(rowsOf(category).length / 5)
      }
    }
  )

  it.each(TIERED_RUBRICS)(
    '[difficulty] deals easy %s only from the easy tier',
    (category) => {
      for (const language of questionLanguages) {
        const played = new Set<string>()

        for (let draw = 0; draw < DRAWS; draw++) {
          const question = drawQuestion({
            isFamilyFriendly: true,
            isUsable: () => true,
            playedIds: played,
            settings: {
              ...DEFAULT_QUIZ_SETTINGS,
              categories: [category],
              difficulty: 'easy',
              language
            }
          })

          expect(question?.tier).toBe('easy')
          played.add(question?.id ?? '')
        }
      }
    }
  )

  it('[difficulty] never files a territory easy, nor a neighbour of France anything else', () => {
    const sovereign = new Set(bankedCapitals().map(({ code }) => code))
    const easyFlags = rowsOf('flags').filter(({ tier }) => tier === 'easy')

    expect(easyFlags.length).toBeGreaterThan(0)

    for (const code of [
      'AND',
      'BEL',
      'CHE',
      'DEU',
      'ESP',
      'ITA',
      'LUX'
    ] as const) {
      expect(countryTierOf(code)).toBe('easy')
    }

    for (const code of ['ABW', 'PRI', 'HKG', 'GRL'] as const) {
      expect(sovereign.has(code)).toBe(false)
      expect(countryTierOf(code)).not.toBe('easy')
    }
  })
})

describe('an easy room asking a country', () => {
  it.each(['capitals', 'flags', 'silhouettes'] as const)(
    '[difficulty] shows %s decoys from other continents, and the similar ones otherwise',
    (category) => {
      for (const question of rowsOf(category)) {
        const easy = hostQuestionOf({ difficulty: 'easy', question })
        const hard = hostQuestionOf({ difficulty: 'hard', question })

        expect(easy.decoys).toEqual(question.easyDecoys)
        expect(hard.decoys).toEqual(question.decoys)
        expect(easy.decoys).not.toContain(question.answer)
        expect(new Set(easy.decoys).size).toBe(3)
      }
    }
  )

  it('[difficulty] puts Japan beside no Asian flag', () => {
    const japan = rowsOf('flags').find(
      ({ answer, language }) => language === 'en' && answer === 'Japan'
    )

    expect(japan?.easyDecoys).not.toContain('South Korea')
    expect(japan?.easyDecoys).not.toContain('Bangladesh')
    expect(japan?.decoys).toContain('Bangladesh')
  })
})

describe('the map at easy', () => {
  it('[difficulty] asks only easy countries, capitals and cities', () => {
    const played = new Set<string>()

    for (let draw = 0; draw < DRAWS; draw++) {
      const country = drawCountry({ difficulty: 'easy', playedIds: played })
      const capital = drawCapital({ difficulty: 'easy', playedIds: played })
      const city = drawCity({ difficulty: 'easy', playedIds: played })

      expect(country === null ? null : countryTierOf(country)).toBe('easy')
      expect(capital?.tier).toBe('easy')
      expect(city?.tier).toBe('easy')
      played.add(`atlas:${country}`)
      played.add(`atlas:capital:${capital?.countryCode}`)
      played.add(`atlas:city:${city?.name}`)
    }
  })

  it('[difficulty] never asks an easy country at hard while a harder one is left', () => {
    for (let draw = 0; draw < DRAWS; draw++) {
      const country = drawCountry({ difficulty: 'hard', playedIds: new Set() })

      expect(country === null ? 'easy' : countryTierOf(country)).not.toBe(
        'easy'
      )
    }
  })
})
