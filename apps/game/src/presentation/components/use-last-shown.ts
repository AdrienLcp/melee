import { useState } from 'react'

/**
 * The value while there is one, and the last one there was once it goes to
 * `null` — what a fold keeps saying while it closes, since what closed it no
 * longer holds it. `null` until the first value arrives.
 *
 * A value built during render is a new object every time, and setting it from
 * render would loop: pass `isSame` to compare what it says instead.
 */
export const useLastShown = <Value>(
  value: Value | null,
  isSame: (left: Value, right: Value) => boolean = Object.is
): Value | null => {
  const [last, setLast] = useState(value)

  if (value !== null && (last === null || !isSame(value, last))) {
    setLast(value)
  }

  return value ?? last
}
