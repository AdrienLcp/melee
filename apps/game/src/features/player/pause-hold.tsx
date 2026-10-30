import type React from 'react'

import { NoticeCard } from '@/presentation/components/notice-card'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './pause-hold.sass'

/**
 * The round kept under the paused card rather than swapped out for it: a
 * typed guess, a timeline half put in order or a pawn on the map is the
 * player's own, and the pause has to hand it back. Hidden and inert while it
 * holds, so nothing of the question can be read, pressed or announced.
 */
export const PauseHold: React.FC<{
  children: React.ReactNode
  isPaused: boolean
}> = ({ children, isPaused }) => {
  const translate = useTranslate()

  return (
    <>
      {isPaused && (
        <section className='player-round notice'>
          <NoticeCard
            detail={translate('room.pause.detail')}
            title={translate('room.pause.title')}
          />
        </section>
      )}
      <div className='pause-hold' hidden={isPaused} inert={isPaused}>
        {children}
      </div>
    </>
  )
}
