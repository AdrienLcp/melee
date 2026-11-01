import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { trackPawnsOf } from '@melee/core/board/track-pawns'

import { Button } from '@/presentation/components/button'
import { TrackStrip } from '@/presentation/components/track-strip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useOpenBoardSetup } from './board-setup-landing'

import './board-preview.sass'

type BoardPreviewProps = {
  /** The whole track is drawn round the page already, so the strip is left out. */
  isBoardAround: boolean
  view: HostRoomView
}

/**
 * The race the game is played for, every pawn on the start before it begins,
 * so a board laid is seen before the first round rather than discovered at
 * its reveal. On a console it is also the way to the board's own control, laid
 * or not: the whole box presses through to it.
 */
export const BoardPreview: React.FC<BoardPreviewProps> = ({
  isBoardAround,
  view
}) => {
  const translate = useTranslate()
  const openBoardSetup = useOpenBoardSetup()
  const board = view.settings.board
  const strip =
    board.kind === 'track' && !isBoardAround ? (
      <TrackStrip
        length={board.length}
        pawns={trackPawnsOf(view)}
        yours={undefined}
      />
    ) : null

  if (strip === null && openBoardSetup === null) {
    return null
  }

  return (
    <section
      className='board-preview'
      data-entry={openBoardSetup !== null || undefined}
    >
      <div className='board-head'>
        <h2>{translate('board.setting.label')}</h2>
        {openBoardSetup !== null && (
          <Button
            aria-label={translate('board.setting.changeLabel')}
            className='board-entry'
            onPress={openBoardSetup}
            size='small'
            variant='underlined'
          >
            {translate('board.setting.change')}
          </Button>
        )}
      </div>
      {strip ?? (
        <p className='board-value'>
          {board.kind === 'track'
            ? translate('board.setting.length', { length: board.length })
            : translate('board.none')}
        </p>
      )}
    </section>
  )
}
