import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'

import type { BoardSettings } from '@melee/protocol/board'

type BoardKind = BoardSettings['kind']

const [BoardKindContext, , useOptionalBoardKind] =
  createSafeContext<BoardKind>('BoardKindProvider')

/**
 * What the room plays for, for every round figure drawn under a stage: a
 * podium, a grid, a tally deep in a game's reveal reads it here rather than
 * through every component between it and the view.
 */
export const BoardKindProvider: React.FC<{
  /** The room's board setting; only its kind travels. */
  board: BoardSettings
  children: React.ReactNode
}> = ({ board, children }) => (
  <BoardKindContext value={board.kind}>{children}</BoardKindContext>
)

/**
 * Whether the room races pawns on a track, where no point is printed — the
 * pawns and their cases are the whole standing. Points outside a provider.
 */
export const usePlaysOnTrack = (): boolean => useOptionalBoardKind() === 'track'
