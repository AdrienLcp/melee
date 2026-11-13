import { useState } from 'react'

import { firstDrawnOrder } from '@/helpers/first-drawn-order'

/**
 * Where each key stands in the order the list first drew it, for rendering
 * the list in that order and laying it out in another with CSS `order`: a
 * regroup then moves a pile across the screen without React taking it out
 * of the page, which would replay its entrance.
 */
export const useFirstDrawnOrder = (
  keys: readonly string[]
): ((key: string) => number) => {
  const [drawn, setDrawn] = useState(keys)
  const order = firstDrawnOrder({ drawn, next: keys })

  if (order !== drawn) {
    setDrawn(order)
  }

  return (key) => order.indexOf(key)
}
