import { z } from 'zod'

import { mostLikelyLabelsSchema } from '@melee/protocol/most-likely'

import { pickRandom } from '@melee/core/helpers/random'

import bank from './most-likely-bank.json' with { type: 'json' }

/**
 * Written by hand, in both languages at once: about a person, never a moment —
 * no meal, no evening, no relationship between the seats — and kind, so a
 * grandmother and a twelve-year-old laugh at the same line. French lines say
 * *qui a le plus de chances de*, with nothing agreeing with the seat voted for.
 */
const bankedMostLikelyLineSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  labels: mostLikelyLabelsSchema
})

export type BankedMostLikelyLine = z.infer<typeof bankedMostLikelyLineSchema>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly BankedMostLikelyLine[] | null = null

export const bankedMostLikelyLines = (): readonly BankedMostLikelyLine[] => {
  parsed ??= z.array(bankedMostLikelyLineSchema).parse(bank)

  return parsed
}

export const playedMostLikelyLineId = (id: string): string => `mostlikely:${id}`

/**
 * A line the room has not been dealt, or any line once the bank is spent: a
 * line heard again is still a line about the people at the table, where a
 * quiz question heard again is its answer.
 */
export const drawMostLikelyLine = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): BankedMostLikelyLine | null => {
  const lines = bankedMostLikelyLines()

  return (
    pickRandom(
      lines.filter(({ id }) => !playedIds.has(playedMostLikelyLineId(id)))
    ) ?? pickRandom(lines)
  )
}
