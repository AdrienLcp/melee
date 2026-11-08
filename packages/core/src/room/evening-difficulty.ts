import type { Difficulty } from '@melee/protocol/difficulty'
import type { GameSettings } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

/** The level an entry deals at, or `null` for a game that deals no content to level. */
export const difficultyOf = (entry: GameSettings): Difficulty | null =>
  'difficulty' in entry ? entry.difficulty : null

const levelledEntriesOf = (lineUp: readonly GameSettings[]): Difficulty[] =>
  lineUp.flatMap((entry) => {
    const difficulty = difficultyOf(entry)

    return difficulty === null ? [] : [difficulty]
  })

/**
 * Below two levelled entries the evening's level is that one game's, set on
 * its own page, and a second control for it would only repeat the first.
 */
export const hasEveningDifficulty = (
  lineUp: readonly GameSettings[]
): boolean => levelledEntriesOf(lineUp).length >= 2

/**
 * What the evening's level reads: the one every levelled entry deals at, or
 * `custom` once two differ. Derived rather than stored, so no room value and
 * no game value can disagree about which one wins. `null` while the evening
 * has no level to show (`hasEveningDifficulty`).
 */
export const eveningDifficultyOf = (
  lineUp: readonly GameSettings[]
): Difficulty | 'custom' | null => {
  if (!hasEveningDifficulty(lineUp)) {
    return null
  }

  const [first, ...others] = levelledEntriesOf(lineUp)

  return others.every((difficulty) => difficulty === first)
    ? (first ?? null)
    : 'custom'
}

const atDifficulty = ({
  difficulty,
  entry
}: {
  difficulty: Difficulty
  entry: GameSettings
}): GameSettings => ('difficulty' in entry ? { ...entry, difficulty } : entry)

/**
 * The settings with every levelled entry of the line-up at `difficulty`. The
 * next round's game is written too: the server copies it back over its entry
 * on every frame, so an entry changed without it would snap back.
 */
export const withEveningDifficulty = ({
  difficulty,
  settings
}: {
  difficulty: Difficulty
  settings: RoomSettings
}): RoomSettings => ({
  ...settings,
  game:
    settings.game === null
      ? null
      : atDifficulty({ difficulty, entry: settings.game }),
  lineUp: settings.lineUp.map((entry) => atDifficulty({ difficulty, entry }))
})

/**
 * An entry joining the line-up at the level the evening shows, so a host who
 * set the whole evening to easy does not find the next game added on hard.
 * One the evening shows none for — custom, or too few to say — joins as it
 * came.
 */
export const joiningAtEveningDifficulty = ({
  joining,
  lineUp
}: {
  joining: GameSettings
  lineUp: readonly GameSettings[]
}): GameSettings => {
  const shown = eveningDifficultyOf(lineUp)

  return shown === null || shown === 'custom'
    ? joining
    : atDifficulty({ difficulty: shown, entry: joining })
}
