import { gradeQuizGuess } from '../quiz/question-answer'
import { matchesAnswer } from '../round/answer-matching'
import { type ContentTier, contentTiers } from '../round/difficulty-draw'
import { type LineGrade, lineGraderFor } from './line-match'

/** The fewest answers of each tier a theme pools, so a round of nine still deals every tier and a theme dealt again hides other cells. */
export const MIN_ANSWERS_PER_TIER = 3

/** Every name a table may type for one answer or the black word, in any order the caller keeps track of. */
type Names = readonly string[]

type ThemeNames = {
  answers: readonly Names[]
  blackWord: Names
}

/** The tiers a theme's pool holds fewer than `MIN_ANSWERS_PER_TIER` answers of, with how many it holds. */
export const thinTiersOf = (
  answers: readonly { tier: ContentTier }[]
): { count: number; tier: ContentTier }[] =>
  contentTiers.flatMap((tier) => {
    const count = answers.filter((answer) => answer.tier === tier).length

    return count < MIN_ANSWERS_PER_TIER ? [{ count, tier }] : []
  })

/** A label's first word, accents, case and a leading article folded. */
export const firstWordOf = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/^(?:(?:le|la|les|the) |l')/u, '')
    .split(/[\s'’-]+/u)[0] ?? ''

/**
 * The first words two answers of one theme open with, each once: seven
 * _Haricots_ of seven colours are one thing hidden seven times, and a theme
 * hides one of them, the rest as its aliases. The caller decides which shared
 * word is the theme itself (_Fruit de la passion_, _Fruit du dragon_).
 */
export const repeatedFirstWordsOf = (labels: readonly string[]): string[] => {
  const words = labels.map(firstWordOf)

  return [
    ...new Set(words.filter((word, index) => words.indexOf(word) !== index))
  ]
}

/** A name of the black word the quiz's forgiveness grades as an answer, by both indexes. */
export type BlackWordCollision = {
  answer: number
  guess: string
}

/**
 * Every name of the black word a typed quiz guess would take for one of the
 * answers, the black word's names standing as the decoys a quiz question
 * offers beside it.
 */
export const blackWordCollisionsOf = ({
  answers,
  blackWord
}: ThemeNames): BlackWordCollision[] =>
  blackWord.flatMap((guess) =>
    answers.flatMap((names, answer) =>
      gradeQuizGuess({
        guess,
        question: {
          accepted: [...names],
          answer: names[0] ?? '',
          decoys: [...blackWord]
        }
      }).isCorrect
        ? [{ answer, guess }]
        : []
    )
  )

/**
 * Every name of the black word within the matcher's tolerance of an answer's
 * name, either way and with no rival to stop it: a round keeps them apart,
 * so _Cerises_ beside _Cerise_ grades, and a table typing the plural of a
 * true answer loses its round to a spelling.
 */
export const blackWordSlipsOf = ({
  answers,
  blackWord
}: ThemeNames): BlackWordCollision[] =>
  blackWord.flatMap((guess) =>
    answers.flatMap((names, answer) =>
      names.some(
        (name) =>
          matchesAnswer({ expected: name, given: guess }) ||
          matchesAnswer({ expected: guess, given: name })
      )
        ? [{ answer, guess }]
        : []
    )
  )

/** Whose name a misgraded is: an answer's, by index, or the black word's. */
export type NameOwner =
  | { index: number; kind: 'answer' }
  | { kind: 'blackWord' }

/** One name a round grades otherwise than it should, with the answer dealt alone when it did. */
export type MisgradedName = {
  dealt: number
  expected: LineGrade['kind']
  graded: LineGrade['kind']
  line: string
  /** Its place among its owner's names. */
  nameIndex: number
  owner: NameOwner
}

/**
 * Every name of a theme graded the way a round grades it, each answer dealt
 * alone and the rest left out: each must find its own cell, the black word
 * must land on itself, and a true answer the deal left out must find nothing
 * at all — which is also where two answers sharing a name, or one a slip from
 * the other, show.
 */
export const misgradedNamesOf = ({
  answers,
  blackWord
}: ThemeNames): MisgradedName[] =>
  answers.flatMap((dealtNames, dealt) => {
    const grade = lineGraderFor({
      answers: [dealtNames],
      blackWord,
      leftOut: answers.flatMap((other, index) => (index === dealt ? [] : other))
    })
    const misgraded = ({
      expected,
      names,
      owner
    }: {
      expected: LineGrade['kind']
      names: Names
      owner: NameOwner
    }): MisgradedName[] =>
      names.flatMap((line, nameIndex) => {
        const graded = grade(line).kind

        return graded === expected
          ? []
          : [{ dealt, expected, graded, line, nameIndex, owner }]
      })

    return [
      ...misgraded({
        expected: 'cells',
        names: dealtNames,
        owner: { index: dealt, kind: 'answer' }
      }),
      ...misgraded({
        expected: 'blackWord',
        names: blackWord,
        owner: { kind: 'blackWord' }
      }),
      ...answers.flatMap((other, index) =>
        index === dealt
          ? []
          : misgraded({
              expected: 'nothing',
              names: other,
              owner: { index, kind: 'answer' }
            })
      )
    ]
  })
