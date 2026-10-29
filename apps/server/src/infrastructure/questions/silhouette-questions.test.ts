import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

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
    const lopsided = bankedSilhouetteQuestions().filter(
      ({ answer, decoys }) => new Set([answer, ...decoys]).size !== 4
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })

  it('[silhouettes] asks France in both languages', () => {
    const france = bankedSilhouetteQuestions().filter(
      ({ answer }) => answer === 'France'
    )

    expect(france.map(({ language }) => language).toSorted()).toEqual([
      'en',
      'fr'
    ])
  })
})
