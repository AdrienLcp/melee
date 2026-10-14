import { QRCodeSVG } from 'qrcode.react'
import type React from 'react'
import {
  Dialog,
  DialogTrigger,
  Popover,
  Button as ReactAriaButton
} from 'react-aria-components'

import type { RoomCode } from '@taverla/protocol/identifiers'

import { playUrlFor } from '@/infrastructure/router/navigation'
import { RoomInvitation } from '@/presentation/components/room-invitation'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './invite-piece.sass'

type InvitePieceProps = {
  roomCode: RoomCode
}

/**
 * The way in, on the one console screen that has no room for `JoinReminder`:
 * a seated host's four tiles. A piece with the square in miniature and the
 * code under its name, and one press opens the whole invitation beside it — a
 * popover rather than a dialog, so the round goes on underneath and a press
 * anywhere else, or Escape, puts it away.
 *
 * react-aria's primitives rather than the design system's `Button`: the piece
 * carries a square and two lines, not a label.
 */
export const InvitePiece: React.FC<InvitePieceProps> = ({ roomCode }) => {
  const translate = useTranslate()

  return (
    <DialogTrigger>
      <ReactAriaButton className='invite-piece'>
        <QRCodeSVG
          aria-hidden='true'
          bgColor='transparent'
          fgColor='currentColor'
          marginSize={0}
          size={64}
          value={playUrlFor(roomCode)}
        />
        <span className='words'>
          <span className='label'>{translate('invite.action')}</span>{' '}
          <span className='code'>{roomCode}</span>
        </span>
      </ReactAriaButton>
      <Popover className='invite-popover' placement='bottom end'>
        <Dialog aria-label={translate('invite.title')}>
          <RoomInvitation roomCode={roomCode} />
          <p className='next-round'>{translate('invite.nextRound')}</p>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
