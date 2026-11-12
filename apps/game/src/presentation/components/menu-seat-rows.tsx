import type React from 'react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Button } from './button'
import { Disclosure } from './disclosure'
import { QrCodeIcon } from './icons'
import { MenuPawn } from './menu-pawn'
import { RoomInvitation } from './room-invitation'
import { TextField } from './text-field'

/**
 * The name this screen is playing under. A device that has played before never
 * passes through the join form, so what that form used to show has to live
 * somewhere on every screen at every phase — and the row carries the name
 * itself, which leaves the panel for the rarer half of the job.
 */
const SeatName: React.FC = () => {
  const { refusedNickname, rename, seatNickname } = useRoomActions()
  const translate = useTranslate()
  const [draft, setDraft] = useState<string | null>(null)

  if (rename === null || seatNickname === null) {
    return null
  }

  // Empty rather than filled with the name the row above already carries. A
  // prefilled field printed it twice in four lines, and editing two characters
  // of your own name is not what changing it means.
  const value = draft ?? ''
  const next = value.trim()
  // The refusal belongs to the name it was given for, so any other draft
  // submits again — a controlled `isInvalid` outliving its reason leaves the
  // field's native validity false and the press a silent no-op.
  const isRefused = next === refusedNickname

  return (
    <Disclosure
      className='seat-name'
      label={translate('menu.nickname.label')}
      summary={seatNickname}
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          rename(next)
        }}
      >
        <TextField
          autoComplete='nickname'
          enterKeyHint='done'
          errorMessage={
            isRefused
              ? translate(protocolErrorKey('nickname_taken'))
              : undefined
          }
          isInvalid={isRefused}
          label={translate('menu.nickname.field')}
          maxLength={NICKNAME_MAX_LENGTH}
          name='nickname'
          onChange={setDraft}
          value={value}
        />
        {/*
          `small`, and beside the field rather than under the width of the
          popover: a 52px block here is the same shape as the exit below it, and
          changing a label is not a peer of leaving the room.
        */}
        <Button
          isDisabled={next.length === 0 || next === seatNickname}
          size='small'
          type='submit'
          variant='outlined'
        >
          {translate('menu.nickname.action')}
        </Button>
      </Form>
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
