import type React from 'react'
import { VisuallyHidden } from 'react-aria-components'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { OfflineIcon } from './icons'

import './away-mark.sass'

type AwayMarkProps = {
  /**
   * Whether the seat's screen has gone. The mark stays mounted either way, so
   * it can fold away when the screen comes back rather than vanish.
   */
  isAway: boolean
}

/**
 * A seat whose screen has gone, beside its name on whatever list the room is
 * reading: a crossed-out signal, and the word for a screen reader alone. The
 * word took a row of its own on a seat narrowed by a full table.
 */
export const AwayMark: React.FC<AwayMarkProps> = ({ isAway }) => {
  const translate = useTranslate()

  return (
    <span className='away-mark' data-away={isAway || undefined}>
      <OfflineIcon aria-hidden />
      {isAway && (
        <VisuallyHidden elementType='span'>{` (${translate('player.away')})`}</VisuallyHidden>
      )}
    </span>
  )
}
