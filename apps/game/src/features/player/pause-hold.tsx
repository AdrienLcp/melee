import type React from 'react'

import { NoticeCard } from '@/presentation/components/notice-card'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './pause-hold.sass'

/**
 * The round kept under the paused card rather than swapped out for it: a
 * typed guess, a timeline half put in order or a pawn on the map is the
 * player's own, and the pause has to hand it back. The card is drawn in front
 * of the round as its sibling, never around it, so every layout rule and fit
 * that reads the round as the page's own child still does.
 */
export const PauseHold: React.FC<{
  children: React.ReactNode
  isPaused: boolean
}> = ({ children, isPaused }) => {
  const translate = useTranslate()

  return (
    <>
      {isPaused && (
        <section className='player-round notice paused'>
          <NoticeCard
            detail={translate('room.pause.detail')}
            title={translate('room.pause.title')}
          />
        </section>
      )}
      {children}
    </>
  )
}
