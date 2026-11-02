import { useEffect } from 'react'

import { onShownHeightChange } from '@/infrastructure/browser'

/**
 * Publishes the height the screen shows as `--visual-viewport-height` on the
 * root element, where `--shown-height` reads it. Mounted once, by the shell:
 * on the root because every surface holding itself to the screen reads it.
 */
export const usePublishShownHeight = (): void => {
  useEffect(() => {
    const root = document.documentElement
    const stopListening = onShownHeightChange((heightPx) => {
      root.style.setProperty('--visual-viewport-height', `${heightPx}px`)
    })

    return () => {
      stopListening()
      root.style.removeProperty('--visual-viewport-height')
    }
  }, [])
}
