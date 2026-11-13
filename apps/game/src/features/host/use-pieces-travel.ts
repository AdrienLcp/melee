import { type RefObject, useLayoutEffect, useRef } from 'react'

import { millisecondsOf } from '@/presentation/still-copy'

type Placed = { group: string; x: number; y: number }

/**
 * Every `[data-key]` piece in the container that changed `[data-group]`
 * since the last placement travels from where it stood to where it now
 * stands, on `--transition-slow`: a seat's pin sliding along the ruler as
 * its value comes nearer. A piece that only moved because its box was
 * resized does not travel.
 */
export const usePiecesTravel = ({
  container,
  placement
}: {
  container: RefObject<HTMLElement | null>
  /** Where every piece is, written as one string: a change is what travels. */
  placement: string
}): void => {
  const placed = useRef<ReadonlyMap<string, Placed>>(new Map())

  useLayoutEffect(() => {
    const element = container.current

    if (element === null || placement === '') {
      return
    }

    const style = getComputedStyle(element)
    const duration = millisecondsOf(style.getPropertyValue('--transition-slow'))
    const easing = style.getPropertyValue('--ease-out').trim() || 'ease-out'
    const origin = element.getBoundingClientRect()
    const now = new Map<string, Placed>()

    for (const piece of element.querySelectorAll<HTMLElement>('[data-key]')) {
      const box = piece.getBoundingClientRect()
      const key = piece.dataset.key ?? ''
      const here = {
        group:
          piece.parentElement?.closest<HTMLElement>('[data-group]')?.dataset
            .group ?? '',
        x: box.left - origin.left,
        y: box.top - origin.top
      }
      const before = placed.current.get(key)

      now.set(key, here)

      if (before !== undefined && before.group !== here.group && duration > 0) {
        piece.animate(
          [
            { translate: `${before.x - here.x}px ${before.y - here.y}px` },
            { translate: '0 0' }
          ],
          { duration, easing }
        )
      }
    }

    placed.current = now
  }, [container, placement])
}
