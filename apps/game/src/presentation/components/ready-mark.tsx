import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { CheckIcon } from './icons'
import { VisuallyHidden } from './visually-hidden'

import './ready-mark.sass'

/**
 * A seat back at the table between two rounds, beside its name on whatever
 * board the room is reading. Never counted: ready is not a gate, so nobody is
 * owed a total.
 */
export const ReadyMark: React.FC = () => {
  const translate = useTranslate()

  return (
    <span className='ready-mark'>
      <CheckIcon aria-hidden />
      <VisuallyHidden elementType='span'>{` (${translate('player.back')})`}</VisuallyHidden>
    </span>
  )
}
