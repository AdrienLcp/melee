import { describe, expect, it } from 'vitest'

import { questionLanguages } from '@melee/protocol/question'

import { bankedKidsQuestions } from './kids-questions'

const KIDS = bankedKidsQuestions()

/** An evening of easy questions in every language, as the bank's own floor asks of each subject. */
const ENOUGH_EASY_FOR_AN_EVENING = 40

describe('the kids rubric', () => {
  it('[kids] deals every language an evening of easy questions', () => {
    const thin = questionLanguages.filter(
      (language) =>
        KIDS.filter((row) => row.language === language && row.tier === 'easy')
          .length < ENOUGH_EASY_FOR_AN_EVENING
    )

    expect(thin).toEqual([])
  })

  it('[kids] asks every question in all three languages, under its own id', () => {
    const slugsIn = (language: string) =>
      new Set(
        KIDS.filter((row) => row.language === language).map(({ id }) =>
          id.replace(`kids-${language}-`, '')
        )
      )
    const english = slugsIn('en')

    expect(english.size).toBeGreaterThanOrEqual(60)
    expect(slugsIn('fr')).toEqual(english)
    expect(slugsIn('pt')).toEqual(english)
  })

  it('[kids] keeps one tier a question across its three languages', () => {
    const tierBySlug = new Map<string, string>()
    const split: string[] = []

    for (const { id, language, tier } of KIDS) {
      const slug = id.replace(`kids-${language}-`, '')
      const seen = tierBySlug.get(slug)

      if (seen !== undefined && seen !== tier) {
        split.push(slug)
      }

      tierBySlug.set(slug, tier ?? '')
    }

    expect(split).toEqual([])
  })

  it('[kids] stands every answer beside three others', () => {
    const lopsided = KIDS.filter(
      ({ answer, decoys }) =>
        new Set([answer, ...decoys].map(({ en }) => en.toLowerCase())).size !==
        4
    )

    expect(lopsided.map(({ id }) => id)).toEqual([])
  })
})
