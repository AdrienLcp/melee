import type React from 'react'
import { useState } from 'react'

import type { OpeningRefusal } from '@melee/protocol/room'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { NoticeCard } from './notice-card'

import './opening-refusal-notice.sass'

type OpeningRefusalNoticeProps = {
  /** Why the round the room was waiting for did not open; `null` when it did. */
  refusal: OpeningRefusal | null
}

/**
 * Why nothing opened when the table was ready: said on every screen, where a
 * countdown run out on nothing used to be the only answer. Kept mounted, and
 * it keeps the reason it gave while it folds away.
 */
export const OpeningRefusalNotice: React.FC<OpeningRefusalNoticeProps> = ({
  refusal
}) => {
  const translate = useTranslate()
  const [lastRefusal, setLastRefusal] = useState(refusal)

  if (refusal !== null && refusal !== lastRefusal) {
    setLastRefusal(refusal)
  }

  const drawn = refusal ?? lastRefusal

  return (
    <div
      className='opening-refusal'
      data-open={refusal !== null || undefined}
      inert={refusal === null}
    >
      <div>
        {drawn !== null && (
          <NoticeCard
            detail={translate(`room.openingRefused.${drawn}`)}
            title={translate('room.openingRefused.title')}
          />
        )}
      </div>
    </div>
  )
}
