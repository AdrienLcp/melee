import type { LocalizedText } from '@melee/protocol/locale'
import type { SingleVerdict } from '@melee/protocol/scoring'

import { matchesAnswer } from '../round/answer-matching'

/** Everything grading a question needs, and nothing a player may hold. */
export type QuestionAnswer = {
  /** Other spellings that count, whatever language they are in. */
  accepted: readonly string[]
  answer: string
  /**
   * The candidates the row calls wrong. Three of them everywhere the bank is
   * the source, but how many there are is the bank's business rather than the
   * grader's — this reads them as a set of rivals and counts nothing.
   */
  decoys: readonly string[]
}

/** An answer and its rivals in every language a screen reads, and every other spelling that counts in any of them. */
export type LocalizedQuestionAnswer = {
  accepted: readonly string[]
  answer: LocalizedText
  decoys: readonly LocalizedText[]
}

/**
 * A question read in every language at once, because a table may type in any
 * of them: the answer in each counts, and so does each spelling, and no typo
 * is forgiven far enough to reach a decoy named in any of them.
 */
export const answerInEveryLanguage = (
  question: LocalizedQuestionAnswer
): QuestionAnswer => {
  const [answer, ...otherAnswers] = new Set(Object.values(question.answer))

  return {
    accepted: [...new Set([...otherAnswers, ...question.accepted])],
    answer: answer ?? '',
    decoys: [
      ...new Set(question.decoys.flatMap((decoy) => Object.values(decoy)))
    ]
  }
}

/**
 * One claim, measured against the whole of what was typed rather than looked
 * for inside it — the one place this game deliberately parts company with the
 * blind test's matcher.
 *
 * Searching within a line is what makes the blind test's single field honest,
 * because that field holds two claims and a room types them together. A
 * question holds one, and searching within it would pay a player who hedged:
 * "trois ou quatre" contains the answer to how many languages Switzerland has.
 *
 * `accepted` is where a bank names the spellings it thought worth naming. Case,
 * accents, punctuation and a leading article are folded away before anything is
 * compared, and a slipped finger is forgiven in proportion to the length of the
 * answer — but never far enough to reach a decoy, because the row's own three
 * are the bank saying what it considers a different answer.
 */
export const gradeQuizGuess = ({
  guess,
  question
}: {
  guess: string
  question: QuestionAnswer
}): SingleVerdict => ({
  isCorrect: [question.answer, ...question.accepted].some((expected) =>
    matchesAnswer({
      distinctFrom: question.decoys,
      expected,
      given: guess
    })
  ),
  kind: 'single'
})
