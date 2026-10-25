import { z } from 'zod'

import { playerIdSchema } from './identifiers'

export const petitBacLetters = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z'
] as const

export const petitBacLetterSchema = z.enum(petitBacLetters)

/** Left out of a room's draw until its host ticks them back: a table rarely finds six words on any of them. */
export const RARE_PETIT_BAC_LETTERS = [
  'K',
  'Q',
  'W',
  'X',
  'Y',
  'Z'
] as const satisfies readonly PetitBacLetter[]

/**
 * A room may leave out every letter but this many, so a game of rounds still
 * draws a different one each time.
 */
export const MIN_PLAYABLE_PETIT_BAC_LETTERS = 6

/**
 * The categories the game ships, as keys the dictionaries label in every
 * language. A host's own line is the other kind of category, typed and shown
 * as typed.
 */
export const petitBacBankCategories = [
  'animal',
  'bodyPart',
  'brand',
  'cartoonCharacter',
  'cheese',
  'city',
  'clothing',
  'colour',
  'country',
  'dish',
  'drink',
  'famousPerson',
  'fictionalCharacter',
  'film',
  'firstName',
  'fruitOrVegetable',
  'gift',
  'hobby',
  'instrument',
  'job',
  'kitchenThing',
  'lateExcuse',
  'plant',
  'series',
  'singer',
  'sport',
  'thingInABag',
  'tool',
  'toy',
  'vehicle'
] as const

export const petitBacBankCategorySchema = z.enum(petitBacBankCategories)

/** A category is a line on a sheet, read at a glance: *a country*, *something in a bag*. */
export const PETIT_BAC_OWN_CATEGORY_MAX_LENGTH = 40

export const petitBacCategorySchema = z.discriminatedUnion('kind', [
  z.object({ key: petitBacBankCategorySchema, kind: z.literal('bank') }),
  z.object({
    kind: z.literal('own'),
    label: z.string().trim().min(1).max(PETIT_BAC_OWN_CATEGORY_MAX_LENGTH)
  })
])

export const MIN_PETIT_BAC_CATEGORIES = 3
export const MAX_PETIT_BAC_CATEGORIES = 10

export const petitBacCategoryCountSchema = z
  .number()
  .int()
  .min(MIN_PETIT_BAC_CATEGORIES)
  .max(MAX_PETIT_BAC_CATEGORIES)

export const petitBacCategoryIndexSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_PETIT_BAC_CATEGORIES - 1)

/** One word, or a name of a few: *Bouilloire*, *Brigitte Bardot*. */
export const PETIT_BAC_ANSWER_MAX_LENGTH = 60

export const petitBacAnswerSchema = z.string().max(PETIT_BAC_ANSWER_MAX_LENGTH)

/**
 * How long the other sheets stay open once a full one calls stop: the word a
 * hand is still finishing lands, and every screen counts it down.
 */
export const PETIT_BAC_STOP_GRACE_MS = 5_000

/**
 * Where a category is in the round. Every category is `open` while sheets are
 * written and they close together; then the room votes on them one at a time,
 * so at most one is `voting`.
 */
export const petitBacCategoryStateSchema = z.enum(['open', 'voting', 'settled'])

/**
 * What became of one line of a sheet: accepted and nobody else's, accepted and
 * shared, refused by the room, not starting with the round's letter, or blank.
 */
export const petitBacLineOutcomeSchema = z.enum([
  'unique',
  'shared',
  'refused',
  'offLetter',
  'empty'
])

/**
 * One answer of the category being voted, every spelling of it together: the
 * seats that wrote it and how many of the seats able to vote refused it.
 */
export const petitBacRowSchema = z.object({
  authors: z.array(playerIdSchema).min(1),
  refusals: z.number().int().min(0),
  text: z.string().min(1).max(PETIT_BAC_ANSWER_MAX_LENGTH)
})

export type PetitBacLetter = (typeof petitBacLetters)[number]
export type PetitBacBankCategory = z.infer<typeof petitBacBankCategorySchema>
export type PetitBacCategory = z.infer<typeof petitBacCategorySchema>
export type PetitBacCategoryState = z.infer<typeof petitBacCategoryStateSchema>
export type PetitBacLineOutcome = z.infer<typeof petitBacLineOutcomeSchema>
export type PetitBacRow = z.infer<typeof petitBacRowSchema>
