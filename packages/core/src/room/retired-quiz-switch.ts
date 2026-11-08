import type { Difficulty } from '@melee/protocol/difficulty'

const LEVEL_THE_SWITCH_PLAYED: Difficulty = 'easy'

const isQuizStoredWithTheSwitchOn = (
  stored: Record<string, unknown>
): boolean =>
  stored.kind === 'quiz' &&
  stored.wellKnownOnly === true &&
  !Object.hasOwn(stored, 'difficulty')

/**
 * Stored JSON with every quiz that ticked `wellKnownOnly` — the switch the
 * difficulty replaced — read at the level it played, so a host's setup, a
 * saved evening or a file another machine wrote keeps holding the bank to the
 * questions a room has heard of. A quiz with the switch off needs nothing: it
 * parses onto the default level.
 */
export const withQuizSwitchAsLevel = (stored: unknown): unknown => {
  if (Array.isArray(stored)) {
    return stored.map(withQuizSwitchAsLevel)
  }

  if (typeof stored !== 'object' || stored === null) {
    return stored
  }

  const record: Record<string, unknown> = Object.fromEntries(
    Object.entries(stored)
  )

  if (isQuizStoredWithTheSwitchOn(record)) {
    return {
      ...Object.fromEntries(
        Object.entries(record).filter(([key]) => key !== 'wellKnownOnly')
      ),
      difficulty: LEVEL_THE_SWITCH_PLAYED
    }
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      withQuizSwitchAsLevel(value)
    ])
  )
}
