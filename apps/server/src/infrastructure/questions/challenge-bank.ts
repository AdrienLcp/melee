import { z } from 'zod'

import {
  type ChallengeCategory,
  challengeCategorySchema,
  challengeLabelsSchema
} from '@melee/protocol/challenge'

import { dealLine } from '@melee/core/challenge/deal-line'

import bank from './challenge-bank.json' with { type: 'json' }

/**
 * Written by hand, in both languages at once: a line a living room can play in
 * under two minutes, by anyone — seated included — with nothing bought and
 * nothing broken, and judged by who finished first rather than by taste.
 */
const bankedChallengeLineSchema = z.object({
  category: challengeCategorySchema,
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  labels: challengeLabelsSchema
})

export type BankedChallengeLine = z.infer<typeof bankedChallengeLineSchema>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly BankedChallengeLine[] | null = null

export const bankedChallengeLines = (): readonly BankedChallengeLine[] => {
  parsed ??= z.array(bankedChallengeLineSchema).parse(bank)

  return parsed
}

export const playedChallengeLineId = (id: string): string => `challenge:${id}`

/** A line the room has not been dealt, varied from the last one; `null` once the bank is spent. */
export const drawChallengeLine = ({
  avoidCategory,
  hasFestiveLines,
  playedIds
}: {
  avoidCategory: ChallengeCategory | null
  hasFestiveLines: boolean
  playedIds: ReadonlySet<string>
}): BankedChallengeLine | null => {
  const lines = bankedChallengeLines()

  return dealLine({
    avoidCategory,
    hasFestiveLines,
    lines,
    playedIds: new Set(
      lines
        .filter(({ id }) => playedIds.has(playedChallengeLineId(id)))
        .map(({ id }) => id)
    )
  })
}
