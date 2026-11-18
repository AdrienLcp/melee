import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { questionLanguages } from '@melee/protocol/question'

import {
  type ContentTier,
  contentTiers
} from '@melee/core/round/difficulty-draw'
import { foldWord } from '@melee/core/words/fold'
import type { WordLanguage } from '@melee/core/words/word-language'
import {
  decodeWordList,
  encodeWordList,
  type WordMark
} from '@melee/core/words/word-list-coding'

import type { WordBank } from '../src/infrastructure/questions/word-bank'
import { hunspellEntriesOf, hunspellFormsOf } from './hunspell-forms'
import { orStop, readJsonFile } from './json-file'

/**
 * Builds `word-bank-fr.json`, `word-bank-en.json` and `word-bank-pt.json` from
 * word lists downloaded by hand and never committed: Lexique 3.83
 * (`lexique/Lexique383.tsv`), ENABLE (`enable/enable1.txt`), SCOWL 2020.12.07
 * (`scowl/scowl-2020.12.07/final/`), LibreOffice's European Portuguese
 * Hunspell dictionary (`pt/pt_PT.dic`, `pt/pt_PT.aff`) and FrequencyWords'
 * Portuguese subtitle counts (`pt/pt_full.txt`). Run it with
 * `pnpm --filter @melee/server words:build -- <download folder> [languages…]`;
 * the folder defaults to `scripts/.cache/words`, the languages to all three.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const QUESTIONS = join(HERE, '../src/infrastructure/questions')
const SOURCES = process.argv[2] ?? join(HERE, '.cache/words')

const WORD_LANGUAGES = [
  ...questionLanguages,
  'pt'
] as const satisfies readonly WordLanguage[]

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

/**
 * Portuguese lemma frequency per million words of film subtitles, the floor of
 * each tier — read off the lemma's own spelling, which for a noun is its
 * singular and for a verb its infinitive.
 */
const PORTUGUESE_TIER_FLOORS = [
  ['easy', 20],
  ['medium', 5],
  ['hard', 1]
] as const satisfies readonly (readonly [ContentTier, number])[]

/** A form said this often per million words of subtitles is one a Portuguese table would know on the reveal. */
const PORTUGUESE_FAMILIAR_FLOOR = 1

/** The dictionary's categories a hidden word is drawn from: common nouns, adjectives, both at once, and verbs in the infinitive. */
const PORTUGUESE_ANSWER_CATEGORIES = new Set(['a_nc', 'adj', 'nc', 'v'])

const ATTRIBUTIONS: Record<WordLanguage, WordBank['attributions']> = {
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
  ],
  pt: [
    {
      author:
        'José João de Almeida, Rui Vilela and Alberto Simões (Projecto Natura, Universidade do Minho)',
      changes:
        'Every stem was unfolded through its affix rules into the forms it accepts, in the spelling of the 1990 agreement, and each form written in the capitals A to Z — accents and the cedilla dropped. Proper names, abbreviations and forms holding a hyphen were left out, as were the ones shorter than two letters or longer than nine. The words a hidden word is drawn from are its common nouns, adjectives and infinitives of five to eight letters, ranked by how often films say them, minus crude words and a few a reading judged unfit.',
      language: 'pt',
      licence: 'GPL 2.0 / LGPL 2.1 / MPL 1.1',
      source: 'Hunspell pt_PT (LibreOffice)',
      url: 'https://natura.di.uminho.pt'
    },
    {
      author: 'Hermit Dave, counting OpenSubtitles 2018',
      changes:
        'Its Portuguese word counts rank the hidden words into three tiers and mark the long forms a table would know on the reveal; no word is taken from it.',
      language: 'pt',
      licence: 'CC BY-SA 4.0',
      source: 'FrequencyWords',
      url: 'https://github.com/hermitdave/FrequencyWords'
    }
  ]
}

const blockedWordsSchema = z.array(z.string().regex(/^[A-Z]+$/))

const blocklistSchema = z.object({
  en: blockedWordsSchema,
  fr: blockedWordsSchema,
  pt: blockedWordsSchema
} satisfies Record<WordLanguage, typeof blockedWordsSchema>)

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

const subtitleFrequencies = (): Map<string, number> => {
  const counts = new Map<string, number>()
  let total = 0

  for (const line of linesOf(join(SOURCES, 'pt/pt_full.txt'), 'utf8')) {
    const [spelling = '', count = '0'] = line.split(' ')
    const times = Number(count)

    counts.set(spelling, (counts.get(spelling) ?? 0) + times)
    total += times
  }

  const perMillion = new Map<string, number>()

  for (const [spelling, times] of counts) {
    perMillion.set(spelling, (times * 1_000_000) / total)
  }

  return perMillion
}

const CATEGORY = /CAT=([a-z_]+)/u
/** An irregular form names its lemma first, `[$descobrir$CAT=v,T=inf…$P=3…]`: a form, never a lemma. */
const NAMES_ITS_LEMMA = /^\[\$/u
const INFINITIVE = /\bT=inf\b/u
const LOWERCASE_WORD = /^\p{Ll}+$/u

const portugueseWords = (): LanguageWords => {
  const entries = hunspellEntriesOf(join(SOURCES, 'pt/pt_PT.dic')).filter(
    ({ morphology, stem }) =>
      LOWERCASE_WORD.test(stem) && CATEGORY.exec(morphology)?.[1] !== 'np'
  )
  const frequencies = subtitleFrequencies()
  const foldedFrequency = new Map<string, number>()

  for (const [spelling, frequency] of frequencies) {
    const word = foldWord(spelling)

    if (word !== null) {
      foldedFrequency.set(word, (foldedFrequency.get(word) ?? 0) + frequency)
    }
  }

  const forms = new Set<string>()

  for (const form of hunspellFormsOf({
    affPath: join(SOURCES, 'pt/pt_PT.aff'),
    entries
  })) {
    const word = foldWord(form)

    if (word !== null && isFormLength(word)) {
      forms.add(word)
    }
  }

  const lemmaFrequency = new Map<string, number>()

  for (const { morphology, stem } of entries) {
    const category = CATEGORY.exec(morphology)?.[1] ?? ''
    const word = foldWord(stem)

    if (
      word === null ||
      NAMES_ITS_LEMMA.test(morphology) ||
      !isAnswerLength(word) ||
      !PORTUGUESE_ANSWER_CATEGORIES.has(category) ||
      (category === 'v' && !INFINITIVE.test(morphology))
    ) {
      continue
    }

    lemmaFrequency.set(
      word,
      Math.max(lemmaFrequency.get(word) ?? 0, frequencies.get(stem) ?? 0)
    )
  }

  const answers: Answer[] = []

  for (const [word, frequency] of lemmaFrequency) {
    const tier = PORTUGUESE_TIER_FLOORS.find(([, floor]) => frequency >= floor)

    if (tier !== undefined) {
      answers.push({ tier: tier[0], word })
    }
  }

  return {
    answers,
    familiar: new Set(
      [...forms].filter(
        (word) => (foldedFrequency.get(word) ?? 0) >= PORTUGUESE_FAMILIAR_FLOOR
      )
    ),
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
  language: WordLanguage
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

const report = (language: WordLanguage, bank: WordBank): void => {
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

const isWordLanguage = (text: string): text is WordLanguage =>
  WORD_LANGUAGES.some((language) => language === text)

const main = async () => {
  const blocklist = orStop(
    readJsonFile(join(HERE, 'word-answer-blocklist.json'), blocklistSchema),
    'word-answer-blocklist.json'
  )
  const asked = process.argv.slice(3).filter(isWordLanguage)
  const builders: Record<WordLanguage, () => WordBank> = {
    en: () =>
      bankOf({
        blocked: new Set([...blocklist.en, ...scowlTaboo()]),
        language: 'en',
        words: englishWords()
      }),
    fr: () =>
      bankOf({
        blocked: new Set(blocklist.fr),
        language: 'fr',
        words: frenchWords()
      }),
    pt: () =>
      bankOf({
        blocked: new Set(blocklist.pt),
        language: 'pt',
        words: portugueseWords()
      })
  }

  for (const language of asked.length > 0 ? asked : WORD_LANGUAGES) {
    const bank = builders[language]()
    const path = join(QUESTIONS, `word-bank-${language}.json`)

    await writeFile(path, `${JSON.stringify(bank, null, 2)}\n`)
    report(language, bank)
  }
}

await main()
