import type { LetterMark } from '@melee/protocol/mystery-word'

/**
 * The mark on every letter of a try, against a hidden word of the same length.
 * The letters in place are counted first; then, left to right, a letter is
 * `present` only while the word still holds a copy of it that no other letter
 * of the try has claimed — so a try writing a letter more times than the word
 * holds it marks the extra copies `absent`.
 */
export const marksForTry = ({
  answer,
  guess
}: {
  answer: string
  guess: string
}): LetterMark[] => {
  const unclaimed = new Map<string, number>()
  const answerLetters = [...answer]
  const guessLetters = [...guess]

  answerLetters.forEach((letter, index) => {
    if (guessLetters[index] !== letter) {
      unclaimed.set(letter, (unclaimed.get(letter) ?? 0) + 1)
    }
  })

  return guessLetters.map((letter, index) => {
    if (answerLetters[index] === letter) {
      return 'placed'
    }

    const copies = unclaimed.get(letter) ?? 0

    if (copies === 0) {
      return 'absent'
    }

    unclaimed.set(letter, copies - 1)

    return 'present'
  })
}

export const isFoundBy = (marks: readonly LetterMark[]): boolean =>
  marks.every((mark) => mark === 'placed')
