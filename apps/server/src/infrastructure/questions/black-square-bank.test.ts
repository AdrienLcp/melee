import { describe, expect, it } from 'vitest'

import { franchiseStemOf } from '@melee/core/blacksquare/franchise-stem'
import { gradeLine } from '@melee/core/blacksquare/line-match'
import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import {
  authoredBlackSquareThemes,
  type BlackSquareAnswer,
  bankedBlackSquareThemes,
  blackSquareThemePool,
  drawBlackSquareTheme,
  playedBlackSquareThemeId
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

    expect(ids.length).toBeGreaterThanOrEqual(60)
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
  it('[blacksquare] banks a capital under any of its names, and Geneva as the black word', () => {
    const theme = bankedBlackSquareThemes().find(
      ({ id }) => id === 'capitals-of:western-europe'
    )

    if (theme === undefined) {
      throw new Error('capitals of Western Europe are not banked')
    }

    const grade = (line: string) =>
      gradeLine({
        answers: theme.answers.map(namesOf),
        blackWord: namesOf(theme.blackWord),
        line
      })
    const bern = theme.answers.findIndex(({ labels }) => labels.en === 'Bern')

    expect(grade('Berne')).toEqual({ cells: [bern], kind: 'cells' })
    expect(grade('geneva')).toEqual({ kind: 'blackWord' })
  })
})

describe('the authored black-square themes', () => {
  it('[blacksquare] pools twelve to twenty answers a theme, every tier at least three', () => {
    for (const { answers, id } of authoredBlackSquareThemes()) {
      for (const tier of ['easy', 'medium', 'hard'] as const) {
        expect(
          answers.filter((answer) => answer.tier === tier).length,
          `${id} ${tier}`
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('[blacksquare] never grades a name of a theme as two of its answers, nor the black word as one', () => {
    const collisions = authoredBlackSquareThemes().flatMap(
      ({ answers, blackWord, id }) =>
        [...answers, blackWord].flatMap((named, index) =>
          namesOf(named).flatMap((line) => {
            const graded = gradeLine({
              answers: answers.map(namesOf),
              blackWord: namesOf(blackWord),
              line
            })
            const isOwn =
              index === answers.length
                ? graded.kind === 'blackWord'
                : graded.kind === 'cells' &&
                  graded.cells.length === 1 &&
                  graded.cells[0] === index

            return isOwn ? [] : [`${id}: ${line}`]
          })
        )
    )

    expect(collisions).toEqual([])
  })
})

describe('the black-square theme pool', () => {
  it('[blacksquare] holds every theme of both banks, each id once', () => {
    const ids = blackSquareThemePool().map(({ id }) => id)

    expect(ids.length).toBe(
      bankedBlackSquareThemes().length + authoredBlackSquareThemes().length
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[blacksquare] tiers a Wikidata theme medium or hard, never easy', () => {
    const wikidataIds = new Set(bankedBlackSquareThemes().map(({ id }) => id))
    const tiers = new Set(
      blackSquareThemePool()
        .filter(({ id }) => wikidataIds.has(id))
        .map(({ tier }) => tier)
    )

    expect([...tiers].toSorted()).toEqual(['hard', 'medium'])
  })

  it('[blacksquare] tiers a Wikidata theme by thirds of its nine, the most read obvious', () => {
    const theme = blackSquareThemePool().find(({ id }) => id.includes(':'))

    expect(theme?.answers.map(({ tier }) => tier)).toEqual([
      'easy',
      'easy',
      'easy',
      'medium',
      'medium',
      'medium',
      'hard',
      'hard',
      'hard'
    ])
  })

  it('[blacksquare] deals an easy room the easy themes alone, until they run out', () => {
    const easyIds = new Set(
      blackSquareThemePool()
        .filter(({ tier }) => tier === 'easy')
        .map(({ id }) => id)
    )
    const playedIds = new Set<string>()

    for (const _ of easyIds) {
      const theme = drawBlackSquareTheme({ difficulty: 'easy', playedIds })

      expect(easyIds.has(theme?.id ?? '')).toBe(true)
      playedIds.add(playedBlackSquareThemeId(theme?.id ?? ''))
    }

    expect(drawBlackSquareTheme({ difficulty: 'easy', playedIds })?.tier).toBe(
      'medium'
    )
  })

  it('[blacksquare] never deals a hard room an easy theme while another is left', () => {
    for (const _ of Array.from({ length: 30 })) {
      expect(
        drawBlackSquareTheme({ difficulty: 'hard', playedIds: new Set() })?.tier
      ).not.toBe('easy')
    }
  })
})
