import type React from 'react'

import type { PlayerRoomView } from '@melee/protocol/room'

import { trackLeadOf } from '@melee/core/board/track-lead'
import { type TrackPawn, trackPawnsOf } from '@melee/core/board/track-pawns'

import { useTrackPawnName } from '@/presentation/components/track-pawn'
import { TrackStrip } from '@/presentation/components/track-strip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './your-track-strip.sass'

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

type YourTrackStripProps = {
  /**
   * Draw the whole race when no wall does (default: `false`): every case,
   * opened on this pawn, with how far the front is.
   */
  isWholeWithoutWall?: boolean
  view: PlayerRoomView
}

/**
 * The track around this player's pawn — their team's, or their own — and
 * nothing while the board is off or the pawn not dealt yet.
 */
export const YourTrackStrip: React.FC<YourTrackStripProps> = ({
  isWholeWithoutWall = false,
  view
}) => {
  const { board } = view.settings
  const pawns = trackPawnsOf(view)
  const yours = pawns.find((pawn) => isPlayersPawn({ pawn, view }))

  if (board.kind !== 'track' || yours === undefined) {
    return null
  }

  const isWhole = isWholeWithoutWall && !view.isWallConnected

  return (
    <TrackStrip
      length={board.length}
      pawns={pawns}
      reach={isWhole ? 'whole' : 'around'}
      yours={yours}
    >
      {isWhole && <TrackLeadLine pawns={pawns} yours={yours} />}
    </TrackStrip>
  )
}

const TrackLeadLine: React.FC<{
  pawns: readonly TrackPawn[]
  yours: TrackPawn
}> = ({ pawns, yours }) => {
  const translate = useTranslate()
  const pawnName = useTrackPawnName()
  const lead = trackLeadOf({ pawns, yours })

  if (lead === null) {
    return null
  }

  return (
    <p className='track-lead'>
      {lead.kind === 'ahead'
        ? translate('board.lead.ahead', { gap: lead.gap })
        : lead.kind === 'level'
          ? translate('board.lead.level')
          : translate('board.lead.behind', {
              gap: lead.gap,
              leader: pawnName(lead.leader)
            })}
    </p>
  )
}
