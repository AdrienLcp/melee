import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { orStop, readJsonFile } from './json-file'
import type { Attribution, BankLanguage } from './question-source'

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
export const meleeAttribution = (language: BankLanguage): Attribution => ({
  author: 'Melee',
  language,
  licence: 'CC BY-SA 4.0',
  source: 'Melee',
  url: 'https://github.com/AdrienLcp/melee'
})
