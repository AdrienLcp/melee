import { useLayoutEffect } from 'react'

const heldStartTimes = new Map<string, NonNullable<Animation['startTime']>>()

const cssAnimations = (): CSSAnimation[] =>
  document
    .getAnimations()
    .filter((animation) => animation instanceof CSSAnimation)

/**
 * Notes when each arrival on the prerendered document started, before the app
 * replaces its nodes with its own. Called once, ahead of the first render.
 */
export const holdLandingArrival = (): void => {
  for (const animation of cssAnimations()) {
    if (
      animation.startTime != null &&
      !heldStartTimes.has(animation.animationName)
    ) {
      heldStartTimes.set(animation.animationName, animation.startTime)
    }
  }
}

/**
 * Puts the app's arrivals back where the document's had reached, so a page
 * the prerender painted arrives once rather than twice — `createRoot` swaps
 * every node, and a CSS animation restarts on a new node. In a layout effect,
 * so the swapped page is never painted at its first frame.
 */
export const useResumeLandingArrival = (): void => {
  useLayoutEffect(() => {
    for (const animation of cssAnimations()) {
      const startTime = heldStartTimes.get(animation.animationName)

      if (startTime != null) {
        animation.startTime = startTime
      }
    }

    heldStartTimes.clear()
  }, [])
}
