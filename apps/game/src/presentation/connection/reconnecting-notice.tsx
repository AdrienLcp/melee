import type React from 'react'
import { useState } from 'react'

import type { SocketStatus } from '@/infrastructure/messaging/use-room-socket'
import {
  ConnectionDot,
  connectionStatusKey
} from '@/presentation/components/connection-status'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './reconnecting-notice.sass'

type ShownStatus = Extract<SocketStatus, 'closed' | 'connecting'>

const isShownStatus = (
  status: SocketStatus | undefined
): status is ShownStatus => status === 'connecting' || status === 'closed'

/**
 * Why the page went quiet under the hand: the one line that says the screen
 * is on its way back while `Main` stands its controls down. It stays in the
 * tree and `data-shown` opens it, so it can fade out on the line it last said
 * once the screen is back.
 */
export const ReconnectingNotice: React.FC = () => {
  const translate = useTranslate()
  const status = useConnection()?.status
  const [lastShown, setLastShown] = useState<ShownStatus>('connecting')

  if (isShownStatus(status) && status !== lastShown) {
    setLastShown(status)
  }

  const isShown = isShownStatus(status)
  const said = isShown ? status : lastShown

  return (
    <p
      className='reconnecting-notice'
      data-shown={isShown || undefined}
      role='status'
    >
      <ConnectionDot status={said} />
      {translate(connectionStatusKey(said))}
    </p>
  )
}
