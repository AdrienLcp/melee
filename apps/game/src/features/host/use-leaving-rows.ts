import type React from 'react'
import { useState } from 'react'

type Held<Row> = { rows: readonly Row[]; signature: string }

/**
 * The rows that left a keyed list, each kept drawn as it last stood until its
 * own exit animation ends: a seat that leaves the table mid-round fades out
 * of its place rather than vanishing from it. A row that comes back stops
 * leaving. `signature` says when the rows changed — their keys and whatever
 * a leaving row should still show — so a render that changed nothing derives
 * nothing.
 */
export const useLeavingRows = <Row extends { id: string }>({
  rows,
  signature
}: {
  rows: readonly Row[]
  signature: string
}) => {
  const [held, setHeld] = useState<Held<Row>>({ rows, signature })
  const [leaving, setLeaving] = useState<readonly Row[]>([])

  if (signature !== held.signature) {
    const present = new Set(rows.map(({ id }) => id))
    const gone = held.rows.filter(({ id }) => !present.has(id))
    const goneIds = new Set(gone.map(({ id }) => id))
    const next = [
      ...leaving.filter(({ id }) => !present.has(id) && !goneIds.has(id)),
      ...gone
    ]

    if (
      next.length !== leaving.length ||
      next.some((row, at) => row !== leaving[at])
    ) {
      setLeaving(next)
    }

    setHeld({ rows, signature })
  }

  return {
    /** Ends one row's exit on its own `animationend`, never a child's. */
    endsExitOf:
      (id: string) =>
      (event: React.AnimationEvent): void => {
        if (event.target === event.currentTarget) {
          setLeaving((current) =>
            current.some((row) => row.id === id)
              ? current.filter((row) => row.id !== id)
              : current
          )
        }
      },
    leaving
  }
}
