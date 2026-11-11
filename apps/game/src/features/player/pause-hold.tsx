import type React from 'react'
import { useState } from 'react'

import { NoticeCard } from '@/presentation/components/notice-card'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './pause-hold.sass'

/**
 * The round kept under the paused card rather than swapped out for it: a
 * typed guess, a timeline half put in order or a pawn on the map is the
 * player's own, and the pause has to hand it back. The card is drawn in front
 * of the round as its sibling, never around it, so every layout rule and fit
 * that reads the round as the page's own child still does. Lifted, the card
 * fades off over the round come back rather than swapping the screen, which
 * would hold the first press of a race reopening.
 */
export const PauseHold: React.FC<{
  children: React.ReactNode
  isPaused: boolean
}> = ({ children, isPaused }) => {
  const translate = useTranslate()
  const [shownPaused, setShownPaused] = useState(isPaused)
  const [isLifting, setIsLifting] = useState(false)

  if (isPaused !== shownPaused) {
    setShownPaused(isPaused)
    setIsLifting(!isPaused)
  }

  return (
    <>
      {(isPaused || isLifting) && (
        <section
          className={
            isPaused
              ? 'player-round notice paused'
              : 'player-round notice lifted'
          }
          onAnimationEnd={
            isLifting
              ? (event) => {
                  if (event.target === event.currentTarget) {
                    setIsLifting(false)
                  }
                }
              : undefined
          }
        >
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
