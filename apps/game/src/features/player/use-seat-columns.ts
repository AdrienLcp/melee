import { type RefObject, useEffect } from 'react'

import { seatColumns, seatNameLines } from '@/helpers/seat-columns'

/** Past three lines a name stops reading as a name, and is cut instead. */
const MOST_NAME_LINES = 3

/**
 * Publishes on the list, as `--seat-columns`, how many columns deal `count`
 * seats into its own box with every row a touch target tall, and as
 * `--seat-name-lines` how many lines of a name those rows hold. The
 * stylesheet cannot choose either: the count and the box decide them.
 */
export const useSeatColumns = ({
  count,
  list
}: {
  count: number
  list: RefObject<HTMLElement | null>
}): void => {
  useEffect(() => {
    const element = list.current

    if (element === null) {
      return
    }

    const fit = () => {
      const style = getComputedStyle(element)
      const gap = Number.parseFloat(style.rowGap) || 0
      const height =
        element.clientHeight -
        Number.parseFloat(style.paddingBlockStart) -
        Number.parseFloat(style.paddingBlockEnd)
      const columns = seatColumns({
        count,
        gap,
        height,
        rowHeight: Number.parseFloat(style.getPropertyValue('--target'))
      })
      const rows = Math.ceil(count / columns)
      const name = element.querySelector('.nickname')
      const tile = name?.parentElement

      element.style.setProperty('--seat-columns', String(columns))

      if (name == null || tile == null) {
        return
      }

      const tileStyle = getComputedStyle(tile)

      element.style.setProperty(
        '--seat-name-lines',
        String(
          seatNameLines({
            lineHeight: Number.parseFloat(getComputedStyle(name).lineHeight),
            most: MOST_NAME_LINES,
            rowHeight:
              (height - (rows - 1) * gap) / rows -
              Number.parseFloat(tileStyle.paddingBlockStart) -
              Number.parseFloat(tileStyle.paddingBlockEnd)
          })
        )
      )
    }

    const observer = new ResizeObserver(fit)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [count, list])
}
