import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { questionLanguages } from '@melee/protocol/question'

import { bankedSilhouetteQuestions } from './silhouette-questions'

const SERVED_SILHOUETTES = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'game',
  'public',
  'silhouettes'
)

describe('the silhouettes rubric', () => {
  it('[silhouettes] asks about an outline the app serves', () => {
    const served = new Set(readdirSync(SERVED_SILHOUETTES))
    const missing = bankedSilhouetteQuestions().filter(
      (question) =>
        question.silhouette === null || !served.has(question.silhouette)
    )

    expect(missing.map(({ id }) => id)).toEqual([])
  })

  it('[silhouettes] stands every outline beside three other countries', () => {
    const lopsided = bankedSilhouetteQuestions().filter(({ answer, decoys }) =>
      questionLanguages.some(
        (language) =>
          new Set([answer, ...decoys].map((name) => name[language])).size !== 4
      )
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })

  it('[silhouettes] asks Germany once, read in every language', () => {
    const outlinesOfGermany = bankedSilhouetteQuestions().filter(
      ({ answer }) => answer.en === 'Germany'
    )

    expect(outlinesOfGermany).toHaveLength(1)
    expect(outlinesOfGermany[0]?.answer).toEqual({
      en: 'Germany',
      fr: 'Allemagne',
      pt: 'Alemanha'
    })
    expect(outlinesOfGermany[0]?.prompt).toEqual({
      en: 'Which country has this shape?',
      fr: 'Quel pays a cette forme ?',
      pt: 'Que país tem esta forma?'
    })
    expect(outlinesOfGermany[0]?.id).toMatch(/^silhouette-[0-9a-f]{12}$/)
  })
})
