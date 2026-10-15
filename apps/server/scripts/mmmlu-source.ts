import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import {
  type QuestionCategory,
  questionCategorySchema
} from '@taverla/protocol/question'

import { orStop, readJsonFile } from './json-file'
import {
  type Attribution,
  type BankedQuestion,
  cached,
  decoysOf,
  type IngestedQuestions
} from './question-source'

/**
 * OpenAI's professional French translation of MMLU's test split: a benchmark
 * rather than a quiz, so most of it is thrown away, and what survives is the
 * only French science with any depth that an open licence reaches. See
 * `docs/plans/22-thin-french-subjects.md`.
 */
const CSV_URL =
  'https://huggingface.co/datasets/openai/MMMLU/resolve/main/test/mmlu_FR-FR.csv'

const ATTRIBUTION: Attribution = {
  author:
    'OpenAI — a professional French translation of MMLU (Hendrycks et al.), filtered to trivia, with some questions reworded or corrected and some wrong answers replaced',
  language: 'fr',
  licence: 'MIT',
  source: 'MMMLU',
  url: 'https://huggingface.co/datasets/openai/MMMLU'
}

/** The MMLU subjects a party table can play, and the bank category each lands in. */
const BANKED_SUBJECTS: Partial<Record<string, QuestionCategory>> = {
  anatomy: 'science',
  astronomy: 'science',
  college_biology: 'science',
  conceptual_physics: 'science',
  high_school_biology: 'science',
  high_school_chemistry: 'science',
  high_school_geography: 'geography',
  medical_genetics: 'science',
  miscellaneous: 'everyday',
  nutrition: 'science',
  prehistory: 'history',
  world_religions: 'history'
}

/**
 * The category of a row read and kept whose subject's own category is not it,
 * by row id. `miscellaneous` is MMLU's pub quiz and spans every subject the
 * bank has — Louis XIV, *Les Hommes du président*, the bowling strike — so the
 * subject says nothing and the reading said the rest.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const CATEGORIES_PATH = join(HERE, 'mmmlu-categories.json')
const categoryByRow = orStop(
  readJsonFile(CATEGORIES_PATH, z.record(z.string(), questionCategorySchema)),
  CATEGORIES_PATH
)

/**
 * The rows that passed every shape rule and failed a reading, each with the why
 * it was judged on. They live beside the source rather than among the bank's
 * repairs because they are most of what survives the rules — an exam in a
 * party's shape — and the dataset is frozen, so the list never goes stale.
 */
const DROPPED_PATH = join(HERE, 'mmmlu-dropped.json')
const dropWhyById = new Map(
  orStop(
    readJsonFile(
      DROPPED_PATH,
      z.array(z.object({ id: z.string(), prompt: z.string(), why: z.string() }))
    ),
    DROPPED_PATH
  ).map(({ id, why }) => [id, why])
)

/**
 * Every other subject, by why it is not trivia. A subject in neither map is a
 * new one upstream and is refused by name in the report until somebody reads it.
 */
const REFUSED_SUBJECTS: Record<string, string> = {
  abstract_algebra: 'a computation',
  business_ethics: 'an opinion graded as a fact',
  clinical_knowledge: 'nursing procedure',
  college_chemistry: 'read whole, and every row was a lab exam',
  college_computer_science: 'a computation',
  college_mathematics: 'a computation',
  college_medicine: 'an exam passage, and mislabelled physics besides',
  college_physics: 'a computation',
  computer_security: 'a professional exam',
  econometrics: 'a computation',
  electrical_engineering: 'a computation',
  elementary_mathematics: 'a computation',
  formal_logic: 'a computation',
  global_facts: 'a survey percentage from one dated year',
  high_school_computer_science: 'reading code',
  high_school_european_history:
    'a question on a source document: none of 165 stems is shorter than 193 characters',
  high_school_government_and_politics: 'American civics class',
  high_school_macroeconomics: 'an economics exam',
  high_school_mathematics: 'a computation',
  high_school_microeconomics: 'an economics exam',
  high_school_physics: 'read whole, and every row was a physics exam',
  high_school_psychology: 'a psychology syllabus',
  high_school_statistics: 'a computation',
  high_school_us_history:
    'a question on a source document: none of 204 stems is shorter than 193 characters',
  high_school_world_history:
    'a question on a source document: none of 237 stems is shorter than 193 characters',
  human_aging: 'gerontology statistics',
  human_sexuality: 'a psychology syllabus',
  international_law: 'a law exam',
  jurisprudence: 'a law exam',
  logical_fallacies: 'naming a fallacy is a reasoning test',
  machine_learning: 'a computation',
  management: 'a business-school syllabus',
  marketing: 'a business-school syllabus',
  moral_disputes: 'an opinion graded as a fact',
  moral_scenarios: 'an opinion graded as a fact',
  philosophy: 'a philosophy syllabus',
  professional_accounting: 'a professional exam',
  professional_law: 'a professional exam',
  professional_medicine: 'a professional exam',
  professional_psychology: 'a professional exam',
  public_relations: 'a business-school syllabus',
  security_studies: 'an international-relations essay',
  sociology: 'a sociology syllabus',
  us_foreign_policy: 'American civics class',
  virology: 'read whole, and every row was an epidemiology exam'
}

/**
 * The longest stem the bank takes from this source, below the 192 of the
 * bank's longest prompt. In the subjects kept, the 249 stems between 151 and
 * 192 characters are almost all a case to read — *Un patient présente…* — with
 * the question in its last clause.
 */
const LONGEST_PROMPT = 150

/**
 * The longest candidate, in characters. A candidate longer than this is a
 * sentence, and a sentence is not something a room types or shouts.
 */
const LONGEST_CANDIDATE = 40

/**
 * The shapes of an exam question that no rewording turns into a party one:
 * a choice among statements, an answer that is a combination of other answers,
 * or a stem that only means something beside the four lines under it.
 */
const EXAM_SHAPE = new RegExp(
  [
    'suivant',
    'ci-dessous',
    'ci-dessus',
    'parmi (?:les|ces)',
    'énoncé',
    'affirmation',
    'proposition',
    'tou(?:te)?s? (?:les|ces) (?:réponses|propositions|options|choix)',
    'aucune? (?:des|de ces)',
    '\\b(?:les deux|à la fois)\\b',
    '\\b[A-D] et [A-D]\\b',
    '\\b(?:I|II|III|IV)\\b',
    '^(?:vrai|faux)',
    'passage',
    'texte',
    'extrait',
    'auteur cité',
    'ce document',
    '_{2,}'
  ].join('|'),
  'iu'
)

/** A candidate that is a quantity rather than a name: digits, units and signs. */
const QUANTITY =
  /^[\s\d.,:+\-−×x*/^%°()=<>~a-zA-Zµ²³]*\d[\s\d.,:+\-−×x*/^%°()=<>~a-zA-Zµ²³]*$/u

/** A stem that asks for working rather than for something known. */
const WORKING =
  /^(?:calcule|détermine|estime|trouve|évalue|résoudre|résolvez|simplifie)/iu

/**
 * A row whose candidates are all quantities and whose stem carries the numbers
 * to work them out from: a computation, which a room cannot do in a buzz.
 * A year asked from nothing — *en quelle année* — keeps no digit in its stem
 * and survives.
 */
const isComputation = ({
  candidates,
  prompt
}: {
  candidates: readonly string[]
  prompt: string
}): boolean =>
  WORKING.test(prompt) ||
  (/\d/u.test(prompt) &&
    candidates.filter((candidate) => QUANTITY.test(candidate)).length >= 3)

/**
 * RFC 4180, which is what the dataset is written in: quoted fields carry
 * commas, doubled quotes and line breaks, so a split on commas or lines breaks
 * every candidate list written as « Vrai, Faux ».
 */
const csvRecords = (text: string): string[][] => {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let isQuoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (isQuoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        isQuoted = false
      } else {
        field += character
      }
      continue
    }

    switch (character) {
      case '"':
        isQuoted = true
        break
      case ',':
        record.push(field)
        field = ''
        break
      case '\n':
        record.push(field.replace(/\r$/u, ''))
        records.push(record)
        record = []
        field = ''
        break
      default:
        field += character
    }
  }

  if (field !== '' || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  return records
}

type Row = {
  answer: string
  candidates: string[]
  id: string
  prompt: string
  subject: string
}

const ANSWER_LETTERS = 'ABCD'

/**
 * The translation sets French typography's narrow space inside guillemets as
 * a ring operator (`«∘islam∘»`), which a screen prints as a ring.
 */
const plainTextOf = (raw: string): string =>
  raw.replaceAll('∘', ' ').replace(/\s+/gu, ' ').trim()

/**
 * A candidate as a room reads it. MMLU writes the end of a completion stem as
 * its candidates, so *le chinois mandarin.* carries the full stop of a sentence
 * the screen never shows; and the dataset went through a spreadsheet that
 * turned every whole number into a float, so 46 chromosomes read *46.0*.
 */
const candidateOf = (raw: string): string =>
  plainTextOf(raw)
    .replace(/^(-?\d+)\.0$/u, '$1')
    .replace(/(?<!\.\.)\.$/u, '')

/**
 * A stem as a room reads it. A completion stem — *La langue la plus parlée
 * est* — stops where its answer starts, and a screen showing it bare reads as
 * a sentence cut off by mistake.
 */
const promptOf = (raw: string): string => {
  const prompt = plainTextOf(raw)

  return /[?:…]$/u.test(prompt) ? prompt : `${prompt.replace(/[.,]$/u, '')} …`
}

const rowOf = (record: readonly string[]): Row | null => {
  const [index, prompt, a, b, c, d, answerLetter, subject] = record

  if (
    index === undefined ||
    prompt === undefined ||
    a === undefined ||
    b === undefined ||
    c === undefined ||
    d === undefined ||
    answerLetter === undefined ||
    subject === undefined
  ) {
    return null
  }

  const candidates = [a, b, c, d].map(candidateOf)
  const answer = candidates[ANSWER_LETTERS.indexOf(answerLetter)]

  return answer === undefined
    ? null
    : {
        answer,
        candidates,
        id: `mmmlu-${subject.replaceAll('_', '-')}-${index}`,
        prompt: promptOf(prompt),
        subject
      }
}

/**
 * Which of the shapes no party table plays this row is, or `null` where it may
 * be a question. The reading that comes after is what decides the rest.
 */
const refusalOf = (row: Row): string | null => {
  if (row.prompt.length > LONGEST_PROMPT) {
    return `a ${row.prompt.length}-character stem`
  }

  if (
    row.candidates.some((candidate) => candidate.length > LONGEST_CANDIDATE)
  ) {
    return 'a candidate that is a sentence'
  }

  if (
    EXAM_SHAPE.test(row.prompt) ||
    row.candidates.some((candidate) => EXAM_SHAPE.test(candidate))
  ) {
    return 'an exam shape'
  }

  if (isComputation({ candidates: row.candidates, prompt: row.prompt })) {
    return 'a computation'
  }

  const spellings = new Set(
    row.candidates.map((candidate) => candidate.toLowerCase())
  )

  return spellings.size === row.candidates.length
    ? null
    : 'two candidates spelled the same'
}

export const ingestMmmlu = async (): Promise<IngestedQuestions> => {
  const text = await cached('mmmlu-fr.csv', async () => {
    const response = await fetch(CSV_URL)

    if (!response.ok) {
      throw new Error(`${CSV_URL} answered ${response.status}`)
    }

    return response.text()
  })

  const questions: BankedQuestion[] = []
  const rejections: string[] = []
  const unknownSubjects = new Set<string>()

  for (const record of csvRecords(text).slice(1)) {
    const row = rowOf(record)

    if (row === null) {
      rejections.push(`a record of ${record.length} fields`)
      continue
    }

    const subjectCategory = BANKED_SUBJECTS[row.subject]

    if (subjectCategory === undefined) {
      if (!(row.subject in REFUSED_SUBJECTS)) {
        unknownSubjects.add(row.subject)
      }
      continue
    }

    const { answer, id } = row
    const dropWhy = dropWhyById.get(id)

    if (dropWhy !== undefined) {
      rejections.push(`${id}: ${dropWhy}`)
      continue
    }

    const refusal = refusalOf(row)

    if (refusal !== null) {
      rejections.push(`${id}: ${refusal}`)
      continue
    }

    const decoys = decoysOf({ answer, candidates: row.candidates })

    if (decoys === null) {
      rejections.push(`${id}: no single answer among the candidates`)
      continue
    }

    questions.push({
      accepted: [],
      answer,
      category: categoryByRow[id] ?? subjectCategory,
      choiceOnly: false,
      decoys,
      id,
      isAdult: false,
      isWellKnown: false,
      language: 'fr',
      note: null,
      prompt: row.prompt,
      theme: row.subject
    })
  }

  for (const subject of unknownSubjects) {
    rejections.push(`${subject}: a subject nobody has read yet`)
  }

  return { attribution: ATTRIBUTION, questions, rejections }
}
