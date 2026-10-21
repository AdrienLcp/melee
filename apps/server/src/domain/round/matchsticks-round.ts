import type { MatchsticksSettings } from '@melee/protocol/game'

import { pickRandom } from '@melee/core/helpers/random'
import { dealPuzzle } from '@melee/core/matchsticks/deal'

import type { Round } from '@/domain/room/room'

/** How a dealt puzzle is remembered among the room's played content, beside track and question ids. */
export const playedPuzzleId = (glyphs: string): string =>
  `matchsticks:${glyphs}`

/**
 * A puzzle the room has not seen, on one of the goals the host ticked, or
 * `null` once the deal finds nothing new.
 */
export const matchsticksContent = ({
  game,
  playedIds
}: {
  game: MatchsticksSettings
  playedIds: ReadonlySet<string>
}): Extract<Round['content'], { kind: 'matchsticks' }> | null => {
  const goal = pickRandom(game.goals)

  if (goal === null) {
    return null
  }

  const dealt = dealPuzzle({
    goal,
    isPlayed: (glyphs) => playedIds.has(playedPuzzleId(glyphs))
  })

  return dealt === null ? null : { kind: 'matchsticks', ...dealt }
}
