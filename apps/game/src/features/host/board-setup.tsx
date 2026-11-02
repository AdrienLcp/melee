import type React from 'react'

import {
  type BoardSettings,
  boardStrategySchema,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS,
  type TrackSettings
} from '@melee/protocol/board'
import type { RoomSettings } from '@melee/protocol/room'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useBoardSetupLanding } from './board-setup-landing'
import { NO_LIMIT, NumberChoice } from './number-choice'
import { useArrivedLater } from './use-arrived-later'

import './board-setup.sass'

const NO_BOARD = NO_LIMIT

const BOARD_LENGTHS = [NO_BOARD, 20, 40, 60, 80, 100] as const

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
 * Whether the room races pawns round a track, how long it is and how they
 * walk it: one strip from *None* to the longest track, whatever the teams —
 * without them every seat walks a pawn. A new length keeps the track's rules.
 */
export const BoardSetup: React.FC<BoardSetupProps> = ({
  isDisabled,
  onChange,
  settings
}) => {
  const translate = useTranslate()
  const landingRef = useBoardSetupLanding()
  const board = settings.board
  const lengths = boardLengthsWith(board)
  const pawns = settings.teams.kind === 'off' ? 'seats' : 'teams'
  const trackRulesArrived = useArrivedLater(board.kind === 'track')

  const changeTrack = (track: TrackSettings) => {
    onChange({ ...settings, board: track })
  }

  return (
    <div className='board-setup' ref={landingRef}>
      <NumberChoice
        className={
          lengths.length > BOARD_LENGTHS.length
            ? 'board-length off-list'
            : 'board-length'
        }
        description={translate(
          `board.setting.hint.${board.kind === 'track' ? pawns : 'off'}`
        )}
        isDisabled={isDisabled}
        label={translate('board.setting.label')}
        onChange={(length) => {
          if (length === NO_BOARD) {
            onChange({ ...settings, board: DEFAULT_BOARD_SETTINGS })
          } else {
            changeTrack({
              ...(board.kind === 'track' ? board : DEFAULT_TRACK_SETTINGS),
              length
            })
          }
        }}
        optionLabel={(length) =>
          length === NO_BOARD ? translate('board.setting.off') : String(length)
        }
        optionMark={(length) =>
          length === NO_BOARD ? undefined : translate('board.setting.unit')
        }
        options={lengths}
        value={board.kind === 'track' ? board.length : NO_BOARD}
      />
      {board.kind === 'track' && (
        <div className='track-rules' data-arrived={trackRulesArrived}>
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
