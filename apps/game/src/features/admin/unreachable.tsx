import type React from 'react'

import { Button } from '@/presentation/components/button'
import { NoticeCard } from '@/presentation/components/notice-card'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/** The server out of reach before anything was listed. */
export const Unreachable: React.FC<{
  /** Asks again on a press; absent, the view is already asking again on its own. */
  onRetry?: () => void
}> = ({ onRetry }) => {
  const translate = useTranslate()

  return (
    <div className='admin-unreachable'>
      <NoticeCard
        detail={translate(
          onRetry === undefined
            ? 'admin.unreachable.retrying'
            : 'admin.unreachable.detail'
        )}
        title={translate('admin.unreachable.title')}
      />
      {onRetry !== undefined && (
        <Button onPress={onRetry} variant='outlined'>
          {translate('admin.unreachable.retry')}
        </Button>
      )}
    </div>
  )
}
