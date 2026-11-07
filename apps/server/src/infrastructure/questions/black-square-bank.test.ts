import { describe, expect, it } from 'vitest'

import { franchiseStemOf } from '@melee/core/blacksquare/franchise-stem'
import { gradeLine } from '@melee/core/blacksquare/line-match'
import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  type BlackSquareAnswer,
  bankedBlackSquareThemes
} from './black-square-bank'

/**
 * The templates whose answers are works. Elsewhere two answers sharing their
 * first words is no franchise: North and South Korea in French, Henri II and
 * Henri IV.
 */
const WORK_TEMPLATES: ReadonlySet<string> = new Set([
  'albums-by-band',
  'award-winning-films',
  'books-by-author',
  'films-directed-by',
  'films-of-studio'
])

const namesOf = ({
  aliases,
  labels
}: Pick<BlackSquareAnswer, 'aliases' | 'labels'>): string[] => [
  labels.en,
  labels.fr,
  ...aliases.en,
  ...aliases.fr
]

describe('the black-square bank', () => {
  it('[blacksquare] parses every theme, each id once', () => {
    const ids = bankedBlackSquareThemes().map(({ id }) => id)

    expect(ids.length).toBeGreaterThanOrEqual(150)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[blacksquare] hides nine different answers behind every theme', () => {
    for (const { answers, id } of bankedBlackSquareThemes()) {
      expect(answers, id).toHaveLength(9)
      expect(new Set(answers.map((answer) => answer.id)).size, id).toBe(9)
    }
  })

  it('[blacksquare] ranks the nine from the most read down', () => {
    for (const { answers, id } of bankedBlackSquareThemes()) {
      const views = answers.map((answer) => answer.views)

      expect(views, id).toEqual(views.toSorted((a, b) => b - a))
    }
  })

  it('[blacksquare] banks one answer per franchise, by its series', () => {
    const clusters = bankedBlackSquareThemes().flatMap(({ answers, id }) => {
      const series = answers.flatMap((answer) =>
        answer.series === null ? [] : [answer.series]
      )

      return series
        .filter((key, index) => series.indexOf(key) !== index)
        .map((key) => `${id}: ${key}`)
    })

    expect(clusters).toEqual([])
  })

  it('[blacksquare] banks one answer per franchise, by the shape of its title', () => {
    const clusters = bankedBlackSquareThemes()
      .filter(({ id }) => WORK_TEMPLATES.has(id.split(':')[0] ?? ''))
      .flatMap(({ answers, id }) =>
        (['en', 'fr'] as const).flatMap((language) => {
          const stems = answers.map(({ labels }) =>
            franchiseStemOf(labels[language])
          )

          return answers
            .filter((_, index) => stems.indexOf(stems[index] ?? '') !== index)
            .map(({ labels }) => `${id}: ${labels[language]}`)
        })
      )

    expect(clusters).toEqual([])
  })

  it('[blacksquare] holds one black word per theme, none of them an answer', () => {
    for (const { answers, blackWord, id } of bankedBlackSquareThemes()) {
      expect(blackWord.why.en.length, id).toBeGreaterThan(0)
      expect(blackWord.why.fr.length, id).toBeGreaterThan(0)
      expect(
        answers.map((answer) => answer.id),
        id
      ).not.toContain(blackWord.id)
    }
  })

  it('[blacksquare] never grades a name of the black word as one of the answers', () => {
    const collisions = bankedBlackSquareThemes().flatMap(
      ({ answers, blackWord, id }) =>
        namesOf(blackWord).flatMap((guess) =>
          answers
            .filter(
              (answer) =>
                gradeQuizGuess({
                  guess,
                  question: {
                    accepted: namesOf(answer),
                    answer: answer.labels.fr,
                    decoys: namesOf(blackWord)
                  }
                }).isCorrect
            )
            .map((answer) => `${id}: ${guess} → ${answer.labels.fr}`)
        )
    )

    expect(collisions).toEqual([])
  })
  it('[blacksquare] banks a capital under any of its seats, and Rio as the black word', () => {
    const theme = bankedBlackSquareThemes().find(
      ({ id }) => id === 'capitals-of:south-america'
    )

    if (theme === undefined) {
      throw new Error('capitals of South America are not banked')
    }

    const grade = (line: string) =>
      gradeLine({
        answers: theme.answers.map(namesOf),
        blackWord: namesOf(theme.blackWord),
        line
      })
    const sucre = theme.answers.findIndex(({ labels }) => labels.en === 'Sucre')

    expect(grade('La Paz')).toEqual({ cells: [sucre], kind: 'cells' })
    expect(grade('Rio')).toEqual({ kind: 'blackWord' })
  })
})
