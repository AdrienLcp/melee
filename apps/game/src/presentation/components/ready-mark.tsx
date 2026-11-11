import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { CheckIcon } from './icons'
import { VisuallyHidden } from './visually-hidden'

import './ready-mark.sass'

type ReadyMarkProps = {
  /**
   * Whether the seat says it is back at the table. The mark stays mounted
   * either way, so it can fold away when the seat takes it back rather than
   * vanish.
   */
  isReady: boolean
}

/**
 * A seat back at the table between two rounds, beside its name on whatever
 * board the room is reading. Never counted: ready is not a gate, so nobody is
 * owed a total.
 */
export const ReadyMark: React.FC<ReadyMarkProps> = ({ isReady }) => {
  const translate = useTranslate()

  return (
    <span className='ready-mark' data-ready={isReady || undefined}>
      <CheckIcon aria-hidden />
      {isReady && (
        <VisuallyHidden elementType='span'>{` (${translate('player.back')})`}</VisuallyHidden>
      )}
    </span>
  )
}
