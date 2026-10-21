import type { MatchsticksSettings } from '@melee/protocol/game'
import type { StickMove } from '@melee/protocol/matchsticks'
import type { MoveVerdict } from '@melee/protocol/scoring'

import { pickRandom } from '@melee/core/helpers/random'
import { dealPuzzle } from '@melee/core/matchsticks/deal'
import { placesFromBestOf } from '@melee/core/matchsticks/move-pay'
import { applyMove } from '@melee/core/matchsticks/one-move'

import type { Round } from '@/domain/room/room'

type MatchsticksContent = Extract<Round['content'], { kind: 'matchsticks' }>

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
}): MatchsticksContent | null => {
  const goal = pickRandom(game.goals)

  if (goal === null) {
    return null
  }

  const dealt = dealPuzzle({
    goal,
    isPlayed: (glyphs) => playedIds.has(playedPuzzleId(glyphs))
  })

  return dealt === null ? null : { kind: 'matchsticks', moves: [], ...dealt }
}

/**
 * What a move sent for this round made of the puzzle and what it is worth, or
 * `null` for a move the sticks cannot make.
 */
export const gradeMove = ({
  content,
  move
}: {
  content: MatchsticksContent
  move: StickMove
}): { made: string; verdict: MoveVerdict } | null => {
  const made = applyMove({ glyphs: content.puzzle.glyphs, move })

  return made === null
    ? null
    : {
        made,
        verdict: {
          kind: 'move',
          placesFromBest: placesFromBestOf({ made, puzzle: content.puzzle })
        }
      }
}
