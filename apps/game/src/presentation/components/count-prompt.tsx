import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './count-prompt.sass'

type CountPromptProps = {
  /** A player's screen, where the press is the larger thing and the card sits above it. */
  isCompact?: boolean
  targetSeconds: number
}

/**
 * The whole of an inner clock round's question, on a card under the game's
 * band: *count to 77 seconds in your head*. It never changes while the room
 * counts, which is the point — nothing on it may move.
 */
export const CountPrompt: React.FC<CountPromptProps> = ({
  isCompact = false,
  targetSeconds
}) => {
  const translate = useTranslate()

  return (
    <p className='count-prompt' data-compact={isCompact || undefined}>
      <span className='before'>{translate('innerclock.prompt.before')}</span>
      <span className='target'>{targetSeconds}</span>
      <span className='after'>{translate('innerclock.prompt.after')}</span>
    </p>
  )
}
