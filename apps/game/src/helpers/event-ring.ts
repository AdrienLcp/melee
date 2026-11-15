/** One entry: the last of a run of same-type events folded together, and how many there were. */
export type RingEntry<TType extends string, TDetail> = {
  at: number
  count: number
  detail: TDetail
  type: TType
}

export type EventRing<TType extends string, TDetail> = {
  note: (event: { at: number; detail: TDetail; type: TType }) => void
  /** The entries noted at or after `from`, oldest first. */
  since: (from: number) => RingEntry<TType, TDetail>[]
}

/**
 * The last `capacity` events, the oldest dropped first. A run of one type
 * closer together than `coalesceMs` — a visual viewport scrolling at every
 * frame of a keyboard's slide — is one entry holding the run's last values
 * and its length, or the slide alone would push out what came before it.
 */
export const createEventRing = <TType extends string, TDetail>({
  capacity,
  coalesceMs
}: {
  capacity: number
  coalesceMs: number
}): EventRing<TType, TDetail> => {
  const entries: RingEntry<TType, TDetail>[] = []

  return {
    note: ({ at, detail, type }) => {
      const last = entries.at(-1)

      if (
        last !== undefined &&
        last.type === type &&
        at - last.at < coalesceMs
      ) {
        entries[entries.length - 1] = {
          at,
          count: last.count + 1,
          detail,
          type
        }

        return
      }

      entries.push({ at, count: 1, detail, type })

      if (entries.length > capacity) {
        entries.shift()
      }
    },
    since: (from) => entries.filter((entry) => entry.at >= from)
  }
}
