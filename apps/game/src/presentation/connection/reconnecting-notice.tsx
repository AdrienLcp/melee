import type React from 'react'

import {
  ConnectionDot,
  connectionStatusKey
} from '@/presentation/components/connection-status'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './reconnecting-notice.sass'

/**
 * Why the page went quiet under the hand: the one line that says the screen
 * is on its way back while `Main` stands its controls down.
 */
export const ReconnectingNotice: React.FC = () => {
  const translate = useTranslate()
  const status = useConnection()?.status

  return (
    <p className='reconnecting-notice' role='status'>
      {(status === 'connecting' || status === 'closed') && (
        <>
          <ConnectionDot status={status} />
          {translate(connectionStatusKey(status))}
        </>
      )}
    </p>
  )
}
