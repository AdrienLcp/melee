import type React from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import { hostPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useOpenHostedRooms } from '@/presentation/room-actions/use-open-hosted-rooms'

import type { CreateRoom } from './use-create-room'

import './host-door.sass'

type HostDoorProps = {
  /** The home page's one room opener, shared with the boxes and the shelf. */
  createRoom: CreateRoom
  /** The games ticked on the shelf, which the door opens a table on. */
  ticked: readonly ShelvedGame[]
}

/**
 * The host's door, across the masthead from the player's: a table on the games
 * ticked on the shelf, counted on the press, or an empty lobby that chooses
 * while the others join when none is. It asks nothing — the screen
 * that opens a room is not a player, and a host who plays takes a seat in the
 * lobby, by name, like everyone else.
 *
 * Over it, the way back to the last table this device opened, while it is
 * still open. A player needs none: typing the code again finds the seat it
 * already holds. Its line is held while the server is asked, so the press does
 * not jump when the answer lands.
 */
export const HostDoor: React.FC<HostDoorProps> = ({ createRoom, ticked }) => {
  const translate = useTranslate()
  const { isOpeningAny, isOpeningLobby, openLobby, refusal } = createRoom
  const openHosted = useOpenHostedRooms()
  const lastHosted = openHosted?.[0] ?? null

  return (
    <div className='host-door'>
      {lastHosted !== null ? (
        <Link
          className='resume'
          href={hostPathFor(lastHosted)}
          isDisabled={isOpeningAny}
          size='small'
          variant='underlined'
        >
          <span className='label'>
            {translate('home.resume')}{' '}
            <span className='code'>{lastHosted}</span>
          </span>
          <ArrowIcon />
        </Link>
      ) : (
        openHosted === null && <span aria-hidden='true' className='resume' />
      )}

      <Button
        icon={<ArrowIcon />}
        isDisabled={isOpeningAny && !isOpeningLobby}
        isPending={isOpeningLobby}
        onPress={() => {
          void openLobby({ games: ticked })
        }}
        size='large'
      >
        {ticked.length > 0
          ? translate('home.openWith', { count: ticked.length })
          : translate('join.host.action')}
      </Button>
      {refusal !== null && (
        <p className='error' role='alert'>
          {translate(refusal)}
        </p>
      )}
    </div>
  )
}
