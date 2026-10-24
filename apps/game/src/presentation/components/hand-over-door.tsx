import { QRCodeSVG } from 'qrcode.react'
import type React from 'react'

import type { RoomCode } from '@melee/protocol/identifiers'

import { handOverUrlFor } from '@/infrastructure/router/navigation'
import { readHostToken } from '@/infrastructure/storage/session-storage'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { CopyButton } from './copy-button'
import { Disclosure } from './disclosure'
import { QrCodeIcon } from './icons'

import './hand-over-door.sass'

type HandOverDoorProps = {
  /** Called as the square is shown, so the claim it leads to makes this screen the wall. */
  onOpen: () => void
  roomCode: RoomCode
}

/**
 * The console, moved to whichever screen scans the square, and this one turned
 * into the room's: the setup where the machine wired to the television opened
 * the table and the host would rather hold the controls in a hand.
 *
 * Folded, because the square carries the room's token and this menu often opens
 * on that television: unfolded only on purpose, it is read over the host's
 * shoulder for as long as they hold it open and no longer. The address is never
 * printed, for the same reason — it is copied, not read.
 */
export const HandOverDoor: React.FC<HandOverDoorProps> = ({
  onOpen,
  roomCode
}) => {
  const translate = useTranslate()
  const hostToken = readHostToken(roomCode)

  // A console that took the room on the grace window alone never learned the
  // token, and has nothing to hand over.
  if (hostToken === null) {
    return null
  }

  const url = handOverUrlFor({ hostToken, roomCode })

  return (
    <Disclosure
      className='hand-over-door'
      icon={<QrCodeIcon />}
      label={translate('wall.menu.handOver.label')}
      onExpandedChange={(isExpanded) => {
        if (isExpanded) {
          onOpen()
        }
      }}
      summary={translate('wall.menu.handOver.summary')}
    >
      <div className='qr-card'>
        {/* Hidden for the reason the invitation's square is: the copy button
            under it is the way through for anyone who cannot scan. */}
        <QRCodeSVG
          aria-hidden='true'
          bgColor='transparent'
          fgColor='currentColor'
          marginSize={0}
          size={256}
          value={url}
        />
      </div>
      <p className='hint'>{translate('wall.menu.handOver.hint')}</p>
      <CopyButton label='invite.copyLink' value={url} />
    </Disclosure>
  )
}
