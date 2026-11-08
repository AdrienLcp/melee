import { z } from 'zod'

import { difficultySchema } from './difficulty'

/**
 * The subjects a host ticks. The fold from a source's own rubrics onto these is
 * coarse on purpose: a handful of chips fit a phone, and a room choosing between
 * twenty-eight is a room reading a menu instead of playing.
 *
 * The list is also the draw's odds dial, because a category is drawn before a
 * question is — so splitting one in two doubles what it is drawn for. `cinema`
 * left `arts` for exactly that reason: it was the only chip whose name did not
 * say what ticking it would give, holding films, television, animation and
 * video games beside music, books and painting, and half the bank with them.
 * `videogames` left on the same argument and took the single biggest block in
 * the bank with it.
 *
 * `quotes` is the one chip that names a way of asking rather than a subject — a
 * line from a film, a series, a video game, an ad or a real person, and the
 * room names where it comes from. It is not folded into `cinema` because a
 * table asks for it by name, and a room that ticks it alone is playing a
 * different game from one that ticks cinema. `flags` is another: a flag on
 * every screen, and the room names whose it is. `rebus` the third: a title
 * written in emojis. `capitals` the fourth: the room names a country's capital.
 * `silhouettes` the fifth: a country's outline alone, and the room names it.
 */
export const questionCategories = [
  'history',
  'geography',
  'flags',
  'capitals',
  'silhouettes',
  'science',
  'arts',
  'cinema',
  'quotes',
  'rebus',
  'videogames',
  'sport',
  'everyday'
] as const

export const questionCategorySchema = z.enum(questionCategories)

/**
 * What the room is trying to answer. Only ever on the wire inside a host-only
 * message, or inside the round's reveal — the same rule the track identity
 * lives under, and enforced the same way.
 *
 * The decoys are authored per question rather than drawn from the pool. A blind
 * test can borrow three other tracks and they are all plausible; "1789" is not
 * a plausible wrong answer to which river runs through Paris, and a quiz whose
 * odd one out gives the answer away is not a quiz.
 */
export const questionSchema = z.object({
  /** Other spellings a typed answer may take. The matcher folds case and accents already. */
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  category: questionCategorySchema,
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().min(1),
  /**
   * What the room is told once the answer is public — where the beach in the
   * film actually is, why the record stood for forty years. It travels with the
   * answer and never before it, which is why it lives here rather than on the
   * prompt.
   */
  note: z.string().nullable()
})

/**
 * A flag the app serves under `/flags/`, named after its own content so the
 * name a player is sent says nothing of the country. The shape is a file name
 * and nothing else, so a frame can never point a screen at another address.
 */
export const flagFileSchema = z.string().regex(/^[0-9a-f]{12}\.svg$/)

/**
 * A country's outline the app serves under `/silhouettes/`, named after its
 * own content for the flag's reason.
 */
export const silhouetteFileSchema = z.string().regex(/^[0-9a-f]{12}\.svg$/)

/** The half a player may see: the question without any of its answers. */
export const questionPromptSchema = z.object({
  category: questionCategorySchema,
  /** The flag the question is about, drawn beside the prompt; `null` on every other question. */
  flag: flagFileSchema.nullable(),
  id: z.string().min(1),
  prompt: z.string().min(1),
  /**
   * The title written in emojis, drawn large above the prompt; `null` on every
   * other question. Its own field rather than part of the prompt, because the
   * prompt is the sentence asking what to name and this is the thing to read.
   */
  rebus: z.string().min(1).max(64).nullable(),
  /** The country outline the question is about, drawn beside the prompt; `null` on every other question. */
  silhouette: silhouetteFileSchema.nullable()
})

/**
 * What becomes public at the reveal, and not a moment before — the mirror of
 * the blind test's `revealedTrack`. The note travels with the answer rather
 * than beside it, because it gives the answer away.
 */
export const revealedQuestionSchema = z.object({
  answer: z.string().min(1),
  note: z.string().nullable()
})

export const hostQuestionSchema = questionPromptSchema.extend(
  questionSchema.shape
)

/**
 * The language the questions are drawn in — a property of the room, never of
 * the reader. The interface locale is stored per device, so two players in one
 * room can hold different ones, and dealing each of them a question from their
 * own would not be one game.
 */
export const questionLanguages = ['en', 'fr'] as const

export const questionLanguageSchema = z.enum(questionLanguages)

/**
 * What any game drawing from the bank has to choose — the three things the bank
 * is asked, not a shape a game's settings are expected to share. The quiz keeps
 * its own duration beside these, and a game that wants the bank on different
 * terms takes what it needs rather than widening this.
 */
export const questionDrawSettingsSchema = z.object({
  /** Empty means every category, the same way an empty genre list means every genre. */
  categories: z.array(questionCategorySchema),
  /**
   * Which tiers of the bank are dealt. Defaulted so a setup stored before the
   * level replaced the `wellKnownOnly` switch still parses; a switch that was
   * on is read as `easy` by the storage that kept it.
   *
   * The tier is drawn *before* the category, so `easy` deals an easy question
   * whenever one is left in any ticked subject, rather than falling through
   * inside whichever subject the draw happened to land on.
   */
  difficulty: difficultySchema.default('mixed'),
  language: questionLanguageSchema
})

export type QuestionDrawSettings = z.infer<typeof questionDrawSettingsSchema>

export type QuestionCategory = z.infer<typeof questionCategorySchema>
export type Question = z.infer<typeof questionSchema>
export type FlagFile = z.infer<typeof flagFileSchema>
export type SilhouetteFile = z.infer<typeof silhouetteFileSchema>
export type QuestionPrompt = z.infer<typeof questionPromptSchema>
export type RevealedQuestion = z.infer<typeof revealedQuestionSchema>
export type HostQuestion = z.infer<typeof hostQuestionSchema>
export type QuestionLanguage = z.infer<typeof questionLanguageSchema>
