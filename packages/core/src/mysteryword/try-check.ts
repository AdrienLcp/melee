import { foldWord } from '../words/fold'

/**
 * Why a try was refused. None of them costs a try: a refused try is a typo,
 * and charging it would make the game about spelling.
 *
 * - `not_one_word` — a hyphen, an apostrophe, a space or a digit once folded
 * - `wrong_length` — not the hidden word's length
 * - `wrong_first_letter` — not starting with the letter every screen shows
 * - `not_in_dictionary` — the round's language does not know it
 */
export type TryRefusal =
  | 'not_in_dictionary'
  | 'not_one_word'
  | 'wrong_first_letter'
  | 'wrong_length'

export type CheckedTry =
  | { reason: TryRefusal; status: 'refused' }
  | { status: 'accepted'; word: string }

/** What a typed try is checked against: what every screen shows of the hidden word. */
export type TryRules = {
  /** The hidden word's first letter, folded. */
  firstLetter: string
  /** Whether a folded form is in the round's language's dictionary. */
  isWord: (word: string) => boolean
  length: number
}

/** A typed try, folded and checked in the order a seat can fix it: the letters, the length, the first letter, the dictionary. */
export const checkTry = ({
  rules: { firstLetter, isWord, length },
  typed
}: {
  rules: TryRules
  typed: string
}): CheckedTry => {
  const word = foldWord(typed.trim())

  if (word === null) {
    return { reason: 'not_one_word', status: 'refused' }
  }

  if (word.length !== length) {
    return { reason: 'wrong_length', status: 'refused' }
  }

  if (!word.startsWith(firstLetter)) {
    return { reason: 'wrong_first_letter', status: 'refused' }
  }

  if (!isWord(word)) {
    return { reason: 'not_in_dictionary', status: 'refused' }
  }

  return { status: 'accepted', word }
}
