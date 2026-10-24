import { describe, expect, it } from 'vitest'

import { gradeQuizGuess } from '@melee/core/quiz/question-answer'

import { bankedGuessNineThemes, type GuessNineAnswer } from './guess-nine-bank'

const namesOf = ({
  aliases,
  labels
}: Pick<GuessNineAnswer, 'aliases' | 'labels'>): string[] => [
  labels.en,
  labels.fr,
  ...aliases.en,
  ...aliases.fr
]

describe('the guess-nine bank', () => {
  it('[guessnine] parses every theme, each id once', () => {
    const ids = bankedGuessNineThemes().map(({ id }) => id)

    expect(ids.length).toBeGreaterThanOrEqual(150)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[guessnine] hides nine different answers behind every theme', () => {
    for (const { answers, id } of bankedGuessNineThemes()) {
      expect(answers, id).toHaveLength(9)
      expect(new Set(answers.map((answer) => answer.id)).size, id).toBe(9)
    }
  })

  it('[guessnine] ranks the nine from the most read down', () => {
    for (const { answers, id } of bankedGuessNineThemes()) {
      const views = answers.map((answer) => answer.views)

      expect(views, id).toEqual(views.toSorted((a, b) => b - a))
    }
  })

  it('[guessnine] holds one black word per theme, none of them an answer', () => {
    for (const { answers, blackWord, id } of bankedGuessNineThemes()) {
      expect(blackWord.why.en.length, id).toBeGreaterThan(0)
      expect(blackWord.why.fr.length, id).toBeGreaterThan(0)
      expect(
        answers.map((answer) => answer.id),
        id
      ).not.toContain(blackWord.id)
    }
  })

  it('[guessnine] never grades a name of the black word as one of the answers', () => {
    const collisions = bankedGuessNineThemes().flatMap(
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
})
