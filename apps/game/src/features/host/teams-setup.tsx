import type React from 'react'
import { useState } from 'react'

import type { RoomSettings } from '@melee/protocol/room'
import { MAX_TEAMS, MIN_TEAMS, type TeamsSettings } from '@melee/protocol/team'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { fittedToAloud } from '@melee/core/room/line-up'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { NumberChoice } from './number-choice'

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
              settings: { ...settings, teams: chosen }
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
      {teams.kind === 'teamsOnly' && (
        <p className='hint'>{translate('team.setting.teamsOnlyHint')}</p>
      )}
    </div>
  )
}
