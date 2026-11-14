import type React from 'react'
import { useState } from 'react'

type LeftRow<Row> = Row & { at: number }

/**
 * A row as it is drawn: one still listed, or one gone that plays its exit
 * where it stood. `isArriving` (listed by the last change) and `isChanged`
 * (redrawn by it) hold until the next change: a row moved in the DOM restarts
 * every CSS animation it holds, so a list that reorders keys its entrances on
 * these rather than on a row's mount.
 */
export type DrawnRow<Row> = Row & {
  isArriving: boolean
  isChanged: boolean
  isLeaving: boolean
}

type LastChange = {
  arriving: ReadonlySet<string>
  changed: ReadonlySet<string>
}

const NO_CHANGE: LastChange = { arriving: new Set(), changed: new Set() }

const signatureOf = (rows: readonly unknown[]): string => JSON.stringify(rows)

/**
 * Keeps a row that left a list drawn where it stood until its exit ends, since
 * the snapshot that ended it no longer holds it. `rows` may be built anew on
 * every render: it is compared by what it holds. Each leaving row is ended by
 * `endExitOf(id)`, an `animationend` handler that answers only `exitAnimation`
 * played by the row itself, and is attached only while that row leaves.
 */
export const useLeavingRows = <Row extends { id: string }>({
  exitAnimation,
  rows
}: {
  /** The keyframes whose end takes a leaving row out of the list. */
  exitAnimation: string
  rows: readonly Row[]
}): {
  endExitOf: (id: string) => React.AnimationEventHandler
  rows: readonly DrawnRow<Row>[]
} => {
  const [held, setHeld] = useState(rows)
  const [left, setLeft] = useState<readonly LeftRow<Row>[]>([])
  const [lastChange, setLastChange] = useState(NO_CHANGE)

  if (signatureOf(rows) !== signatureOf(held)) {
    const present = new Set(rows.map((row) => row.id))
    const wasDrawn = new Map(held.map((row) => [row.id, signatureOf([row])]))
    const leaving = held.flatMap((row, at) =>
      present.has(row.id) ? [] : [{ ...row, at }]
    )

    setLeft((current) => [
      ...current.filter((row) => !present.has(row.id)),
      ...leaving
    ])
    setLastChange({
      arriving: new Set(
        rows.flatMap((row) => (wasDrawn.has(row.id) ? [] : [row.id]))
      ),
      changed: new Set(
        rows.flatMap((row) => {
          const was = wasDrawn.get(row.id)

          return was === undefined || was === signatureOf([row]) ? [] : [row.id]
        })
      )
    })
    setHeld(rows)
  }

  const drawn: DrawnRow<Row>[] = rows.map((row) => ({
    ...row,
    isArriving: lastChange.arriving.has(row.id),
    isChanged: lastChange.changed.has(row.id),
    isLeaving: false
  }))

  for (const row of left.toSorted((first, second) => first.at - second.at)) {
    drawn.splice(Math.min(row.at, drawn.length), 0, {
      ...row,
      isArriving: false,
      isChanged: false,
      isLeaving: true
    })
  }

  return {
    endExitOf: (id) => (event) => {
      if (
        event.target === event.currentTarget &&
        event.animationName === exitAnimation
      ) {
        setLeft((current) => current.filter((row) => row.id !== id))
      }
    },
    rows: drawn
  }
}
