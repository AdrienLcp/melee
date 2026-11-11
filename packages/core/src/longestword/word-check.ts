import { LONGEST_WORD_MIN_LENGTH } from '@melee/protocol/longest-word'

import { foldWord } from '../words/fold'
import { isSpelledFrom } from './longest-words'

/**
 * Why a word was refused. None of them costs anything: a seat sends as many
 * words as it likes, and a refusal only says which to fix.
 *
 * - `not_one_word` — a hyphen, an apostrophe, a space or a digit once folded
 * - `letter_not_in_draw` — a letter the draw lacks, or one used more often than drawn
 * - `not_in_dictionary` — the round's language does not know it, a single letter included
 */
export type WordRefusal =
  | 'letter_not_in_draw'
  | 'not_in_dictionary'
  | 'not_one_word'

export type CheckedWord =
  | { reason: WordRefusal; status: 'refused' }
  | { status: 'accepted'; word: string }

/** A typed word, folded and checked in the order a seat can fix it: the letters, the draw, the dictionary. */
export const checkWord = ({
  isWord,
  letters,
  typed
}: {
  /** Whether a folded form is in the round's language's dictionary. */
  isWord: (word: string) => boolean
  letters: readonly string[]
  typed: string
}): CheckedWord => {
  const word = foldWord(typed.trim())

  if (word === null) {
    return { reason: 'not_one_word', status: 'refused' }
  }

  if (!isSpelledFrom({ letters, word })) {
    return { reason: 'letter_not_in_draw', status: 'refused' }
  }

  if (word.length < LONGEST_WORD_MIN_LENGTH || !isWord(word)) {
    return { reason: 'not_in_dictionary', status: 'refused' }
  }

  return { status: 'accepted', word }
}
