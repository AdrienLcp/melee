import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import type { PublicPlayer } from '@melee/protocol/room'
import type { Team, TeamId } from '@melee/protocol/team'

import { Button } from '@/presentation/components/button'
import { MoveIcon } from '@/presentation/components/icons'
import { Leaflet } from '@/presentation/components/leaflet'
import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './team-leaflet.sass'

type MoveSeatProps = {
  onMove: (teamId: TeamId) => void
  player: PublicPlayer
  teams: readonly Team[]
}

/**
 * A press on a seat's chip that opens the teams it could go to, each named and
 * in its colour — a menu rather than a drag, because the console may be a
 * phone in one hand and a drag across a wall is a reach nobody makes.
 */
export const MoveSeat: React.FC<MoveSeatProps> = ({
  onMove,
  player,
  teams
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const label = translate('team.move.label', { nickname: player.nickname })
  const elsewhere = teams.filter((team) => !team.seatIds.includes(player.id))

  return (
    <DialogTrigger>
      <Button
        aria-label={label}
        className='team-press'
        size='small'
        variant='outlined'
      >
        <MoveIcon />
      </Button>
      <Leaflet aria-label={label} className='team-leaflet' placement='bottom'>
        {({ close }) => (
          <ul className='team-leaflet-choices'>
            {elsewhere.map((team) => (
              <li key={team.id}>
                <Button
                  onPress={() => {
                    onMove(team.id)
                    close()
                  }}
                  variant='outlined'
                >
                  <Pawn colour={team.colour} />
                  {translate('team.move.to', { team: teamName(team) })}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Leaflet>
    </DialogTrigger>
  )
}
