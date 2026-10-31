import { useCallback, useEffect, useRef, useState } from 'react'

import type { MapView } from '@/helpers/map-view'
import { prefersReducedMotion } from '@/infrastructure/browser'

/** Long enough to see where a zoom went, short enough that a second press never waits on the first. */
const EASE_MS = 200

type Easing = { from: MapView; startedAt: number | null; to: MapView }

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3

/**
 * Blending scale and offset by one weight keeps the focus of a zoom still all
 * the way through: `x = focus - mapPoint × scale` is linear in the scale.
 */
const blended = ({ from, to }: Easing, weight: number): MapView => ({
  scale: from.scale + (to.scale - from.scale) * weight,
  x: from.x + (to.x - from.x) * weight,
  y: from.y + (to.y - from.y) * weight
})

/**
 * The map's view, moved two ways: `setView` lands at once, for a finger that
 * must stay on the place it holds, and `easeView` glides there, for a press or
 * a wheel notch that jumps. An ease asked mid-ease starts from where the map
 * is drawn and builds on where it was going, so a run of notches adds up.
 */
export const useEasedMapView = (initial: () => MapView) => {
  const [view, setShownView] = useState(initial)
  const shown = useRef(view)
  const easing = useRef<Easing | null>(null)
  const frame = useRef(0)

  const show = useCallback((next: MapView) => {
    shown.current = next
    setShownView(next)
  }, [])

  const setView = useCallback(
    (update: (view: MapView) => MapView) => {
      cancelAnimationFrame(frame.current)
      easing.current = null
      show(update(shown.current))
    },
    [show]
  )

  const easeView = useCallback(
    (update: (view: MapView) => MapView) => {
      if (prefersReducedMotion()) {
        setView(update)
        return
      }

      cancelAnimationFrame(frame.current)
      easing.current = {
        from: shown.current,
        startedAt: null,
        to: update(easing.current?.to ?? shown.current)
      }

      const step = (time: number) => {
        const current = easing.current

        if (current === null) {
          return
        }

        const startedAt = current.startedAt ?? time
        current.startedAt = startedAt

        const progress = Math.min(1, (time - startedAt) / EASE_MS)

        show(blended(current, easeOutCubic(progress)))

        if (progress < 1) {
          frame.current = requestAnimationFrame(step)
        } else {
          easing.current = null
        }
      }

      frame.current = requestAnimationFrame(step)
    },
    [setView, show]
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return { easeView, setView, view }
}
