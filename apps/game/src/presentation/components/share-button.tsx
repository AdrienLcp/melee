import type React from 'react'

import { canShareLinks, shareLink } from '@/infrastructure/browser'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { ShareIcon } from './icons'

type ShareButtonProps = {
  /** What the share sheet offers to send with the link. */
  title: string
  url: string
}

/**
 * The device's own share sheet — WhatsApp, SMS, mail — on the link. Drawn only
 * where there is one, which is most phones and few laptops. A sheet put away
 * says nothing back, because nothing was sent and nothing went wrong.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({ title, url }) => {
  const translate = useTranslate()

  if (!canShareLinks()) {
    return null
  }

  return (
    <Button
      onPress={() => {
        void shareLink({ title, url })
      }}
      size='small'
      variant='outlined'
    >
      <ShareIcon />
      {translate('invite.share')}
    </Button>
  )
}
