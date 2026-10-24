import type { ChallengeLabels } from '@melee/protocol/challenge'

import { randomUnit } from '../helpers/random'

/** Where a banked line takes the letter it is dealt with. */
export const LETTER_SLOT = '{letter}'

/**
 * Letters a home and an office both hold an object for, in French as in
 * English: no K, Q, W, X, Y or Z, which leave a room searching for nothing.
 */
export const SLOT_LETTERS = [
  'A',
  'B',
  'C',
  'D',
  'F',
  'G',
  'L',
  'M',
  'P',
  'R',
  'S',
  'T'
] as const

/**
 * The line with one letter in its slot, the same in every locale so a table
 * reading two languages hunts for one letter. A line without a slot is
 * returned as it is.
 */
export const fillLetterSlot = ({
  labels,
  unit = randomUnit()
}: {
  labels: ChallengeLabels
  /** In `[0, 1)`: which letter, as a share of the set. */
  unit?: number
}): ChallengeLabels => {
  const letter =
    SLOT_LETTERS[Math.floor(unit * SLOT_LETTERS.length)] ?? SLOT_LETTERS[0]

  return {
    en: labels.en.replaceAll(LETTER_SLOT, letter),
    fr: labels.fr.replaceAll(LETTER_SLOT, letter)
  }
}
