import { writeStoredJson } from '@adrienlcp/safe-storage'
import { z } from 'zod'

import { challengeTextSchema } from '@melee/protocol/challenge'

import { readStoredWithSchema } from './read-stored-with-schema'

export const OWN_CHALLENGE_LINES_KEY = 'melee:challenge-lines'

/** As many as a long evening plays, and a bound on what a page can be asked to draw. */
export const OWN_CHALLENGE_LINES_MAX = 60

export const ownChallengeLineSchema = z.object({
  isPlayed: z.boolean(),
  text: challengeTextSchema.min(1)
})

export type OwnChallengeLine = z.infer<typeof ownChallengeLineSchema>

const ownChallengeLinesSchema = z
  .array(ownChallengeLineSchema)
  .max(OWN_CHALLENGE_LINES_MAX)

/**
 * The challenge lines the host wrote before the evening, kept on their machine
 * beside their setup — written the day before as often as at the table — and
 * never sent anywhere until a round opens on one. Unreadable reads as none.
 */
export const readOwnChallengeLines = (): OwnChallengeLine[] => {
  const stored = readStoredWithSchema({
    key: OWN_CHALLENGE_LINES_KEY,
    schema: ownChallengeLinesSchema
  })

  return stored.status === 'success' ? (stored.data ?? []) : []
}

export const writeOwnChallengeLines = (
  lines: readonly OwnChallengeLine[]
): void => {
  writeStoredJson({ key: OWN_CHALLENGE_LINES_KEY, value: lines })
}
