import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Disclosure } from './disclosure'
import { PointsRows } from './points-rows'

/**
 * Points by hand, folded to one row of the menu: what a host opens it for
 * mid-round, when a panel tab would take the stage's place on a narrow console.
 */
export const MenuPoints: React.FC = () => {
  const { adjustScore, scoredPlayers, scoredTeams } = useRoomActions()
  const translate = useTranslate()

  if (adjustScore === null || scoredPlayers.length === 0) {
    return null
  }

  return (
    <Disclosure
      label={translate('menu.points.label')}
      summary={
        scoredTeams.length > 0
          ? translate('menu.points.teams', { count: scoredTeams.length })
          : translate('player.roomSize', { count: scoredPlayers.length })
      }
    >
      <PointsRows />
    </Disclosure>
  )
}
