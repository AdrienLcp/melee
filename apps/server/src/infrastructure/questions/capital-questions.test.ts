import { describe, expect, it } from 'vitest'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { gradeQuizGuess } from '@melee/core/quiz/question-answer'
import { normalizeAnswer } from '@melee/core/round/answer-matching'

import { bankedCapitals } from './capital-bank'
import { bankedCapitalQuestions } from './capital-questions'
import { bankedQuestions } from './question-bank'

const QUESTIONS = bankedCapitalQuestions()

const questionOf = (id: string) => {
  const question = QUESTIONS.find((candidate) => candidate.id === id)

  if (question === undefined) {
    throw new Error(`No question ${id}`)
  }

  return question
}

describe('the capitals rubric', () => {
  it('[capitals] contracts the French article into the question', () => {
    expect(
      ['AUS', 'BRA', 'USA', 'FRA', 'CUB', 'OMN'].map(
        (code) => questionOf(`capital-fr-${code}`).prompt
      )
    ).toEqual([
      'Quelle est la capitale de l’Australie ?',
      'Quelle est la capitale du Brésil ?',
      'Quelle est la capitale des États-Unis ?',
      'Quelle est la capitale de la France ?',
      'Quelle est la capitale de Cuba ?',
      'Quelle est la capitale d’Oman ?'
    ])
  })

  it('[capitals] names the country after its article in English', () => {
    expect(questionOf('capital-en-USA').prompt).toBe(
      'What is the capital of the United States?'
    )
  })

  it('[capitals] stands the capital beside its country’s own big cities', () => {
    expect(questionOf('capital-en-AUS').decoys).toEqual(
      expect.arrayContaining(['Sydney', 'Melbourne'])
    )
  })

  it('[capitals] pays every seat and never offers one as a decoy', () => {
    const sucre = questionOf('capital-en-BOL')

    expect(gradeQuizGuess({ guess: 'La Paz', question: sucre }).isCorrect).toBe(
      true
    )
    expect(sucre.decoys).not.toContain('La Paz')
  })

  it('[capitals] asks no city-state, whose name is its answer', () => {
    const codes = new Set(QUESTIONS.map((question) => question.id.slice(-3)))

    expect(['SGP', 'MCO', 'VAT'].filter((code) => codes.has(code))).toEqual([])
  })

  it('[capitals] never forgives the country’s own name into a capital called otherwise', () => {
    const forgiven = bankedCapitals().flatMap((row) =>
      (
        [
          ['en', COUNTRY_NAMES_EN[row.code].name],
          ['fr', COUNTRY_NAMES_FR[row.code].name]
        ] as const
      ).flatMap(([language, country]) => {
        const question = QUESTIONS.find(
          (candidate) => candidate.id === `capital-${language}-${row.code}`
        )

        return question !== undefined &&
          !normalizeAnswer(question.answer).includes(
            normalizeAnswer(country)
          ) &&
          gradeQuizGuess({ guess: country, question }).isCorrect
          ? [`${question.id}: ${country}`]
          : []
      })
    )

    expect(forgiven).toEqual([])
  })

  it('[capitals] leaves the rubric alone to ask a capital the geography rows asked', () => {
    const geography = bankedQuestions().filter(
      (question) =>
        question.category !== 'capitals' &&
        question.prompt === 'What is the capital of Australia?'
    )

    expect(geography).toEqual([])
  })
})
