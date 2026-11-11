import { type RefObject, useEffect, useState } from 'react'

import { onLayoutMoved } from '@/infrastructure/browser'

type WholeChips = {
  /** The chips, every child but `count`. */
  list: RefObject<HTMLElement | null>
  /**
   * A child of the list saying how many chips it holds back, kept room for
   * after the last whole chip and hidden while nothing is cut.
   */
  count?: RefObject<HTMLElement | null>
}

/**
 * Where the list's box clips rather than scrolls — on the wall, which nobody
 * scrolls — hides every chip from the first one the box would cut, so the room
 * reads whole answers and never half of one. Returns how many it hid.
 *
 * It watches the stage rather than the list: hiding a chip shrinks the list,
 * and a list observing itself would show it again on the next frame. A chip
 * that arrives, leaves or is renamed fits the list again too, since the stage's
 * size does not move for it, and so does a chip settling from its entrance:
 * measured while it still rose into place, the last one stood half past the
 * list's edge. Two lists sharing a stage stay whole only where
 * one hiding chips can give the other room and never take it: rows sized
 * `minmax(0, auto)`, never a flex column shrinking each item by its size.
 */
export const useWholeChips = ({ count, list }: WholeChips): number => {
  const [cutCount, setCutCount] = useState(0)

  useEffect(() => {
    const element = list.current
    const stage = element?.closest<HTMLElement>('.stage')

    if (element == null || stage == null) {
      return
    }

    const fit = () => {
      const countChip = count?.current ?? null
      const chips = [...element.children].filter(
        (chip): chip is HTMLElement =>
          chip instanceof HTMLElement && chip !== countChip
      )

      for (const chip of chips) {
        chip.hidden = false
      }

      if (countChip !== null) {
        countChip.hidden = true
      }

      if (getComputedStyle(element).overflowY !== 'clip') {
        setCutCount(0)
        return
      }

      // Read against the list's own top: the rows under a centred stage move
      // as soon as a chip is hidden, and the list's own box shrinks with it.
      const height = element.getBoundingClientRect().height + 0.5
      const isCut = (chip: HTMLElement): boolean =>
        chip.getBoundingClientRect().bottom -
          element.getBoundingClientRect().top >
        height
      const hideFrom = (index: number) => {
        for (const chip of chips.slice(index)) {
          chip.hidden = true
        }
      }
      let firstCut = chips.findIndex(isCut)

      if (firstCut === -1) {
        setCutCount(0)
        return
      }

      hideFrom(firstCut)

      if (countChip !== null) {
        countChip.hidden = false

        while (firstCut > 0 && isCut(countChip)) {
          firstCut -= 1
          hideFrom(firstCut)
        }
      }

      setCutCount(chips.length - firstCut)
    }

    const observer = new ResizeObserver(fit)
    const chipsObserver = new MutationObserver(fit)
    const stopListening = onLayoutMoved(fit)

    element.addEventListener('animationend', fit)
    observer.observe(stage)
    chipsObserver.observe(element, {
      characterData: true,
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      chipsObserver.disconnect()
      element.removeEventListener('animationend', fit)
      stopListening()
    }
  }, [count, list])

  return cutCount
}
