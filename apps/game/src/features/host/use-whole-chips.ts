import { type RefObject, useEffect } from 'react'

import { onLayoutMoved } from '@/infrastructure/browser'

/**
 * Where the list's box clips rather than scrolls — on the wall, which nobody
 * scrolls — hides every chip from the first one the box would cut, so the room
 * reads whole answers and never half of one. It watches the stage rather than
 * the list: hiding a chip shrinks the list, and a list observing itself would
 * show it again on the next frame.
 */
export const useWholeChips = (list: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const element = list.current
    const stage = element?.closest<HTMLElement>('.stage')

    if (element == null || stage == null) {
      return
    }

    const fit = () => {
      const chips = [...element.children].filter(
        (chip): chip is HTMLElement => chip instanceof HTMLElement
      )

      for (const chip of chips) {
        chip.hidden = false
      }

      if (getComputedStyle(element).overflowY !== 'clip') {
        return
      }

      const edge = element.getBoundingClientRect().bottom + 0.5
      const firstCut = chips.findIndex(
        (chip) => chip.getBoundingClientRect().bottom > edge
      )

      if (firstCut === -1) {
        return
      }

      for (const chip of chips.slice(firstCut)) {
        chip.hidden = true
      }
    }

    const observer = new ResizeObserver(fit)
    const stopListening = onLayoutMoved(fit)

    observer.observe(stage)

    return () => {
      observer.disconnect()
      stopListening()
    }
  }, [list])
}
