import type React from 'react'

import { MIN_TEAMS, type TeamsSettings } from '@melee/protocol/team'

import { teamCountOf } from '@melee/core/team/team-count'

import { NumberField } from '@/presentation/components/number-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type TeamCountFieldProps = {
  /** Marks a field a host's choice just brought in, so it rises rather than appears. */
  isArriving?: true
  isDisabled: boolean
  /** The ceiling of the `+` step; under `MIN_TEAMS`, the field is not drawn at all. */
  mostTeams: number
  onChange: (count: number) => void
  teams: TeamsSettings
}

/**
 * How many teams, one step at a time: a strip would print every count the
 * seats could ever reach, where a step only ever offers the next one.
 */
export const TeamCountField: React.FC<TeamCountFieldProps> = ({
  isArriving,
  isDisabled,
  mostTeams,
  onChange,
  teams
}) => {
  const translate = useTranslate()

  if (teams.kind === 'off' || mostTeams < MIN_TEAMS) {
    return null
  }

  return (
    <NumberField
      className='team-count'
      data-arrived={isArriving}
      isDisabled={isDisabled}
      label={translate('team.count')}
      maxValue={mostTeams}
      minValue={MIN_TEAMS}
      onChange={(count) => {
        if (Number.isInteger(count) && count !== teamCountOf(teams)) {
          onChange(count)
        }
      }}
      value={teamCountOf(teams)}
    />
  )
}
