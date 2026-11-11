import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import type { QuestionLanguage } from '@melee/protocol/question'

import {
  type ContentTier,
  contentTiers
} from '@melee/core/round/difficulty-draw'
import { foldWord } from '@melee/core/words/fold'
import {
  decodeWordList,
  encodeWordList,
  type WordMark
} from '@melee/core/words/word-list-coding'

import type { WordBank } from '../src/infrastructure/questions/word-bank'
import { orStop, readJsonFile } from './json-file'

/**
 * Builds `word-bank-fr.json` and `word-bank-en.json` from three word lists
 * downloaded by hand and never committed: Lexique 3.83 (`lexique/Lexique383.tsv`),
 * ENABLE (`enable/enable1.txt`) and SCOWL 2020.12.07 (`scowl/scowl-2020.12.07/final/`). Run it
 * with `pnpm --filter @melee/server words:build -- <download folder>`; the
 * folder defaults to `scripts/.cache/words`.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const QUESTIONS = join(HERE, '../src/infrastructure/questions')
const SOURCES = process.argv[2] ?? join(HERE, '.cache/words')

const SHORTEST_FORM = 2
const LONGEST_FORM = 9
const SHORTEST_ANSWER = 5
const LONGEST_ANSWER = 8
const SHORTEST_FAMILIAR = 7

/**
 * Lemma frequency per million words of film subtitles, the floor of each tier.
 * Below the hard floor a lemma is a word few at a table have said aloud.
 */
const FRENCH_TIER_FLOORS = [
  ['easy', 20],
  ['medium', 5],
  ['hard', 1]
] as const satisfies readonly (readonly [ContentTier, number])[]

/** A form read this often per million words, in films or in books, is one a table would know on the reveal. */
const FRENCH_FAMILIAR_FLOOR = 1

const ANSWER_CATEGORIES = new Set(['ADJ', 'NOM', 'VER'])

/** SCOWL's size as the tier: its smaller lists hold the commoner words. */
const ENGLISH_TIER_SIZES = [
  ['easy', 10],
  ['medium', 20],
  ['hard', 35]
] as const satisfies readonly (readonly [ContentTier, number])[]

const SCOWL_NOTICE = `Copyright 2000-2018 by Kevin Atkinson

Permission to use, copy, modify, distribute and sell these word lists, the associated scripts, the output created from the scripts, and its documentation for any purpose is hereby granted without fee, provided that the above copyright notice appears in all copies and that both that copyright notice and this permission notice appear in supporting documentation. Kevin Atkinson makes no representations about the suitability of this array for any purpose. It is provided "as is" without express or implied warranty.`

const ATTRIBUTIONS: Record<QuestionLanguage, WordBank['attributions']> = {
  en: [
    {
      author: 'Alan Beale, M. Cooper and the ENABLE contributors',
      changes:
        'Its words of two to nine letters were kept, written in capitals, as every word a player may try in English.',
      language: 'en',
      licence: 'Public domain',
      source: 'ENABLE',
      url: 'https://github.com/dolph/dictionary'
    },
    {
      author: 'Kevin Atkinson',
      changes:
        'Its three smallest sizes give the words a hidden word is drawn from in English: the ones of five to eight letters, in lowercase and found in ENABLE, never an inflected form, minus its own lists of slurs and profanity and a few more a reading judged unfit. The size a word comes from says how hard it is.',
      language: 'en',
      licence: 'SCOWL licence',
      notice: SCOWL_NOTICE,
      source: 'SCOWL 2020.12.07',
      url: 'http://wordlist.aspell.net'
    }
  ],
  fr: [
    {
      author:
        'Boris New, Christophe Pallier, Marc Brysbaert and Ludovic Ferrand',
      changes:
        'Every form was written in the capitals A to Z — accents dropped, Œ and Æ spelled as two letters — and the ones holding a hyphen, an apostrophe or a space were left out, as were the ones shorter than two letters or longer than nine. The words a hidden word is drawn from are its nouns, adjectives and infinitives of five to eight letters, ranked by how often films say them, minus crude words and a few a reading judged unfit.',
      language: 'fr',
      licence: 'CC BY-SA 4.0',
      source: 'Lexique 3.83',
      url: 'http://www.lexique.org'
    }
  ]
}

const blocklistSchema = z.record(
  z.enum(['en', 'fr']),
  z.array(z.string().regex(/^[A-Z]+$/))
)

type Answer = { tier: ContentTier; word: string }

type LanguageWords = {
  answers: readonly Answer[]
  familiar: ReadonlySet<string>
  forms: ReadonlySet<string>
}

const isFormLength = (word: string): boolean =>
  word.length >= SHORTEST_FORM && word.length <= LONGEST_FORM

const isAnswerLength = (word: string): boolean =>
  word.length >= SHORTEST_ANSWER && word.length <= LONGEST_ANSWER

const linesOf = (path: string, encoding: BufferEncoding): string[] =>
  readFileSync(path, encoding)
    .split(/\r?\n/)
    .filter((line) => line !== '')

const frenchWords = (): LanguageWords => {
  const [header = '', ...rows] = linesOf(
    join(SOURCES, 'lexique/Lexique383.tsv'),
    'utf8'
  )
  const columns = header.split('\t')
  const column = (name: string): number => {
    const index = columns.indexOf(name)

    if (index === -1) {
      throw new Error(`Lexique: no ${name} column`)
    }

    return index
  }
  const at = {
    category: column('cgram'),
    formInBooks: column('freqlivres'),
    formInFilms: column('freqfilms2'),
    lemma: column('lemme'),
    lemmaInFilms: column('freqlemfilms2'),
    spelling: column('ortho')
  }
  const formFrequency = new Map<string, number>()
  const lemmaFrequency = new Map<string, number>()

  for (const row of rows) {
    const cells = row.split('\t')
    const spelling = cells[at.spelling] ?? ''
    const word = foldWord(spelling)

    if (word === null || !isFormLength(word)) {
      continue
    }

    formFrequency.set(
      word,
      (formFrequency.get(word) ?? 0) +
        Math.max(Number(cells[at.formInFilms]), Number(cells[at.formInBooks]))
    )

    if (
      spelling === cells[at.lemma] &&
      ANSWER_CATEGORIES.has(cells[at.category] ?? '') &&
      isAnswerLength(word)
    ) {
      lemmaFrequency.set(
        word,
        Math.max(lemmaFrequency.get(word) ?? 0, Number(cells[at.lemmaInFilms]))
      )
    }
  }

  const answers: Answer[] = []

  for (const [word, frequency] of lemmaFrequency) {
    const tier = FRENCH_TIER_FLOORS.find(([, floor]) => frequency >= floor)

    if (tier !== undefined) {
      answers.push({ tier: tier[0], word })
    }
  }

  return {
    answers,
    familiar: new Set(
      [...formFrequency]
        .filter(([, frequency]) => frequency >= FRENCH_FAMILIAR_FLOOR)
        .map(([word]) => word)
    ),
    forms: new Set(formFrequency.keys())
  }
}

const SCOWL_LOWERCASE_WORD = /^[a-z]+$/

const scowlWords = (size: number): string[] =>
  linesOf(
    join(SOURCES, `scowl/scowl-2020.12.07/final/english-words.${size}`),
    'latin1'
  )

const DOUBLED_LAST_LETTER = /([B-DF-HJ-NP-TV-Z])\1$/

/** The irregular pasts, participles and plurals of five to eight letters no ending gives away. */
const ENGLISH_IRREGULAR_FORMS = new Set(
  `AROSE ARISEN AWOKE AWOKEN BEATEN BECAME BEGAN BEGUN BITTEN BLOWN BOUGHT
  BROKE BROKEN BROUGHT BUILT CAUGHT CHILDREN CHOSE CHOSEN DEALT DRANK DRAWN
  DREAMT DRIVEN DROVE DRUNK EATEN FALLEN FORBADE FORGAVE FORGIVEN FORGOT
  FORGOTTEN FOUGHT FROZE FROZEN GEESE GIVEN GROWN HIDDEN KNELT LEAPT LEARNT
  MISTAKEN OVERCAME RIDDEN RISEN SHAKEN SHONE SHOOK SHOWN SHRANK SHRUNK SLAIN
  SLEPT SOUGHT SPELT SPENT SPILT SPOKE SPOKEN SPRANG SPRUNG STOLE STOLEN
  STOOD STRODE STRUCK STRUNG STUCK SWEPT SWORE SWORN SWUNG TAKEN TAUGHT
  TEETH THOUGHT THREW THROWN UNDERSTOOD WITHDREW WITHDRAWN WOKEN WOVEN
  WRITTEN WROTE BEHELD BIDDEN CACTI CRITERIA FORESAW FORESEEN FUNGI INDICES
  MATRICES MISHEARD MISLAID MISLED MISTOOK NUCLEI OUTGREW OUTGROWN OUTLAID
  OVERHEARD OVERPAID OVERSAW OVERSEEN OVERTOOK OVERTAKEN OVERTHREW
  OVERTHROWN PHENOMENA RADII REPAID STIMULI UNDERGONE UNDERTAKEN UNDERTOOK
  UNDERWENT UPHELD VERTICES WITHHELD`.split(/\s+/)
)

/**
 * The stems an English form may be inflected from, by its ending: a plural, a
 * third person, a past, a gerund.
 */
const stemsOf = (word: string): string[] => {
  const without = (ending: string) => word.slice(0, -ending.length)
  const stems: string[] = []

  if (word.endsWith('IES') || word.endsWith('IED')) {
    stems.push(`${without('IES')}Y`)
  }

  if (word.endsWith('S') && !word.endsWith('SS')) {
    stems.push(without('S'))
  }

  if (word.endsWith('ES')) {
    stems.push(without('ES'))
  }

  if (word.endsWith('ED')) {
    stems.push(without('ED'), without('D'))
  }

  if (word.endsWith('ING')) {
    stems.push(without('ING'), `${without('ING')}E`)
  }

  if (word.endsWith('MEN')) {
    stems.push(`${without('MEN')}MAN`)
  }

  if (word.endsWith('VES')) {
    stems.push(`${without('VES')}F`, `${without('VES')}FE`)
  }

  return [
    ...stems,
    ...stems
      .filter((stem) => DOUBLED_LAST_LETTER.test(stem))
      .map((stem) => stem.slice(0, -1))
  ]
}

/**
 * A comparative and a superlative are told from a noun ending the same way —
 * *corner*, *forest* — by needing each other: *faster* goes because *fastest*
 * is a word too.
 */
const isComparativePair = ({
  known,
  word
}: {
  known: ReadonlySet<string>
  word: string
}): boolean =>
  (word.endsWith('ER') && known.has(`${word.slice(0, -2)}EST`)) ||
  (word.endsWith('EST') && known.has(`${word.slice(0, -3)}ER`))

/** Whether a word is an inflection of another the lists know: SCOWL lists every inflection beside its lemma, and an answer is never one. */
const isInflection = ({
  known,
  word
}: {
  known: ReadonlySet<string>
  word: string
}): boolean =>
  ENGLISH_IRREGULAR_FORMS.has(word) ||
  isComparativePair({ known, word }) ||
  stemsOf(word).some((stem) => stem.length >= 2 && known.has(stem))

/** SCOWL's own lists of slurs and profanity, which no answer is drawn from. */
const SCOWL_TABOO_LISTS = [
  'offensive.1',
  'offensive.2',
  'profane.1',
  'profane.3'
]

const scowlTaboo = (): string[] =>
  SCOWL_TABOO_LISTS.flatMap((list) =>
    linesOf(join(SOURCES, `scowl/scowl-2020.12.07/misc/${list}`), 'latin1')
  )
    .map(foldWord)
    .filter((word): word is string => word !== null)

const englishWords = (): LanguageWords => {
  const forms = new Set(
    linesOf(join(SOURCES, 'enable/enable1.txt'), 'utf8')
      .map(foldWord)
      .filter((word): word is string => word !== null && isFormLength(word))
  )
  const tierOf = new Map<string, ContentTier>()
  const familiar = new Set<string>()

  for (const [tier, size] of ENGLISH_TIER_SIZES) {
    for (const line of scowlWords(size)) {
      const word = foldWord(line)

      if (word === null || !forms.has(word)) {
        continue
      }

      familiar.add(word)

      if (
        SCOWL_LOWERCASE_WORD.test(line) &&
        isAnswerLength(word) &&
        !tierOf.has(word)
      ) {
        tierOf.set(word, tier)
      }
    }
  }

  return {
    answers: [...tierOf]
      .filter(([word]) => !isInflection({ known: familiar, word }))
      .map(([word, tier]) => ({ tier, word })),
    familiar,
    forms
  }
}

const markOf = ({
  answerTiers,
  familiar,
  word
}: {
  answerTiers: ReadonlyMap<string, ContentTier>
  familiar: ReadonlySet<string>
  word: string
}): WordMark | null =>
  answerTiers.get(word) ??
  (word.length >= SHORTEST_FAMILIAR && familiar.has(word) ? 'familiar' : null)

const bankOf = ({
  blocked,
  language,
  words
}: {
  blocked: ReadonlySet<string>
  language: QuestionLanguage
  words: LanguageWords
}): WordBank => {
  const answerTiers = new Map(
    words.answers
      .filter(({ word }) => !blocked.has(word) && words.forms.has(word))
      .map(({ tier, word }) => [word, tier])
  )

  return {
    attributions: ATTRIBUTIONS[language],
    words: encodeWordList(
      [...words.forms].map((word) => ({
        mark: markOf({ answerTiers, familiar: words.familiar, word }),
        word
      }))
    )
  }
}

const report = (language: QuestionLanguage, bank: WordBank): void => {
  const words = decodeWordList(bank.words)
  const tiers = contentTiers.map((tier) => {
    const lengths = []

    for (let length = SHORTEST_ANSWER; length <= LONGEST_ANSWER; length++) {
      lengths.push(
        `${length}:${words.filter(({ mark, word }) => mark === tier && word.length === length).length}`
      )
    }

    return `${tier} ${lengths.join(' ')}`
  })
  const familiar = words.filter(({ mark }) => mark === 'familiar').length

  console.info(
    `${language}: ${words.length} forms, ${familiar} more familiar · ${tiers.join(' · ')}`
  )
}

const main = async () => {
  const blocklist = orStop(
    readJsonFile(join(HERE, 'word-answer-blocklist.json'), blocklistSchema),
    'word-answer-blocklist.json'
  )
  const banks: Record<QuestionLanguage, WordBank> = {
    en: bankOf({
      blocked: new Set([...blocklist.en, ...scowlTaboo()]),
      language: 'en',
      words: englishWords()
    }),
    fr: bankOf({
      blocked: new Set(blocklist.fr),
      language: 'fr',
      words: frenchWords()
    })
  }

  for (const language of ['en', 'fr'] as const) {
    const path = join(QUESTIONS, `word-bank-${language}.json`)

    await writeFile(path, `${JSON.stringify(banks[language], null, 2)}\n`)
    report(language, banks[language])
  }
}

await main()
