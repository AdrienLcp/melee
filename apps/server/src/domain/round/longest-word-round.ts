import type { PlayerId } from '@melee/protocol/identifiers'
import type { QuestionLanguage } from '@melee/protocol/question'
import type { RoundContent } from '@melee/protocol/room'
import type { LettersVerdict } from '@melee/protocol/scoring'

import { type CheckedWord, checkWord } from '@melee/core/longestword/word-check'

import type { Round } from '@/domain/room/room'
import type { IsWord } from '@/domain/round/mystery-word-round'

type LongestWordContent = Extract<Round['content'], { kind: 'longestword' }>

/** A round on these nine letters, solved against the dictionary of `language` before it opens. */
export const longestWordContent = ({
  bestLength,
  bestWords,
  language,
  letters
}: {
  bestLength: number
  bestWords: string[]
  language: QuestionLanguage
  letters: string[]
}): LongestWordContent => ({
  bestLength,
  bestWords,
  kind: 'longestword',
  language,
  letters,
  words: new Map()
})

/** A typed line checked against the draw and the round's dictionary. */
export const checkLongestWord = ({
  content,
  isWord,
  typed
}: {
  content: LongestWordContent
  isWord: IsWord
  typed: string
}): CheckedWord =>
  checkWord({
    isWord: (word) => isWord({ language: content.language, word }),
    letters: content.letters,
    typed
  })

/**
 * The seat's verdict with this accepted word sent: the word's length when it
 * is longer than what the seat held, and what it held otherwise — a later
 * word of the same length does not replace the first.
 */
export const gradeLongestWord = ({
  content,
  held,
  word
}: {
  content: LongestWordContent
  held: LettersVerdict | null
  word: string
}): LettersVerdict =>
  held !== null && held.length >= word.length
    ? held
    : { bestLength: content.bestLength, kind: 'letters', length: word.length }

/** A seat's paid word among the ones it sent: the first of the greatest length. */
export const longestOf = (words: readonly string[]): string | null =>
  words.reduce<string | null>(
    (longest, word) =>
      longest === null || word.length > longest.length ? word : longest,
    null
  )

/**
 * The round as a seat, the wall or a seated console reads it. Every screen
 * reads the draw and how long each seat's word is; the reader reads its own
 * words, and the reveal spells out every seat's beside the draw's longest.
 */
export const longestWordContentView = ({
  content,
  isRevealed,
  youId
}: {
  content: LongestWordContent
  isRevealed: boolean
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'longestword' }> => {
  const seatWords = [...content.words].flatMap(([playerId, words]) => {
    const word = longestOf(words)

    return word === null ? [] : [{ playerId, word }]
  })

  return {
    bestLength: isRevealed ? content.bestLength : null,
    bestWords: isRevealed ? content.bestWords : null,
    kind: 'longestword',
    language: content.language,
    lengths: seatWords.map(({ playerId, word }) => ({
      length: word.length,
      playerId
    })),
    letters: content.letters,
    revealedWords: isRevealed ? seatWords : null,
    yourWords: youId === null ? null : (content.words.get(youId) ?? [])
  }
}
