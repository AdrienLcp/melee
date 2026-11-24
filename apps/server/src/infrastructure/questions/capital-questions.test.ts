import { describe, expect, it } from 'vitest'

import {
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'
import {
  answerInEveryLanguage,
  gradeQuizGuess
} from '@melee/core/quiz/question-answer'
import { normalizeAnswer } from '@melee/core/round/answer-matching'

import { bankedCapitals } from './capital-bank'
import { bankedCapitalQuestions } from './capital-questions'
import { bankedQuestions } from './question-bank'

const COUNTRY_NAMES = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR,
  pt: COUNTRY_NAMES_PT
} satisfies Record<QuestionLanguage, unknown>

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
        (code) => questionOf(`capital-${code}`).prompt.fr
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

  it('[capitals] contracts the Portuguese article into the question', () => {
    expect(
      ['FRA', 'JPN', 'USA', 'SYC', 'PRT'].map(
        (code) => questionOf(`capital-${code}`).prompt.pt
      )
    ).toEqual([
      'Qual é a capital da França?',
      'Qual é a capital do Japão?',
      'Qual é a capital dos Estados Unidos?',
      'Qual é a capital das Seicheles?',
      'Qual é a capital de Portugal?'
    ])
  })

  it('[capitals] names the country after its article in English', () => {
    expect(questionOf('capital-USA').prompt.en).toBe(
      'What is the capital of the United States?'
    )
  })

  it('[capitals] stands the capital beside its country’s own big cities', () => {
    expect(questionOf('capital-AUS').decoys.map(({ en }) => en)).toEqual(
      expect.arrayContaining(['Sydney', 'Melbourne'])
    )
  })

  it('[capitals] offers the same three cities in every language, in the same order', () => {
    const misaligned = QUESTIONS.flatMap((question) => {
      const row = bankedCapitals().find(
        ({ code }) => `capital-${code}` === question.id
      )
      const places = [
        ...(row?.largestCities ?? []),
        ...bankedCapitals().map(({ capital }) => capital)
      ]

      return [...question.decoys, ...(question.easyDecoys ?? [])].flatMap(
        (decoy) =>
          places.some(({ names }) =>
            questionLanguages.every(
              (language) => names[language] === decoy[language]
            )
          )
            ? []
            : [`${question.id}: ${JSON.stringify(decoy)}`]
      )
    })

    expect(misaligned).toEqual([])
    expect(questionOf('capital-JPN').prompt).toEqual({
      en: 'What is the capital of Japan?',
      fr: 'Quelle est la capitale du Japon ?',
      pt: 'Qual é a capital do Japão?'
    })
  })

  it('[capitals] pays every seat and never offers one as a decoy', () => {
    const sucre = questionOf('capital-BOL')

    expect(
      gradeQuizGuess({
        guess: 'La Paz',
        question: answerInEveryLanguage(sucre)
      }).isCorrect
    ).toBe(true)
    expect(sucre.decoys.map(({ en }) => en)).not.toContain('La Paz')
  })

  it('[capitals] takes the capital typed in any of the three languages', () => {
    const answer = answerInEveryLanguage(questionOf('capital-POL'))

    for (const guess of ['Warsaw', 'Varsovie', 'Varsóvia']) {
      expect(gradeQuizGuess({ guess, question: answer }).isCorrect).toBe(true)
    }

    expect(
      gradeQuizGuess({ guess: 'Cracovie', question: answer }).isCorrect
    ).toBe(false)
  })

  it('[capitals] asks no city-state, whose name is its answer', () => {
    const codes = new Set(QUESTIONS.map((question) => question.id.slice(-3)))

    expect(['SGP', 'MCO', 'VAT'].filter((code) => codes.has(code))).toEqual([])
  })

  it('[capitals] never forgives the country’s own name into a capital called otherwise', () => {
    const forgiven = bankedCapitals().flatMap((row) =>
      questionLanguages.flatMap((language) => {
        const country = COUNTRY_NAMES[language][row.code].name
        const question = QUESTIONS.find(
          (candidate) => candidate.id === `capital-${row.code}`
        )

        return question !== undefined &&
          !questionLanguages.some((answerLanguage) =>
            normalizeAnswer(question.answer[answerLanguage]).includes(
              normalizeAnswer(country)
            )
          ) &&
          gradeQuizGuess({
            guess: country,
            question: answerInEveryLanguage(question)
          }).isCorrect
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
        question.prompt.en === 'What is the capital of Australia?'
    )

    expect(geography).toEqual([])
  })
})
