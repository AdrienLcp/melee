import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { prefersReducedMotion } from '@/infrastructure/browser'

type BoardSetupLanding = {
  /** A press is waiting for the board's control to come into view. */
  isDue: boolean
  /** Brings the Table tab on screen, wherever this console lays it, and lands on the board's control. */
  open: () => void
  /** The control has taken the focus: the press is spent. */
  settle: () => void
}

const [BoardSetupLandingContext, , useOptionalBoardSetupLanding] =
  createSafeContext<BoardSetupLanding>('BoardSetupLandingProvider')

type BoardSetupLandingProviderProps = {
  children: React.ReactNode
  /**
   * Brings the Table tab on screen in this layout: a tab chosen, a rail
   * unfolded, a sheet opened — or nothing, where the tab is always in view.
   */
  onOpenTable: () => void
}

/**
 * The way from the lobby stage's board preview to the board's own control,
 * whichever layout the console lays its setup out in. The control may not be
 * mounted yet when the press lands — a tab or a sheet still to open — so the
 * press waits for it rather than reaching for it.
 */
export const BoardSetupLandingProvider: React.FC<
  BoardSetupLandingProviderProps
> = ({ children, onOpenTable }) => {
  const [isDue, setIsDue] = useState(false)

  return (
    <BoardSetupLandingContext
      value={{
        isDue,
        open: () => {
          onOpenTable()
          setIsDue(true)
        },
        settle: () => {
          setIsDue(false)
        }
      }}
    >
      {children}
    </BoardSetupLandingContext>
  )
}

/** Opens the board's control from elsewhere on the console; `null` on a screen with no setup. */
export const useOpenBoardSetup = (): (() => void) | null =>
  useOptionalBoardSetupLanding()?.open ?? null

/**
 * The ref the board's control is laid on: a press waiting for it scrolls the
 * control into view and focuses its chosen segment, once per press.
 */
export const useBoardSetupLanding =
  (): React.RefObject<HTMLDivElement | null> => {
    const ref = useRef<HTMLDivElement>(null)
    const landing = useOptionalBoardSetupLanding()
    const isDue = landing?.isDue === true
    const settle = useEffectEvent(() => {
      landing?.settle()
    })

    useEffect(() => {
      const setup = ref.current

      if (!isDue || setup === null) {
        return
      }

      setup.scrollIntoView({
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
        block: 'center'
      })

      const chosen = setup.querySelector('input:checked')

      if (chosen instanceof HTMLElement) {
        chosen.focus({ preventScroll: true })
      }

      settle()
    }, [isDue])

    return ref
  }
