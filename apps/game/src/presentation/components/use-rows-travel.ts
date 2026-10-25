import { type RefObject, useEffectEvent, useLayoutEffect, useRef } from 'react'

import { keyedRowsOf, whenRowsDrawn } from './when-rows-drawn'

type Offset = { x: number; y: number }

type Boxes = ReadonlyMap<string, Offset>

/**
 * How a move is timed: `reorder` answers a drag at once; `reveal` waits for
 * the reveal's card to strike, then travels the way the seats' board does.
 */
export type TravelPace = 'reorder' | 'reveal'

type RowsTravelOptions = {
  /**
   * The keys in the order the rows stood in before this list was drawn: each
   * row then travels from the place the row now holding its old index sits in,
   * which is what lets a board mounted by the reveal show who passed whom.
   */
  from?: readonly string[] | null
  /** The list whose direct `[data-key]` children travel. */
  list: RefObject<HTMLElement | null>
  /** The rows' keys in the order drawn, joined: a change is what travels. */
  order: string
  pace: TravelPace
}

const MIN_TRAVEL_PX = 1

/** Where each row sits inside the list, so a scrolled panel measures the same. */
const measure = (list: HTMLElement): Map<string, Offset> => {
  const origin = list.getBoundingClientRect()

  return new Map(
    keyedRowsOf(list).map((row) => {
      const box = row.getBoundingClientRect()

      return [
        row.dataset.key ?? '',
        { x: box.left - origin.left, y: box.top - origin.top }
      ]
    })
  )
}

const slotsOf = ({
  from,
  now
}: {
  from: readonly string[]
  now: Boxes
}): Boxes => {
  const slots = [...now.values()]

  return new Map(
    from.flatMap((key, at) => {
      const slot = slots[at]

      return slot === undefined ? [] : [[key, slot] as const]
    })
  )
}

const millisecondsOf = (value: string): number => {
  const amount = Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return 0
  }

  return value.trim().endsWith('ms') ? amount : amount * 1000
}

const timingOf = ({
  list,
  pace
}: {
  list: HTMLElement
  pace: TravelPace
}): KeyframeAnimationOptions => {
  const style = getComputedStyle(list)
  const easing =
    style.getPropertyValue('--ease-out').trim() ||
    'cubic-bezier(0.16, 1, 0.3, 1)'

  if (pace === 'reorder') {
    return {
      duration: millisecondsOf(style.getPropertyValue('--transition-base')),
      easing
    }
  }

  const slow = millisecondsOf(style.getPropertyValue('--transition-slow'))

  return { delay: slow, duration: slow * 1.5, easing, fill: 'backwards' }
}

const isSameRows = (left: Boxes, right: Boxes): boolean =>
  left.size === right.size && [...left.keys()].every((key) => right.has(key))

const play = ({
  before,
  list,
  now,
  pace
}: {
  before: Boxes
  list: HTMLElement
  now: Boxes
  pace: TravelPace
}): void => {
  const timing = timingOf({ list, pace })

  if (timing.duration === 0) {
    return
  }

  for (const row of keyedRowsOf(list)) {
    const key = row.dataset.key ?? ''
    const was = before.get(key)
    const is = now.get(key)

    if (was === undefined || is === undefined) {
      continue
    }

    const x = was.x - is.x
    const y = was.y - is.y

    if (Math.hypot(x, y) < MIN_TRAVEL_PX) {
      continue
    }

    const zIndex = y > 0 ? '1' : '0'

    row.animate(
      [
        { transform: `translate(${x}px, ${y}px)`, zIndex },
        { transform: 'none', zIndex }
      ],
      timing
    )
  }
}

/**
 * Rows that changed places slide from where they stood rather than land there:
 * measured after the commit that reordered them, each starts at the box it held
 * — its old slot, or wherever `remember` saw it, a finger's drop included — and
 * a climber passes over the rows it overtakes. Only a reorder travels: a row
 * arriving or leaving, as a round opens, changes the rows and moves nobody.
 * Under reduced motion the tokens are nought and the rows simply land.
 *
 * Returns `remember`, called just before sending the reorder, which measures
 * the rows where they are drawn at that moment.
 */
export const useRowsTravel = ({
  from,
  list,
  order,
  pace
}: RowsTravelOptions): (() => void) => {
  const remembered = useRef<Boxes | null>(null)
  const drawnOrder = useRef<string | null>(null)

  const travel = useEffectEvent((drawn: string) => {
    const element = list.current

    if (drawnOrder.current === drawn || element === null) {
      return
    }

    const isFirst = drawnOrder.current === null
    const seen = remembered.current

    drawnOrder.current = drawn
    remembered.current = null

    return whenRowsDrawn({
      list: element,
      onDrawn: () => {
        const now = measure(element)
        const before =
          seen ?? (isFirst && from != null ? slotsOf({ from, now }) : null)

        if (before !== null && isSameRows(before, now)) {
          play({ before, list: element, now, pace })
        }
      },
      order: drawn
    })
  })

  useLayoutEffect(() => travel(order), [order])

  return () => {
    if (list.current !== null) {
      remembered.current = measure(list.current)
    }
  }
}
