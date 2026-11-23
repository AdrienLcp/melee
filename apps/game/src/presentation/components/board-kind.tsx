import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'

import type { BoardSettings } from '@melee/protocol/board'

const [BoardContext, , useOptionalBoard] =
  createSafeContext<BoardSettings>('BoardKindProvider')

/**
 * What the room plays for, for every round figure drawn under a stage: a
 * podium, a grid, a tally deep in a game's reveal reads it here rather than
 * through every component between it and the view.
 */
export const BoardKindProvider: React.FC<{
  /** The room's board setting. */
  board: BoardSettings
  children: React.ReactNode
}> = ({ board, children }) => (
  <BoardContext value={board}>{children}</BoardContext>
)

/**
 * Whether the room races pawns on a track, where no point is printed — the
 * pawns and their cases are the whole standing. Points outside a provider.
 */
export const usePlaysOnTrack = (): boolean =>
  useOptionalBoard()?.kind === 'track'

/** The track's length, which says which case is the finish; `null` on points or outside a provider. */
export const useTrackLength = (): number | null => {
  const board = useOptionalBoard()

  return board?.kind === 'track' ? board.length : null
}
