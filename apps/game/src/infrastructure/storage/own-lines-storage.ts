import { writeStoredJson } from '@adrienlcp/safe-storage'
import { z } from 'zod'

import { CHALLENGE_TEXT_MAX_LENGTH } from '@melee/protocol/challenge'
import { LINE_DECK_MAX_ITEMS, type OwnLinesGame } from '@melee/protocol/deck'
import { MOST_LIKELY_LINE_MAX_LENGTH } from '@melee/protocol/most-likely'

import { readStoredWithSchema } from './read-stored-with-schema'

/** Where each game's own lines are kept; the challenge's key predates the second game. */
export const OWN_LINES_KEYS: Readonly<Record<OwnLinesGame, string>> = {
  challenge: 'melee:challenge-lines',
  mostlikely: 'melee:mostlikely-lines'
}

/** As many as a long evening plays — a line deck's own cap, since they are dealt beside one. */
export const OWN_LINES_MAX = LINE_DECK_MAX_ITEMS

/** The longest line each game reads off the wall. */
export const OWN_LINE_MAX_LENGTH: Readonly<Record<OwnLinesGame, number>> = {
  challenge: CHALLENGE_TEXT_MAX_LENGTH,
  mostlikely: MOST_LIKELY_LINE_MAX_LENGTH
}

/** One own line of a game, refused past what the room would accept for it. */
export const ownLineSchemaOf = (game: OwnLinesGame) =>
  z.object({
    isPlayed: z.boolean(),
    text: z.string().trim().min(1).max(OWN_LINE_MAX_LENGTH[game])
  })

export type OwnLine = z.infer<ReturnType<typeof ownLineSchemaOf>>

/**
 * The lines the host wrote for a game before the evening, kept on their
 * machine beside their setup — written the day before as often as at the
 * table — and sent to the room the console opens, which deals them. A line
 * stays played across evenings. Unreadable reads as none.
 */
export const readOwnLines = (game: OwnLinesGame): OwnLine[] => {
  const stored = readStoredWithSchema({
    key: OWN_LINES_KEYS[game],
    schema: z.array(ownLineSchemaOf(game)).max(OWN_LINES_MAX)
  })

  return stored.status === 'success' ? (stored.data ?? []) : []
}

export const writeOwnLines = ({
  game,
  lines
}: {
  game: OwnLinesGame
  lines: readonly OwnLine[]
}): void => {
  writeStoredJson({ key: OWN_LINES_KEYS[game], value: lines })
}
