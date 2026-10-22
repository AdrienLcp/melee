import type React from 'react'
import { useState } from 'react'

import {
  type BoardSettings,
  boardStrategySchema,
  DEFAULT_BOARD_SETTINGS,
  DEFAULT_TRACK_SETTINGS,
  type TrackSettings
} from '@melee/protocol/board'
import type { RoomSettings } from '@melee/protocol/room'
import { MAX_TEAMS, MIN_TEAMS, type TeamsSettings } from '@melee/protocol/team'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { fittedToAloud } from '@melee/core/room/line-up'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { Switch } from '@/presentation/components/switch'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { NO_LIMIT, NumberChoice } from './number-choice'

import './teams-setup.sass'

const TEAMS_KINDS = ['off', 'drawn', 'chosen', 'teamsOnly', 'aloud'] as const

type TeamsKind = (typeof TEAMS_KINDS)[number]

/** Every count a room may split into, in order. */
export const TEAM_COUNTS = Array.from(
  { length: MAX_TEAMS - MIN_TEAMS + 1 },
  (_, offset) => MIN_TEAMS + offset
)

/** The count a room turning teams on starts from: twelve at a table split three ways. */
const FIRST_TEAM_COUNT = 3

const BOARD_LENGTHS = [NO_LIMIT, 20, 30, 40] as const

type TeamsSetupProps = {
  /** A phone holds a seat, which a table answering aloud has none of. */
  hasPhones: boolean
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, for a game answering aloud moves the room to. */
  preferences: HostPreferences | null
  settings: RoomSettings
}

const teamsOfKind = (
  kind: TeamsKind,
  current: TeamsSettings
): TeamsSettings => {
  const count =
    current.kind === 'off' || current.kind === 'teamsOnly'
      ? FIRST_TEAM_COUNT
      : current.count

  switch (kind) {
    case 'off':
    case 'teamsOnly':
      return { kind }
    case 'aloud':
    case 'drawn':
    case 'chosen':
      return { count, kind }
  }
}

const playsInTeams = (teams: TeamsSettings): boolean => teams.kind !== 'off'

/**
 * The track follows the teams in and out: a room splitting into teams is an
 * evening raced on a board, and a room with no teams has nobody to walk a
 * pawn. A track already laid survives a change of how the seats are dealt.
 */
const boardFor = ({
  board,
  from,
  to
}: {
  board: BoardSettings
  from: TeamsSettings
  to: TeamsSettings
}): BoardSettings => {
  if (!playsInTeams(to)) {
    return DEFAULT_BOARD_SETTINGS
  }

  return playsInTeams(from) ? board : DEFAULT_TRACK_SETTINGS
}

/** The strip's lengths, with a track laid at another length kept selectable. */
const boardLengthsWith = (board: BoardSettings): number[] =>
  board.kind === 'track' && !BOARD_LENGTHS.some((n) => n === board.length)
    ? [...BOARD_LENGTHS, board.length].toSorted((a, b) => a - b)
    : [...BOARD_LENGTHS]

type BoardRulesProps = {
  board: TrackSettings
  isDisabled: boolean
  onChange: (board: TrackSettings) => void
}

/** How a laid track walks the pawns, locked past the lobby like its length. */
const BoardRules: React.FC<BoardRulesProps> = ({
  board,
  isDisabled,
  onChange
}) => {
  const translate = useTranslate()

  return (
    <>
      <SegmentedControl
        className='board-strategy'
        isDisabled={isDisabled}
        label={translate('board.setting.strategy.label')}
        onChange={(next) => {
          const strategy = boardStrategySchema.safeParse(next)

          if (strategy.success) {
            onChange({ ...board, strategy: strategy.data })
          }
        }}
        options={boardStrategySchema.options.map((strategy) => ({
          label: translate(`board.setting.strategy.${strategy}`),
          value: strategy
        }))}
        value={board.strategy}
      />
      <p className='hint'>
        {translate(`board.setting.strategy.hint.${board.strategy}`)}
      </p>
      <Switch
        description={translate('board.setting.catchUp.hint')}
        isDisabled={isDisabled}
        isSelected={board.catchUp}
        label={translate('board.setting.catchUp.label')}
        onChange={(catchUp) => {
          onChange({ ...board, catchUp })
        }}
      />
    </>
  )
}

/**
 * Whether the room plays in teams and how the seats get into them, set in the
 * lobby beside the roster it reorganises: the server refuses a new count or a
 * new kind once the game runs.
 */
export const TeamsSetup: React.FC<TeamsSetupProps> = ({
  hasPhones,
  isDisabled,
  onChange,
  preferences,
  settings
}) => {
  const { locale, translate } = useI18n()
  const teams = settings.teams
  const [isAloudRefused, setIsAloudRefused] = useState(false)

  return (
    <div className='teams-setup'>
      <SegmentedControl
        className='teams-kind'
        isDisabled={isDisabled}
        label={translate('team.setting.label')}
        onChange={(next) => {
          const kind = TEAMS_KINDS.find((candidate) => candidate === next)

          if (kind === undefined) {
            return
          }

          setIsAloudRefused(kind === 'aloud' && hasPhones)

          if (kind === 'aloud' && hasPhones) {
            return
          }

          const chosen = teamsOfKind(kind, teams)

          onChange(
            fittedToAloud({
              locale,
              rememberedFor: (game) =>
                rememberedSetupFor({ game, preferences }),
              settings: {
                ...settings,
                board: boardFor({
                  board: settings.board,
                  from: teams,
                  to: chosen
                }),
                teams: chosen
              }
            })
          )
        }}
        options={TEAMS_KINDS.map((kind) => ({
          label: translate(`team.setting.${kind}`),
          value: kind
        }))}
        value={teams.kind}
      />
      {teams.kind !== 'off' && teams.kind !== 'teamsOnly' && (
        <NumberChoice
          className='team-count'
          isDisabled={isDisabled}
          label={translate('team.count')}
          onChange={(count) => {
            onChange({ ...settings, teams: { ...teams, count } })
          }}
          optionLabel={String}
          options={TEAM_COUNTS}
          value={teams.count}
        />
      )}
      {teams.kind === 'aloud' && (
        <p className='hint'>{translate('team.setting.aloudHint')}</p>
      )}
      {isAloudRefused && teams.kind !== 'aloud' && (
        <p className='hint' role='status'>
          {translate('team.setting.aloudNeedsNoPhone')}
        </p>
      )}
      {playsInTeams(teams) && (
        <NumberChoice
          className='board-length'
          isDisabled={isDisabled}
          label={translate('board.setting.label')}
          onChange={(length) => {
            onChange({
              ...settings,
              board:
                length === NO_LIMIT
                  ? DEFAULT_BOARD_SETTINGS
                  : {
                      ...(settings.board.kind === 'track'
                        ? settings.board
                        : DEFAULT_TRACK_SETTINGS),
                      length
                    }
            })
          }}
          optionLabel={(length) =>
            length === NO_LIMIT
              ? translate('board.setting.off')
              : translate('board.setting.length', { length })
          }
          options={boardLengthsWith(settings.board)}
          value={
            settings.board.kind === 'track' ? settings.board.length : NO_LIMIT
          }
        />
      )}
      {playsInTeams(teams) && settings.board.kind === 'track' && (
        <BoardRules
          board={settings.board}
          isDisabled={isDisabled}
          onChange={(board) => {
            onChange({ ...settings, board })
          }}
        />
      )}
      {teams.kind === 'teamsOnly' && (
        <p className='hint'>{translate('team.setting.teamsOnlyHint')}</p>
      )}
    </div>
  )
}
