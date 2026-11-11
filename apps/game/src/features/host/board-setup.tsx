import type React from 'react'
import { useState } from 'react'

import {
  type BoardSettings,
  boardStrategySchema,
  DEFAULT_BOARD_LENGTH,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS,
  MAX_BOARD_LENGTH,
  MIN_BOARD_LENGTH,
  type TrackSettings
} from '@melee/protocol/board'
import type { RoomSettings } from '@melee/protocol/room'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { NO_LIMIT, NumberChoice } from './number-choice'

import './board-setup.sass'

/** The strip's first segment: no track, the room plays for points. */
const ON_POINTS = NO_LIMIT

/**
 * A quick game, the usual evening and a marathon: by points, a round's leader
 * walks some four cases, so about three rounds, ten and twenty-five.
 */
const BOARD_LENGTHS = [
  ON_POINTS,
  MIN_BOARD_LENGTH,
  DEFAULT_BOARD_LENGTH,
  MAX_BOARD_LENGTH
] as const

/** The strip's lengths, with a track laid at another length kept selectable. */
const boardLengthsWith = (board: BoardSettings): number[] =>
  board.kind === 'track' && !BOARD_LENGTHS.some((n) => n === board.length)
    ? [...BOARD_LENGTHS, board.length].toSorted((a, b) => a - b)
    : [...BOARD_LENGTHS]

type BoardSetupProps = {
  /** The socket is closed, or the game runs and the server refuses a new track. */
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  settings: RoomSettings
}

/**
 * What the room plays for — points, or pawns raced round a track, never both —
 * how long the track is and how they walk it: one strip from *Points* to the
 * longest track, whatever the teams — without them every seat walks a pawn. A
 * new length keeps the track's rules.
 */
export const BoardSetup: React.FC<BoardSetupProps> = ({
  isDisabled,
  onChange,
  settings
}) => {
  const translate = useTranslate()
  const board = settings.board
  const lengths = boardLengthsWith(board)
  const pawns = settings.teams.kind === 'off' ? 'seats' : 'teams'
  const isOnTrack = board.kind === 'track'
  const [lastTrack, setLastTrack] = useState(
    isOnTrack ? board : DEFAULT_TRACK_SETTINGS
  )

  if (isOnTrack && board !== lastTrack) {
    setLastTrack(board)
  }

  const track = isOnTrack ? board : lastTrack

  const changeTrack = (track: TrackSettings) => {
    onChange({ ...settings, board: track })
  }

  return (
    <div className='board-setup'>
      <NumberChoice
        className={
          lengths.length > BOARD_LENGTHS.length
            ? 'board-length off-list'
            : 'board-length'
        }
        description={translate(
          `board.setting.hint.${board.kind === 'track' ? pawns : 'points'}`
        )}
        isDisabled={isDisabled}
        label={translate('board.setting.label')}
        onChange={(length) => {
          if (length === ON_POINTS) {
            onChange({ ...settings, board: DEFAULT_BOARD_SETTINGS })
          } else {
            changeTrack({
              ...(board.kind === 'track' ? board : DEFAULT_TRACK_SETTINGS),
              length
            })
          }
        }}
        optionLabel={(length) =>
          length === ON_POINTS
            ? translate('board.setting.points')
            : String(length)
        }
        optionMark={(length) =>
          length === ON_POINTS ? undefined : translate('board.setting.unit')
        }
        options={lengths}
        value={board.kind === 'track' ? board.length : ON_POINTS}
      />
      <div
        className='track-rules'
        data-open={isOnTrack || undefined}
        inert={!isOnTrack}
      >
        <div className='rules'>
          <SegmentedControl
            className='board-strategy'
            description={translate(
              `board.setting.strategy.hint.${track.strategy}`
            )}
            isDisabled={isDisabled}
            label={translate('board.setting.strategy.label')}
            onChange={(next) => {
              const strategy = boardStrategySchema.safeParse(next)

              if (strategy.success) {
                changeTrack({ ...track, strategy: strategy.data })
              }
            }}
            options={boardStrategySchema.options.map((strategy) => ({
              label: translate(`board.setting.strategy.${strategy}`),
              value: strategy
            }))}
            value={track.strategy}
          />
          <Switch
            description={translate('board.setting.catchUp.hint')}
            isDisabled={isDisabled}
            isSelected={track.catchUp}
            label={translate('board.setting.catchUp.label')}
            onChange={(catchUp) => {
              changeTrack({ ...track, catchUp })
            }}
          />
        </div>
      </div>
    </div>
  )
}
