import type React from 'react'

import { MIN_TEAMS, type TeamsSettings } from '@melee/protocol/team'

import { teamCountOf } from '@melee/core/team/team-count'

import { NumberField } from '@/presentation/components/number-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type TeamCountFieldProps = {
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
