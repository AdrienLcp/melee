import type React from 'react'
import { useState } from 'react'

/**
 * The rows a host adds to a list keyed by position — where a new row always
 * lands at the end — each marked until its entrance has run once: none of the
 * rows the list first drew with, and none again after it rose, so a panel
 * folded and opened again does not raise it a second time.
 */
export const useRowArrivals = (rowCount: number) => {
  const [firstArrivingRow, setFirstArrivingRow] = useState(rowCount)

  if (rowCount < firstArrivingRow) {
    setFirstArrivingRow(rowCount)
  }

  return {
    isArriving: (row: number): boolean => row >= firstArrivingRow,
    settleOnEnd:
      (row: number) =>
      (event: React.AnimationEvent): void => {
        // A settled row's end would be a no-op set, and one left queued
        // erases the lowering this hook derives during a later render.
        if (event.target === event.currentTarget && row >= firstArrivingRow) {
          setFirstArrivingRow((first) => Math.max(first, row + 1))
        }
      }
  }
}
