import { gradeQuizGuess, type QuestionAnswer } from './question-answer'

/** The question's own decoys a player picking them would be paid for: a row that pays its wrong answer. */
export const decoysGradedRight = (question: QuestionAnswer): string[] =>
  question.decoys.filter(
    (decoy) => gradeQuizGuess({ guess: decoy, question }).isCorrect
  )

/**
 * Each accepted spelling that also names one of the row's decoys, with the
 * decoy it names: the row would pay a spelling of a wrong answer.
 */
export const spellingsNamingADecoy = (
  question: QuestionAnswer
): { decoy: string; spelling: string }[] =>
  question.accepted.flatMap((spelling) => {
    const decoy = question.decoys.find(
      (candidate) =>
        gradeQuizGuess({
          guess: spelling,
          question: {
            accepted: [],
            answer: candidate,
            decoys: [question.answer]
          }
        }).isCorrect
    )

    return decoy === undefined ? [] : [{ decoy, spelling }]
  })
