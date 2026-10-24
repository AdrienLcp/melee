import { z } from 'zod'

import { challengeLabelsSchema } from '@melee/protocol/challenge'

import { dealLine } from '@melee/core/challenge/deal-line'
import { fillLetterSlot } from '@melee/core/challenge/letter-slot'

import bank from './challenge-bank.json' with { type: 'json' }

/**
 * Written by hand, in both languages at once: one object to bring back, found
 * in a home as in an office, by anyone — seated included — with nothing bought
 * and nothing broken, and judged by who is back first rather than by taste.
 * Several seats doing something out loud at once is noise the host cannot
 * place, so every line is a fetch.
 */
const bankedChallengeLineSchema = z.object({
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

/** A line the room has not been dealt, its letter drawn; `null` once the bank is spent. */
export const drawChallengeLine = (
  playedIds: ReadonlySet<string>
): BankedChallengeLine | null => {
  const lines = bankedChallengeLines()
  const line = dealLine({
    lines,
    playedIds: new Set(
      lines
        .filter(({ id }) => playedIds.has(playedChallengeLineId(id)))
        .map(({ id }) => id)
    )
  })

  return line === null
    ? null
    : { id: line.id, labels: fillLetterSlot({ labels: line.labels }) }
}
