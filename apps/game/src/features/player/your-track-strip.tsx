import type React from 'react'

import type { PlayerRoomView } from '@melee/protocol/room'

import { type TrackPawn, trackPawnsOf } from '@melee/core/board/track-pawns'

import { TrackStrip } from '@/presentation/components/track-strip'

const isPlayersPawn = ({
  pawn,
  view
}: {
  pawn: TrackPawn
  view: PlayerRoomView
}): boolean =>
  pawn.kind === 'seat'
    ? pawn.id === view.youId
    : pawn.team.seatIds.includes(view.youId)

/**
 * The track around this player's pawn — their team's, or their own — and
 * nothing while the board is off or the pawn not dealt yet.
 */
export const YourTrackStrip: React.FC<{ view: PlayerRoomView }> = ({
  view
}) => {
  const { board } = view.settings
  const pawns = trackPawnsOf(view)
  const yours = pawns.find((pawn) => isPlayersPawn({ pawn, view }))

  if (board.kind !== 'track' || yours === undefined) {
    return null
  }

  return <TrackStrip length={board.length} pawns={pawns} yours={yours} />
}
