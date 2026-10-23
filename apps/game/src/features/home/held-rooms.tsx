import { hostPathFor, playPathFor } from '@/infrastructure/router/navigation'
import { ArrowIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useHeldRooms } from './use-held-rooms'

import './held-rooms.sass'

/**
 * The way back. A console that closed its tab still holds the token that
 * always wins a claim, and a player who reloaded still holds their seat — what
 * neither had was a lock to put the key in.
 *
 * It is offered **to the device that holds the key** and to nobody else, which
 * is what lets the console's door stay URL-only: a public list of open rooms
 * would hand a stranger not a seat but the console. One pill a room, under the
 * code box, because a room has one fact — its code — and the words beside it
 * say which door the press opens.
 */
export const HeldRooms: React.FC<{
  /** Set while the page is already opening a room, which is where it is about to go. */
  isDisabled: boolean
}> = ({ isDisabled }) => {
  const rooms = useHeldRooms()
  const translate = useTranslate()

  if (rooms.length === 0) {
    return null
  }

  return (
    <nav aria-label={translate('home.heldRooms.title')} className='held-rooms'>
      {rooms.map(({ role, roomCode }) => (
        <Link
          className='held-room'
          href={role === 'host' ? hostPathFor(roomCode) : playPathFor(roomCode)}
          isDisabled={isDisabled}
          key={roomCode}
          size='small'
          variant='outlined'
        >
          <span className='code'>{roomCode}</span>
          <span className='door'>
            {translate(
              role === 'host' ? 'home.heldRooms.host' : 'home.heldRooms.player'
            )}
          </span>
          <ArrowIcon />
        </Link>
      ))}
    </nav>
  )
}
