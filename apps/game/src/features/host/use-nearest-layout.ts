import { type RefObject, useLayoutEffect } from 'react'

import { nearestLayoutOf } from '@/helpers/make-number-nearest'

/** A row's height and type at most, and its type at least, in root ems. */
const ROW_CAP_REM = 10.5
const FONT_CAP_REM = 2.5
const FONT_FLOOR_REM = 0.75

/**
 * Publishes on the list how `count` rows fill its box — `--nearest-columns`,
 * `--nearest-rows`, `--row-font` and `--name-lines` — read again whenever the
 * box is resized. The stylesheet cannot choose them: the count and the box
 * decide which number of columns gives the largest type.
 */
export const useNearestLayout = ({
  count,
  list
}: {
  count: number
  list: RefObject<HTMLElement | null>
}): void => {
  useLayoutEffect(() => {
    const element = list.current

    if (element === null) {
      return
    }

    const fit = (): void => {
      const style = getComputedStyle(element)
      const remPx =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize
        ) || 16
      const layout = nearestLayoutOf({
        columnGap: Number.parseFloat(style.columnGap) || 0,
        count,
        fontCapPx: FONT_CAP_REM * remPx,
        fontFloorPx: FONT_FLOOR_REM * remPx,
        height: element.clientHeight,
        rowCapPx: ROW_CAP_REM * remPx,
        rowGap: Number.parseFloat(style.rowGap) || 0,
        width: element.clientWidth
      })

      element.style.setProperty('--nearest-columns', String(layout.columns))
      element.style.setProperty('--nearest-rows', String(layout.rows))
      element.style.setProperty('--row-font', `${layout.fontPx}px`)
      element.style.setProperty('--name-lines', String(layout.nameLines))
    }

    const observer = new ResizeObserver(fit)

    fit()
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [count, list])
}
