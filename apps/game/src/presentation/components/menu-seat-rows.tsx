import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Disclosure } from './disclosure'
import { QrCodeIcon } from './icons'
import { MenuPawn } from './menu-pawn'
import { RoomInvitation } from './room-invitation'
import { SeatNameForm } from './seat-name-form'

/**
 * The name this screen is playing under. A device that has played before never
 * passes through the join form, so what that form used to show has to live
 * somewhere on every screen at every phase — and the row carries the name
 * itself, which leaves the panel for the rarer half of the job.
 */
const SeatName: React.FC = () => {
  const { rename, seatNickname } = useRoomActions()
  const translate = useTranslate()

  if (rename === null || seatNickname === null) {
    return null
  }

  return (
    <Disclosure
      className='seat-name'
      label={translate('menu.nickname.label')}
      summary={seatNickname}
    >
      <SeatNameForm />
    </Disclosure>
  )
}

/**
 * The menu's rows for a screen in a room: the square that invites, the seat's
 * name and its pawn. A chunk of the menu's own, because a page with no room
 * draws none of them, and the pawn picker and the square were two thirds of
 * what the menu made every front door download.
 */
export const MenuSeatRows: React.FC = () => {
  const { closeRoom, invitation } = useRoomActions()
  const translate = useTranslate()
  const runsTheRoom = closeRoom !== null

  return (
    <>
      {/*
        Unfolded on a player's screen, where passing the square along a row of
        seats is what it is for. Folded on the console, whose stage carries a
        square already: what the row adds there is the link to copy or send.
      */}
      {invitation !== null &&
        (runsTheRoom ? (
          <Disclosure
            className='invitation-row'
            icon={<QrCodeIcon />}
            label={translate('invite.action')}
            summary={invitation}
          >
            <RoomInvitation roomCode={invitation} />
          </Disclosure>
        ) : (
          <RoomInvitation roomCode={invitation} />
        ))}

      <SeatName />

      <MenuPawn />
    </>
  )
}
