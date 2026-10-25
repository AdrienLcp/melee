import type React from 'react'
import { useState } from 'react'

import type { RoomSettings } from '@melee/protocol/room'
import {
  MAX_TEAMS,
  type TeamScoring,
  type TeamsSettings
} from '@melee/protocol/team'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { fittedToAloud } from '@melee/core/room/line-up'
import { fittedToTeams } from '@melee/core/room/room-settings'
import { mostTeamsFor } from '@melee/core/team/team-count'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { TeamCountField } from './team-count-field'

import './teams-setup.sass'

const TEAMS_KINDS = ['off', 'drawn', 'chosen', 'aloud'] as const

const TEAM_SCORING_CHOICES = [
  'balanced',
  'sum'
] as const satisfies TeamScoring[]

type TeamsKind = (typeof TEAMS_KINDS)[number]

/**
 * The most teams the host is offered: the room's ceiling for teams answering
 * aloud, which hold no seats, and only what the seats can fill otherwise —
 * under `MIN_TEAMS`, so no count at all, below the smallest table for teams.
 */
export const mostTeamsOffered = ({
  seatCount,
  teams
}: {
  seatCount: number
  teams: TeamsSettings
}): number => {
  switch (teams.kind) {
    case 'off':
      return 0
    case 'aloud':
      return MAX_TEAMS
    case 'drawn':
    case 'chosen':
      return mostTeamsFor(seatCount)
  }
}

/** The count a room turning teams on starts from: twelve at a table split three ways. */
const FIRST_TEAM_COUNT = 3

type TeamsSetupProps = {
  /** A phone holds a seat, which a table answering aloud has none of. */
  hasPhones: boolean
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, for a game answering aloud moves the room to. */
  preferences: HostPreferences | null
  /** The seats at the table, which bound the counts a table holding seats is offered. */
  seatCount: number
  settings: RoomSettings
}

const teamsOfKind = (
  kind: TeamsKind,
  current: TeamsSettings
): TeamsSettings => {
  const count = current.kind === 'off' ? FIRST_TEAM_COUNT : current.count

  switch (kind) {
    case 'off':
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
  seatCount,
  settings
}) => {
  const { locale, translate } = useI18n()
  const teams = settings.teams
  const [isAloudRefused, setIsAloudRefused] = useState(false)
  const mostTeams = mostTeamsOffered({ seatCount, teams })

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
            fittedToTeams({
              locale,
              settings: fittedToAloud({
                locale,
                rememberedFor: (game) =>
                  rememberedSetupFor({ game, preferences }),
                settings: { ...settings, teams: chosen }
              })
            })
          )
        }}
        options={TEAMS_KINDS.map((kind) => ({
          label: translate(`team.setting.${kind}`),
          value: kind
        }))}
        value={teams.kind}
      />
      {teams.kind !== 'off' && (
        <TeamCountField
          isDisabled={isDisabled}
          mostTeams={mostTeams}
          onChange={(count) => {
            onChange({ ...settings, teams: { ...teams, count } })
          }}
          teams={teams}
        />
      )}
      {(teams.kind === 'drawn' || teams.kind === 'chosen') && (
        <>
          <SegmentedControl
            className='team-scoring'
            isDisabled={isDisabled}
            label={translate('team.scoring.label')}
            onChange={(next) => {
              const teamScoring = TEAM_SCORING_CHOICES.find(
                (candidate) => candidate === next
              )

              if (teamScoring !== undefined) {
                onChange({ ...settings, teamScoring })
              }
            }}
            options={TEAM_SCORING_CHOICES.map((scoring) => ({
              label: translate(`team.scoring.${scoring}`),
              value: scoring
            }))}
            value={settings.teamScoring}
          />
          <p className='hint'>
            {translate(`team.scoring.${settings.teamScoring}Hint`)}
          </p>
        </>
      )}
      {teams.kind === 'aloud' && (
        <p className='hint'>{translate('team.setting.aloudHint')}</p>
      )}
      {isAloudRefused && teams.kind !== 'aloud' && (
        <p className='hint' role='status'>
          {translate('team.setting.aloudNeedsNoPhone')}
        </p>
      )}
    </div>
  )
}
