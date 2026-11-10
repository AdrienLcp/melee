import { useLayoutEffect } from 'react'

/** Where an arrival on the prerendered document had reached; `null` once it had landed. */
type LandingPoint = NonNullable<Animation['startTime']> | null

const landingPoints = new Map<string, LandingPoint>()

const TEXT_IN_KEY = 80

/**
 * Names one arrival so the app's node can find the prerendered node it
 * replaces: the class says which piece, the text says which of a row of them.
 * A lid the document held no place for — the device's own line-ups — has a
 * text the document never showed, so it finds nothing and arrives as new.
 */
const declaredAnimationNames = (element: Element): string[] =>
  getComputedStyle(element)
    .animationName.split(',')
    .map((name) => name.trim())
    .filter((name) => name !== 'none' && name !== '')

const holdsArrivals = (element: Element): boolean =>
  Array.from(element.querySelectorAll('*')).some(
    (inner) => declaredAnimationNames(inner).length > 0
  )

/**
 * A page holding arrivals is named by its class alone: its text runs through
 * the rows the document held open, which the app fills with something else.
 */
const arrivalKey = ({
  animationName,
  element
}: {
  animationName: string
  element: Element
}): string =>
  [
    animationName,
    element.getAttribute('class') ?? '',
    holdsArrivals(element)
      ? ''
      : (element.textContent ?? '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, TEXT_IN_KEY)
  ].join('|')

const cssAnimationOf = ({
  animationName,
  element
}: {
  animationName: string
  element: Element
}): CSSAnimation | undefined =>
  element
    .getAnimations()
    .find(
      (animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation &&
        animation.animationName === animationName
    )

/**
 * Notes, for every arrival the prerendered document declared, where it had
 * reached before the app replaces its nodes — including the ones that already
 * landed, which no longer have an animation to list. Called once, ahead
 * of the first render.
 */
export const holdLandingArrival = (): void => {
  const root = document.getElementById('root')

  if (root == null) {
    return
  }

  for (const element of root.querySelectorAll('*')) {
    for (const animationName of declaredAnimationNames(element)) {
      const animation = cssAnimationOf({ animationName, element })

      // Held before it started (`data-fonts-pending`): the document never
      // showed it, so the app's own node plays it whole.
      if (animation?.startTime === null) {
        continue
      }

      landingPoints.set(
        arrivalKey({ animationName, element }),
        animation?.startTime ?? null
      )
    }
  }
}

const landAt = ({
  animation,
  point
}: {
  animation: CSSAnimation
  point: LandingPoint
}): void => {
  if (point != null) {
    animation.startTime = point
    return
  }

  if (animation.effect?.getComputedTiming().endTime !== Infinity) {
    animation.finish()
  }
}

/**
 * Puts the app's arrivals where the document's had reached, so a page the
 * prerender painted arrives once rather than twice — `createRoot` swaps every
 * node, and a CSS animation restarts on a new node. An arrival that had landed
 * is finished at once: on a real network the app mounts long after the page
 * settled, and restarting there blanks the whole page and lays it down again.
 * In a layout effect, so the swapped page is never painted at its first frame.
 */
export const useResumeLandingArrival = (): void => {
  useLayoutEffect(() => {
    for (const animation of document.getAnimations()) {
      const element =
        animation.effect instanceof KeyframeEffect
          ? animation.effect.target
          : null

      if (!(animation instanceof CSSAnimation) || element == null) {
        continue
      }

      const key = arrivalKey({
        animationName: animation.animationName,
        element
      })

      if (landingPoints.has(key)) {
        landAt({ animation, point: landingPoints.get(key) ?? null })
      }
    }

    landingPoints.clear()
  }, [])
}
