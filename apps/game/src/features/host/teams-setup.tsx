import type React from 'react'

import type { RoomSettings } from '@melee/protocol/room'
import { MAX_TEAMS, MIN_TEAMS, type TeamsSettings } from '@melee/protocol/team'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { NumberChoice } from './number-choice'

import './teams-setup.sass'

const TEAMS_KINDS = ['off', 'drawn', 'chosen', 'teamsOnly'] as const

type TeamsKind = (typeof TEAMS_KINDS)[number]

const TEAM_COUNTS = Array.from(
  { length: MAX_TEAMS - MIN_TEAMS + 1 },
  (_, offset) => MIN_TEAMS + offset
)

/** The count a room turning teams on starts from: twelve at a table split three ways. */
const FIRST_TEAM_COUNT = 3

type TeamsSetupProps = {
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  settings: RoomSettings
}

const teamsOfKind = (
  kind: TeamsKind,
  current: TeamsSettings
): TeamsSettings => {
  const count =
    current.kind === 'drawn' || current.kind === 'chosen'
      ? current.count
      : FIRST_TEAM_COUNT

  switch (kind) {
    case 'off':
    case 'teamsOnly':
      return { kind }
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
  isDisabled,
  onChange,
  settings
}) => {
  const translate = useTranslate()
  const teams = settings.teams

  return (
    <div className='teams-setup'>
      <SegmentedControl
        className='teams-kind'
        isDisabled={isDisabled}
        label={translate('team.setting.label')}
        onChange={(next) => {
          const kind = TEAMS_KINDS.find((candidate) => candidate === next)

          if (kind !== undefined) {
            onChange({ ...settings, teams: teamsOfKind(kind, teams) })
          }
        }}
        options={TEAMS_KINDS.map((kind) => ({
          label: translate(`team.setting.${kind}`),
          value: kind
        }))}
        value={teams.kind}
      />
      {(teams.kind === 'drawn' || teams.kind === 'chosen') && (
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
      {teams.kind === 'teamsOnly' && (
        <p className='hint'>{translate('team.setting.teamsOnlyHint')}</p>
      )}
    </div>
  )
}
