import { z } from 'zod'

import type { QuestionLanguage } from '@melee/protocol/question'
import { questionLanguageSchema } from '@melee/protocol/question'
import { thinkAlikePromptSchema } from '@melee/protocol/think-alike'

import { pickRandom } from '@melee/core/helpers/random'

import bank from './think-alike-bank.json' with { type: 'json' }

/**
 * Written by hand, in both languages at once: a prompt with an obvious answer
 * and a few runners-up, so a table of eight splits five, two and one. A prompt
 * every seat answers alike, or one nobody shares an answer to, is a dead round.
 */
/** A language gains its prompts before it joins the question languages. */
const inQuestionLanguagesOnly = (labels: unknown): unknown =>
  typeof labels === 'object' && labels !== null
    ? Object.fromEntries(
        Object.entries(labels).filter(
          ([language]) => questionLanguageSchema.safeParse(language).success
        )
      )
    : labels

const bankedThinkAlikePromptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  labels: z.preprocess(
    inQuestionLanguagesOnly,
    z.record(questionLanguageSchema, thinkAlikePromptSchema)
  )
})

export type BankedThinkAlikePrompt = z.infer<
  typeof bankedThinkAlikePromptSchema
>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly BankedThinkAlikePrompt[] | null = null

export const bankedThinkAlikePrompts =
  (): readonly BankedThinkAlikePrompt[] => {
    parsed ??= z.array(bankedThinkAlikePromptSchema).parse(bank)

    return parsed
  }

export const playedThinkAlikePromptId = (id: string): string =>
  `thinkalike:${id}`

/**
 * A prompt the room has not been dealt, worded in the room's language, or any
 * prompt once the bank is spent: a prompt heard again splits a table again,
 * where a quiz question heard again is its answer.
 */
export const drawThinkAlikePrompt = ({
  language,
  playedIds
}: {
  language: QuestionLanguage
  playedIds: ReadonlySet<string>
}): { playedId: string; prompt: string } | null => {
  const prompts = bankedThinkAlikePrompts()
  const drawn =
    pickRandom(
      prompts.filter(({ id }) => !playedIds.has(playedThinkAlikePromptId(id)))
    ) ?? pickRandom(prompts)

  return drawn === null
    ? null
    : {
        playedId: playedThinkAlikePromptId(drawn.id),
        prompt: drawn.labels[language]
      }
}
