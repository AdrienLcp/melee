import { z } from 'zod'

import type { Difficulty } from '@melee/protocol/difficulty'
import type { QuestionLanguage } from '@melee/protocol/question'

import {
  type FormIndex,
  indexForms,
  longestWordsIn,
  shownBestWords
} from '@melee/core/longestword/longest-words'
import { drawPlayableLetters } from '@melee/core/longestword/playable-draw'
import {
  type ContentTier,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'
import {
  CODED_WORD_LIST,
  decodeWordList
} from '@melee/core/words/word-list-coding'

import englishBank from './word-bank-en.json' with { type: 'json' }
import frenchBank from './word-bank-fr.json' with { type: 'json' }

export const wordBankSchema = z.object({
  attributions: z.array(
    z.object({
      author: z.string(),
      /** What the build did to the list, which CC BY-SA asks to be said. */
      changes: z.string(),
      language: z.enum(['en', 'fr']),
      licence: z.string(),
      /** A notice the licence asks to travel with every copy, verbatim. */
      notice: z.string().optional(),
      source: z.string(),
      url: z.string()
    })
  ),
  /**
   * Every form a try may be, conjugated and plural included, two to nine
   * letters, as `encodeWordList` writes them. A word a mystery word may hide
   * is marked with its tier, and a form of seven letters or more a table
   * would know on the reveal — read often enough in French, in one of SCOWL's
   * three smallest sizes in English — is marked `familiar`, so the
   * longest-word reveal names it before the rest. Every answer counts as
   * familiar too.
   */
  words: z.string().regex(CODED_WORD_LIST)
})

export type WordBank = z.infer<typeof wordBankSchema>

export type MysteryWordAnswer = {
  tier: ContentTier
  /** Folded to `A`–`Z`. */
  word: string
}

type ReadBank = {
  answersByLength: ReadonlyMap<number, readonly MysteryWordAnswer[]>
  familiar: ReadonlySet<string>
  formsByLength: ReadonlyMap<number, readonly string[]>
}

const BANKS: Record<QuestionLanguage, unknown> = {
  en: englishBank,
  fr: frenchBank
}

const pushed = <TItem>({
  item,
  key,
  map
}: {
  item: TItem
  key: number
  map: Map<number, TItem[]>
}): void => {
  const held = map.get(key)

  if (held === undefined) {
    map.set(key, [item])
  } else {
    held.push(item)
  }
}

const readBank = (bank: WordBank): ReadBank => {
  const answersByLength = new Map<number, MysteryWordAnswer[]>()
  const familiar = new Set<string>()
  const formsByLength = new Map<number, string[]>()

  for (const { mark, word } of decodeWordList(bank.words)) {
    pushed({ item: word, key: word.length, map: formsByLength })

    if (mark !== null) {
      familiar.add(word)
    }

    if (mark !== null && mark !== 'familiar') {
      pushed({
        item: { tier: mark, word },
        key: word.length,
        map: answersByLength
      })
    }
  }

  return { answersByLength, familiar, formsByLength }
}

/** Parsed on the first read of each language, like the other banks, rather than on every cold start. */
const read = new Map<QuestionLanguage, ReadBank>()

const bankOf = (language: QuestionLanguage): ReadBank => {
  const held = read.get(language)

  if (held !== undefined) {
    return held
  }

  const parsed = readBank(wordBankSchema.parse(BANKS[language]))

  read.set(language, parsed)

  return parsed
}

const isInSorted = ({
  sorted,
  word
}: {
  sorted: readonly string[]
  word: string
}): boolean => {
  let low = 0
  let high = sorted.length - 1

  while (low <= high) {
    const middle = (low + high) >>> 1
    const held = sorted[middle] ?? ''

    if (held === word) {
      return true
    }

    if (held < word) {
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return false
}

/** Whether a folded form is a word of the language: any form, conjugated and plural included, two to nine letters. */
export const isValidWord = ({
  language,
  word
}: {
  language: QuestionLanguage
  word: string
}): boolean =>
  isInSorted({
    sorted: bankOf(language).formsByLength.get(word.length) ?? [],
    word
  })

/** Every form of the language by its length, two to nine letters, each list in code-unit order. */
export const wordFormsByLength = (
  language: QuestionLanguage
): ReadonlyMap<number, readonly string[]> => bankOf(language).formsByLength

/** Whether a form of seven letters or more is one a table would know on the reveal. */
export const isFamiliarWord = ({
  language,
  word
}: {
  language: QuestionLanguage
  word: string
}): boolean => bankOf(language).familiar.has(word)

/** Built on the first longest-word draw of each language, so a draw reads one mask per form rather than its letters. */
const formIndexes = new Map<QuestionLanguage, FormIndex>()

const formIndexOf = (language: QuestionLanguage): FormIndex => {
  const held = formIndexes.get(language)

  if (held !== undefined) {
    return held
  }

  const index = indexForms(wordFormsByLength(language))

  formIndexes.set(language, index)

  return index
}

export type LongestWordDraw = {
  bestLength: number
  /** The draw's longest words the reveal names, familiar first, three at most. */
  bestWords: string[]
  letters: string[]
}

/** These letters solved against the language's forms: how long its longest word is, and the ones the reveal names. */
export const solvedLongestWordDraw = ({
  language,
  letters
}: {
  language: QuestionLanguage
  letters: string[]
}): LongestWordDraw | null => {
  const best = longestWordsIn({ index: formIndexOf(language), letters })

  return best === null
    ? null
    : {
        bestLength: best.length,
        bestWords: shownBestWords({
          isFamiliar: (word) => isFamiliarWord({ language, word }),
          words: best.words
        }),
        letters
      }
}

/** Nine letters drawn by the language's frequencies until its dictionary holds a word of seven or more from them. */
export const drawLongestWord = ({
  language
}: {
  language: QuestionLanguage
}): LongestWordDraw | null => {
  const drawn = drawPlayableLetters({ index: formIndexOf(language), language })

  return drawn === null
    ? null
    : {
        bestLength: drawn.bestLength,
        bestWords: shownBestWords({
          isFamiliar: (word) => isFamiliarWord({ language, word }),
          words: drawn.bestWords
        }),
        letters: drawn.letters
      }
}

/** Every word a mystery word of that length may hide, with its tier. */
export const mysteryWordAnswers = ({
  language,
  length
}: {
  language: QuestionLanguage
  length: number
}): readonly MysteryWordAnswer[] =>
  bankOf(language).answersByLength.get(length) ?? []

export const playedMysteryWordId = ({
  language,
  word
}: {
  language: QuestionLanguage
  word: string
}): string => `mysteryword:${language}:${word}`

/**
 * A hidden word of that length the room has not been dealt, at the room's
 * level. `null` once every word of the length is spent.
 */
export const drawMysteryWord = ({
  difficulty,
  language,
  length,
  playedIds
}: {
  difficulty: Difficulty
  language: QuestionLanguage
  length: number
  playedIds: ReadonlySet<string>
}): MysteryWordAnswer | null =>
  drawByDifficulty({
    difficulty,
    pool: mysteryWordAnswers({ language, length }).filter(
      ({ word }) => !playedIds.has(playedMysteryWordId({ language, word }))
    ),
    tierOf: ({ tier }) => tier
  })
