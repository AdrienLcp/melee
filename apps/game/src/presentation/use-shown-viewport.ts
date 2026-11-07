import { useEffect } from 'react'

import { onShownViewportChange } from '@/infrastructure/browser'

/**
 * The heights, in rem, a stylesheet's `shown-height-below` may test: the ones
 * a keyboard coming up takes an answering screen under.
 */
const SHOWN_HEIGHT_STEPS_REM = [30, 36] as const

/** A media query's rem, which is the initial font size and not the root's. */
const MEDIA_REM_PX = 16

/**
 * Publishes what the screen shows on the root element, mounted once by the
 * shell because every surface holding itself to the screen reads it:
 *
 * - `--visual-viewport-height`, which `--shown-height` reads;
 * - `--visual-viewport-pan`, the band's offset as a `translate`, while a
 *   keyboard laid over a page no taller than the screen has panned the band
 *   down it — the page shrinks to the band, so it has to move to it too;
 * - `data-shown-height-below`, every step of `SHOWN_HEIGHT_STEPS_REM` the
 *   shown height is under, for the rules a keyboard opens which a media
 *   query, reading the layout viewport, misses where the keyboard is laid
 *   over the page.
 *
 * A page taller than the screen is scrolled to the field by the browser
 * itself, and never moved.
 */
export const usePublishShownViewport = (): void => {
  useEffect(() => {
    const root = document.documentElement
    const stopListening = onShownViewportChange(({ heightPx, offsetTopPx }) => {
      root.style.setProperty('--visual-viewport-height', `${heightPx}px`)
      root.setAttribute(
        'data-shown-height-below',
        SHOWN_HEIGHT_STEPS_REM.filter(
          (stepRem) => heightPx < stepRem * MEDIA_REM_PX
        ).join(' ')
      )

      const isPageHeld = root.scrollHeight <= innerHeight + 1

      if (offsetTopPx > 0.5 && isPageHeld) {
        root.style.setProperty('--visual-viewport-pan', `0 ${offsetTopPx}px`)
      } else {
        root.style.removeProperty('--visual-viewport-pan')
      }
    })

    return () => {
      stopListening()
      root.style.removeProperty('--visual-viewport-height')
      root.style.removeProperty('--visual-viewport-pan')
      root.removeAttribute('data-shown-height-below')
    }
  }, [])
}
