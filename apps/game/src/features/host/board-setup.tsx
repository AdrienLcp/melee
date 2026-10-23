import type React from 'react'

import {
  boardStrategySchema,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS,
  type TrackSettings
} from '@melee/protocol/board'
import type { RoomSettings } from '@melee/protocol/room'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { NumberChoice } from './number-choice'

import './board-setup.sass'

const BOARD_LENGTHS = [20, 30, 40] as const

/** The strip's lengths, with a track laid at another length kept selectable. */
const boardLengthsWith = (board: TrackSettings): number[] =>
  BOARD_LENGTHS.some((n) => n === board.length)
    ? [...BOARD_LENGTHS]
    : [...BOARD_LENGTHS, board.length].toSorted((a, b) => a - b)

type BoardSetupProps = {
  /** The socket is closed, or the game runs and the server refuses a new track. */
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  settings: RoomSettings
}

/**
 * Whether the room races pawns round a track, and how they walk it. Its own
 * switch, whatever the teams: without them every seat walks a pawn.
 */
export const BoardSetup: React.FC<BoardSetupProps> = ({
  isDisabled,
  onChange,
  settings
}) => {
  const translate = useTranslate()
  const board = settings.board
  const pawns = settings.teams.kind === 'off' ? 'seats' : 'teams'

  const changeTrack = (track: TrackSettings) => {
    onChange({ ...settings, board: track })
  }

  return (
    <div className='board-setup'>
      <Switch
        description={translate(
          `board.setting.hint.${board.kind === 'track' ? pawns : 'off'}`
        )}
        isDisabled={isDisabled}
        isSelected={board.kind === 'track'}
        label={translate('board.setting.label')}
        onChange={(isOn) => {
          onChange({
            ...settings,
            board: isOn ? DEFAULT_TRACK_SETTINGS : DEFAULT_BOARD_SETTINGS
          })
        }}
      />
      {board.kind === 'track' && (
        <div className='track-rules'>
          <NumberChoice
            className='board-length'
            isDisabled={isDisabled}
            label={translate('board.setting.lengthLabel')}
            onChange={(length) => {
              changeTrack({ ...board, length })
            }}
            optionLabel={(length) =>
              translate('board.setting.length', { length })
            }
            options={boardLengthsWith(board)}
            value={board.length}
          />
          <SegmentedControl
            className='board-strategy'
            description={translate(
              `board.setting.strategy.hint.${board.strategy}`
            )}
            isDisabled={isDisabled}
            label={translate('board.setting.strategy.label')}
            onChange={(next) => {
              const strategy = boardStrategySchema.safeParse(next)

              if (strategy.success) {
                changeTrack({ ...board, strategy: strategy.data })
              }
            }}
            options={boardStrategySchema.options.map((strategy) => ({
              label: translate(`board.setting.strategy.${strategy}`),
              value: strategy
            }))}
            value={board.strategy}
          />
          <Switch
            description={translate('board.setting.catchUp.hint')}
            isDisabled={isDisabled}
            isSelected={board.catchUp}
            label={translate('board.setting.catchUp.label')}
            onChange={(catchUp) => {
              changeTrack({ ...board, catchUp })
            }}
          />
        </div>
      )}
    </div>
  )
}
