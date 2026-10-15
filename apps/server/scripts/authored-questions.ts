import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import type { QuestionLanguage } from '@taverla/protocol/question'

import { orStop, readJsonFile } from './json-file'
import type { Attribution } from './question-source'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * A list written by hand in this directory, read whole: a row that no longer
 * matches its schema stops the build rather than going missing from the bank.
 */
export const readAuthoredList = <TSchema extends z.ZodType>({
  fileName,
  schema
}: {
  fileName: string
  schema: TSchema
}): z.infer<TSchema>[] =>
  orStop(readJsonFile(join(HERE, fileName), z.array(schema)), fileName)

/**
 * The credit a hand-written list carries: the selection, the notes and the
 * decoys are this repository's, under the share-alike line the bank ships on.
 */
export const taverlaAttribution = (
  language: QuestionLanguage
): Attribution => ({
  author: 'Taverla',
  language,
  licence: 'CC BY-SA 4.0',
  source: 'Taverla',
  url: 'https://github.com/AdrienLcp/taverla'
})
