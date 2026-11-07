import type { BoardPosition } from '@melee/protocol/board'

import { shownPoints } from '@/helpers/shown-points'

import { useTranslate } from './i18n-provider'

/**
 * What a seat or a team prints for where it stands: its case when its pawn is
 * on a track, its points otherwise — never both, because a room plays for one
 * or the other and two figures ranking the same people would disagree.
 */
export const useStandingOf = (): ((standing: {
  board: BoardPosition | null
  score: number
}) => string) => {
  const translate = useTranslate()

  return ({ board, score }) =>
    board === null
      ? translate('player.score', { points: shownPoints(score) })
      : translate('board.at', { case: board.case })
}
