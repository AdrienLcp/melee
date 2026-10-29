import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { OfflineIcon } from './icons'

import './away-mark.sass'

/**
 * A seat whose screen has gone, beside its name on whatever list the room is
 * reading. A tag of its own rather than a word after the name, because a
 * muted word set after a name reads as the end of it.
 */
export const AwayMark: React.FC = () => {
  const translate = useTranslate()

  return (
    <span className='away-mark'>
      <OfflineIcon />
      {translate('player.away')}
    </span>
  )
}
