import type React from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import { Button } from '@/presentation/components/button'
import { ArrowIcon } from '@/presentation/components/icons'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { CreateRoom } from './use-create-room'

import './host-door.sass'

type HostDoorProps = {
  /** The home page's one room opener, shared with every lid. */
  createRoom: CreateRoom
  /** The games ticked on the shelf, which the door opens a table on. */
  ticked: readonly ShelvedGame[]
}

/**
 * The host's door, as the shelf's foot: a table on the games ticked above it,
 * counted on the press, or an empty lobby that chooses while the others join
 * when none is. It sits under the shelf it acts on and is held to the bottom
 * of the screen while the shelf is on it, so the count it prints is never out
 * of sight of the ticks that make it.
 *
 * It asks nothing — the screen that opens a room is not a player, and a host
 * who plays takes a seat in the lobby, by name, like everyone else.
 */
export const HostDoor: React.FC<HostDoorProps> = ({ createRoom, ticked }) => {
  const translate = useTranslate()
  const { isOpeningAny, isOpeningLobby, openLobby, refusal, refusedDoor } =
    createRoom

  return (
    <div className='host-door'>
      <div className='door-band'>
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
        <RefusalNote
          message={
            refusal !== null && refusedDoor === 'lobby'
              ? translate(refusal)
              : null
          }
        />
      </div>
    </div>
  )
}
