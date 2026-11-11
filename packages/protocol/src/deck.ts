import { z } from 'zod'

import { CHALLENGE_TEXT_MAX_LENGTH } from './challenge'
import { MOST_LIKELY_LINE_MAX_LENGTH } from './most-likely'
import { questionCategorySchema } from './question'
import { LINE_UP_MAX_ENTRIES } from './room'

/** The most questions one quiz deck holds: each carries its answer and three decoys, and the link is copied by hand. */
export const QUIZ_DECK_MAX_ITEMS = 30

/** The most lines a challenge or most likely deck holds — as many as a long evening plays. */
export const LINE_DECK_MAX_ITEMS = 60

export const QUIZ_DECK_PROMPT_MAX_LENGTH = 240
export const QUIZ_DECK_ANSWER_MAX_LENGTH = 100
export const QUIZ_DECK_NOTE_MAX_LENGTH = 300
export const QUIZ_DECK_ACCEPTED_MAX = 10

const answerTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(QUIZ_DECK_ANSWER_MAX_LENGTH)

/**
 * One question an evening brings, written by its host or an assistant: the
 * bank row's shape without the bank's bookkeeping. It travels in the link and
 * in `host.setDecks`, and the server deals it as a `HostQuestion`, so nothing
 * here ever reaches a player before its reveal.
 */
export const quizDeckItemSchema = z.object({
  /** Other spellings a typed answer may take; case and accents are folded already. */
  accepted: z.array(answerTextSchema).max(QUIZ_DECK_ACCEPTED_MAX).default([]),
  answer: answerTextSchema,
  /** The chip shown above the prompt, and `null` for none — a quiz about the family is no subject of the bank's. */
  category: questionCategorySchema.nullable().default(null),
  /**
   * Whether the prompt only makes sense beside its own three decoys — _which
   * of these drives on the left?_ A `typed` room skips it.
   */
  choiceOnly: z.boolean().default(false),
  decoys: z.tuple([answerTextSchema, answerTextSchema, answerTextSchema]),
  /** Told to the room once the answer is public, and never before. */
  note: z
    .string()
    .trim()
    .min(1)
    .max(QUIZ_DECK_NOTE_MAX_LENGTH)
    .nullable()
    .default(null),
  prompt: z.string().trim().min(1).max(QUIZ_DECK_PROMPT_MAX_LENGTH)
})

export type QuizDeckItem = z.infer<typeof quizDeckItemSchema>

/**
 * Content an evening brings for one line-up entry, by the entry's game. Every
 * item is dealt before the game's own bank, which takes over once the deck is
 * spent. Never part of the settings: those ride every snapshot to every
 * screen, and a deck is held by the server alone.
 */
export const deckSchema = z.discriminatedUnion('game', [
  z.object({
    game: z.literal('quiz'),
    items: z.array(quizDeckItemSchema).min(1).max(QUIZ_DECK_MAX_ITEMS)
  }),
  /** What the table is challenged to do, one line a round, read off the wall as written. */
  z.object({
    game: z.literal('challenge'),
    items: z
      .array(z.string().trim().min(1).max(CHALLENGE_TEXT_MAX_LENGTH))
      .min(1)
      .max(LINE_DECK_MAX_ITEMS)
  }),
  /**
   * _Who among us is most likely to…_, one line a round. A line names
   * somebody at the table, which is why it waits on the server until dealt.
   */
  z.object({
    game: z.literal('mostlikely'),
    items: z
      .array(z.string().trim().min(1).max(MOST_LIKELY_LINE_MAX_LENGTH))
      .min(1)
      .max(LINE_DECK_MAX_ITEMS)
  })
])

export type Deck = z.infer<typeof deckSchema>

/**
 * One deck per line-up entry, by index, `null` where an entry brings none; an
 * entry past the end brings none either, so an empty list is no deck at all.
 */
export const decksSchema = z
  .array(deckSchema.nullable())
  .max(LINE_UP_MAX_ENTRIES)
  .default([])
