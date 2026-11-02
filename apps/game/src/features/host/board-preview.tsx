import type React from 'react'
import { useState } from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { trackPawnsOf } from '@melee/core/board/track-pawns'

import { TrackStrip } from '@/presentation/components/track-strip'

import './board-preview.sass'

type BoardPreviewProps = {
  /** The whole track is drawn round the page already, so the strip is left out. */
  isBoardAround: boolean
  view: HostRoomView
}

/**
 * The race the game is played for, every pawn on the start before it begins,
 * so a board laid is seen before the first round rather than discovered at
 * its reveal. The track alone: it is changed in the setup, like everything else.
 */
export const BoardPreview: React.FC<BoardPreviewProps> = ({
  isBoardAround,
  view
}) => {
  const board = view.settings.board
  const isShown = board.kind === 'track' && !isBoardAround
  const [wasShownAtFirstDraw] = useState(isShown)
  const [hasBoardChanged, setHasBoardChanged] = useState(false)

  if (!hasBoardChanged && isShown !== wasShownAtFirstDraw) {
    setHasBoardChanged(true)
  }

  if (board.kind !== 'track' || isBoardAround) {
    return null
  }

  return (
    <div className='board-preview' data-changed={hasBoardChanged || undefined}>
      <TrackStrip
        length={board.length}
        pawns={trackPawnsOf(view)}
        yours={undefined}
      />
    </div>
  )
}
