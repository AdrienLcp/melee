import type { PlayerId } from '@melee/protocol/identifiers'
import type { SpelledTry } from '@melee/protocol/mystery-word'
import type { QuestionLanguage } from '@melee/protocol/question'
import type { RoundContent } from '@melee/protocol/room'
import type { WordVerdict } from '@melee/protocol/scoring'

import { isFoundBy, marksForTry } from '@melee/core/mysteryword/letter-marks'
import { type CheckedTry, checkTry } from '@melee/core/mysteryword/try-check'

import type { Round } from '@/domain/room/room'

type MysteryWordContent = Extract<Round['content'], { kind: 'mysteryword' }>

/** Whether a folded form is a word of the language — the dictionary, held by the infrastructure. */
export type IsWord = (options: {
  language: QuestionLanguage
  word: string
}) => boolean

/** A round hiding this word, folded to `A`–`Z`, in the dictionary of `language`. */
export const mysteryWordContent = ({
  language,
  word
}: {
  language: QuestionLanguage
  word: string
}): MysteryWordContent => ({
  kind: 'mysteryword',
  language,
  tries: new Map(),
  word
})

/** A typed line checked against what every screen shows of the word and the round's dictionary. */
export const checkWordTry = ({
  content,
  isWord,
  typed
}: {
  content: MysteryWordContent
  isWord: IsWord
  typed: string
}): CheckedTry =>
  checkTry({
    rules: {
      firstLetter: content.word.slice(0, 1),
      isWord: (word) => isWord({ language: content.language, word }),
      length: content.word.length
    },
    typed
  })

/**
 * The seat's grid with this accepted try added: a row of marks, and the try
 * that found the word kept once one has.
 */
export const gradeWordTry = ({
  content,
  held,
  word
}: {
  content: MysteryWordContent
  held: WordVerdict | null
  word: string
}): WordVerdict => {
  const marks = marksForTry({ answer: content.word, guess: word })
  const rows = [...(held?.rows ?? []), marks]

  return {
    foundOnTry: held?.foundOnTry ?? (isFoundBy(marks) ? rows.length : null),
    kind: 'word',
    rows
  }
}

const spelledTries = ({
  content,
  words
}: {
  content: MysteryWordContent
  words: readonly string[]
}): SpelledTry[] =>
  words.map((word) => ({
    marks: marksForTry({ answer: content.word, guess: word }),
    word
  }))

/**
 * The round as a seat, the wall or a seated console reads it. Every grid
 * travels as colours while the word is hidden; the reader's own carries its
 * letters, and the reveal spells them all out beside the word.
 */
export const mysteryWordContentView = ({
  content,
  isRevealed,
  youId
}: {
  content: MysteryWordContent
  isRevealed: boolean
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'mysteryword' }> => {
  const grids = [...content.tries].map(([playerId, words]) => ({
    playerId,
    tries: spelledTries({ content, words })
  }))

  return {
    firstLetter: content.word.slice(0, 1),
    grids: grids.map(({ playerId, tries }) => ({
      playerId,
      rows: tries.map(({ marks }) => marks)
    })),
    kind: 'mysteryword',
    language: content.language,
    length: content.word.length,
    revealedGrids: isRevealed ? grids : null,
    revealedWord: isRevealed ? content.word : null,
    yourTries:
      youId === null
        ? null
        : (grids.find(({ playerId }) => playerId === youId)?.tries ?? [])
  }
}
