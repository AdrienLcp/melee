import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { canPlayByTeam } from '@melee/core/team/team-turn'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

const BY_TEAM = 'byTeam'
const TOGETHER = 'together'

/** Whether the next round may be played team by team, read off the room as it stands. */
export const offersTurns = (view: HostRoomView): boolean =>
  canPlayByTeam({
    game: view.settings.game?.kind ?? null,
    mode: view.settings.mode.kind,
    teamCount: view.teams.length
  })

/** What the press opening the next round asks for: the host's wish, where the room can grant it. */
export const byTeamFor = ({
  prefersByTeam,
  view
}: {
  prefersByTeam: boolean
  view: HostRoomView
}): boolean => prefersByTeam && offersTurns(view)

type TurnsChoiceProps = {
  isDisabled: boolean
  onChange: (prefersByTeam: boolean) => void
  prefersByTeam: boolean
  view: HostRoomView
}

/**
 * Everyone at once or team by team, beside the press that opens the next
 * round — and nothing at all where a round cannot be one team's, because an
 * option that would be refused is not one.
 */
export const TurnsChoice: React.FC<TurnsChoiceProps> = ({
  isDisabled,
  onChange,
  prefersByTeam,
  view
}) => {
  const translate = useTranslate()

  if (!offersTurns(view)) {
    return null
  }

  return (
    <SegmentedControl
      className='turns-choice'
      isDisabled={isDisabled}
      label={translate('host.turns.label')}
      onChange={(value) => onChange(value === BY_TEAM)}
      options={[
        { label: translate('host.turns.together'), value: TOGETHER },
        { label: translate('host.turns.byTeam'), value: BY_TEAM }
      ]}
      value={prefersByTeam ? BY_TEAM : TOGETHER}
    />
  )
}
