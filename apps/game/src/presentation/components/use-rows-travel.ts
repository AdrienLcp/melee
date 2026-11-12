import { type RefObject, useEffectEvent, useLayoutEffect, useRef } from 'react'

import { keyedRowsOf, whenRowsDrawn } from './when-rows-drawn'

type Offset = { x: number; y: number }

/** Where a row sits, and how tall: a grid stretches a row it moves to the row it lands in. */
type Box = Offset & { height: number }

type Boxes = ReadonlyMap<string, Box>

/** How far a halted row stood from its place, and how tall it was drawn there. */
type Halt = Box

/**
 * How a move is timed: `reorder` answers a drag at once; `reveal` waits for
 * the reveal's card to strike, then travels the way the seats' board does;
 * `gather` makes room for a row arriving between two others and closes up
 * behind one that left, over the time a seat takes to arrive.
 */
export type TravelPace = 'gather' | 'reorder' | 'reveal'

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

type Drawn = { boxes: Boxes; width: number }

const MIN_TRAVEL_PX = 1
const TRAVEL_ID = 'rows-travel'

/** A list laid out as `display: contents` has no box: its rows sit in its parent's. */
const frameOf = (list: HTMLElement): HTMLElement =>
  list.getClientRects().length === 0 && list.parentElement !== null
    ? list.parentElement
    : list

/** Where each row sits inside the list, so a scrolled panel measures the same. */
const measure = (list: HTMLElement): Map<string, Box> => {
  const origin = frameOf(list).getBoundingClientRect()

  return new Map(
    keyedRowsOf(list).map((row) => {
      const box = row.getBoundingClientRect()

      return [
        row.dataset.key ?? '',
        {
          height: row.offsetHeight,
          x: box.left - origin.left,
          y: box.top - origin.top
        }
      ]
    })
  )
}

/**
 * Where each row is laid out, before any transform: a draw is measured long
 * before the next, often while the stage around the list is still scaling in.
 */
const measureLaidOut = (list: HTMLElement): Map<string, Box> =>
  new Map(
    keyedRowsOf(list).map((row) => [
      row.dataset.key ?? '',
      { height: row.offsetHeight, x: row.offsetLeft, y: row.offsetTop }
    ])
  )

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
      const own = now.get(key)

      return slot === undefined || own === undefined
        ? []
        : [[key, { ...slot, height: own.height }] as const]
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

  if (pace === 'gather') {
    return {
      duration: millisecondsOf(style.getPropertyValue('--transition-slow')),
      easing
    }
  }

  if (pace === 'reorder') {
    return {
      duration: millisecondsOf(style.getPropertyValue('--transition-base')),
      easing
    }
  }

  const slow = millisecondsOf(style.getPropertyValue('--transition-slow'))

  return { delay: slow, duration: slow * 1.5, easing, fill: 'backwards' }
}

/** The layer a row rests on, which a row passing others travels one above. */
const restingLayerOf = (row: HTMLElement): number => {
  const layer = Number.parseInt(getComputedStyle(row).zIndex, 10)

  return Number.isNaN(layer) ? 0 : layer
}

type Travel = { animation: Animation; isResized: boolean }

// Kept by hand rather than read back through `getAnimations()`, which walks
// every animation in the document: a view transition over a hundred-case
// board holds five hundred, and eight calls froze the side panel for seconds.
const travelsOf = new WeakMap<Element, readonly Travel[]>()

const runningTravelsOf = (row: Element): readonly Travel[] =>
  travelsOf.get(row) ?? []

const keepTravel = ({
  row,
  travel
}: {
  row: Element
  travel: Travel
}): void => {
  const forget = (): void => {
    travelsOf.set(
      row,
      runningTravelsOf(row).filter((kept) => kept !== travel)
    )
  }

  travelsOf.set(row, [...runningTravelsOf(row), travel])
  travel.animation.addEventListener('finish', forget, { once: true })
  travel.animation.addEventListener('cancel', forget, { once: true })
}

const isTravellingInHeight = (row: Element): boolean =>
  runningTravelsOf(row).some(({ isResized }) => isResized)

/** A row arriving, leaving or folding a piece open is resized by that motion, never glided. */
const isMovedOtherwise = (row: Element): boolean =>
  row
    .getAnimations({ subtree: true })
    .some(
      (animation) =>
        animation.id !== TRAVEL_ID && animation.playState === 'running'
    )

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
    const isResized = Math.abs(was.height - is.height) >= MIN_TRAVEL_PX

    if (Math.hypot(x, y) < MIN_TRAVEL_PX && !isResized) {
      continue
    }

    const layer = restingLayerOf(row)
    const zIndex = String(y > 0 ? layer + 1 : layer)
    const heights = isResized
      ? [{ height: `${was.height}px` }, { height: `${is.height}px` }]
      : [{}, {}]

    const animation = row.animate(
      [
        { transform: `translate(${x}px, ${y}px)`, zIndex, ...heights[0] },
        { transform: 'none', zIndex, ...heights[1] }
      ],
      { ...timing, id: TRAVEL_ID }
    )

    keepTravel({ row, travel: { animation, isResized } })
  }
}

/**
 * Stops a row still travelling and returns how far it stood from its place
 * and how tall it was, so a row caught mid-way by the next draw sets off from
 * where it is.
 */
const haltTravelOf = (row: HTMLElement): Halt | null => {
  const travels = runningTravelsOf(row)

  if (travels.length === 0) {
    return null
  }

  const shift = new DOMMatrixReadOnly(getComputedStyle(row).transform)
  const height = row.offsetHeight

  for (const { animation } of travels) {
    animation.cancel()
  }

  return { height, x: shift.m41, y: shift.m42 }
}

const haltTravels = (list: HTMLElement): Map<string, Halt> =>
  new Map(
    keyedRowsOf(list).flatMap((row) => {
      const halt = haltTravelOf(row)

      return halt === null ? [] : [[row.dataset.key ?? '', halt] as const]
    })
  )

const shiftedBy = ({
  boxes,
  shifts
}: {
  boxes: Boxes
  shifts: ReadonlyMap<string, Halt>
}): Boxes =>
  new Map(
    [...boxes].map(([key, box]) => {
      const shift = shifts.get(key)

      return [
        key,
        shift === undefined
          ? box
          : { height: shift.height, x: box.x + shift.x, y: box.y + shift.y }
      ]
    })
  )

/**
 * Where `gather` sets off from: the rows as the previous draw left them, moved
 * by whatever travel the new draw caught them in — and nothing when the list
 * has been laid out anew since, a phone turned or a window resized.
 */
const gatheredFrom = ({
  list,
  previous,
  shifts
}: {
  list: HTMLElement
  previous: Drawn | null
  shifts: ReadonlyMap<string, Halt>
}): Boxes | null =>
  previous === null ||
  Math.abs(previous.width - frameOf(list).clientWidth) >= MIN_TRAVEL_PX
    ? null
    : shiftedBy({ boxes: previous.boxes, shifts })

/**
 * A ref callback for a list whose rows are moved by what lies outside it — a
 * row of another list growing in the same grid, a chip dropping back into the
 * flow above them: each time their frame is resized, the rows it moved glide
 * from where they stood, and from the height a row of the grid stretched them
 * to, at the `gather` pace. A frame laid out at another
 * width moves nobody.
 */
export const glidesWhenTheGridResizes = (
  list: HTMLElement | null
): (() => void) | undefined => {
  if (list === null) {
    return undefined
  }

  let previous: Drawn | null = null

  const observer = new ResizeObserver(() => {
    const shifts = haltTravels(list)
    const now = measureLaidOut(list)
    const before = gatheredFrom({ list, previous, shifts })

    previous = { boxes: now, width: frameOf(list).clientWidth }

    if (before !== null) {
      play({ before, list, now, pace: 'gather' })
    }
  })

  observer.observe(frameOf(list))

  return () => {
    observer.disconnect()
  }
}

/**
 * Rows that changed places slide from where they stood rather than land there:
 * measured after the commit that reordered them, each starts at the box it held
 * — its old slot, or wherever `remember` saw it, a finger's drop included — and
 * a climber passes over the rows it overtakes. Only a reorder travels: a row
 * arriving or leaving, as a round opens, changes the rows and moves nobody —
 * save at the `gather` pace, where each row both draws hold travels from the
 * place the previous draw left it in. Under reduced motion the tokens are nought and the rows simply land.
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
  const lastDrawn = useRef<Drawn | null>(null)
  const resizes = useRef<ResizeObserver | null>(null)

  // A row grown or shrunk with no draw — taking its socket's height, a grid
  // relaid out once a filled socket goes — glides there from the height it was
  // drawn at, and is where the next draw sets off from. Every other row's
  // travel runs on.
  useLayoutEffect(() => {
    const element = list.current

    if (pace !== 'gather' || element === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      const previous = lastDrawn.current
      const width = frameOf(element).clientWidth

      if (previous === null) {
        return
      }

      const now = measureLaidOut(element)
      const kept = new Map(now)
      const before = new Map<string, Box>()
      const isSameWidth = Math.abs(previous.width - width) < MIN_TRAVEL_PX

      for (const row of keyedRowsOf(element)) {
        const key = row.dataset.key ?? ''
        const drawn = previous.boxes.get(key)
        const is = now.get(key)

        if (drawn === undefined || is === undefined) {
          continue
        }

        if (isTravellingInHeight(row)) {
          kept.set(key, drawn)
          continue
        }

        if (
          !isSameWidth ||
          Math.abs(drawn.height - is.height) < MIN_TRAVEL_PX ||
          isMovedOtherwise(row)
        ) {
          continue
        }

        const shift = haltTravelOf(row)

        before.set(
          key,
          shift === null
            ? drawn
            : { ...drawn, x: drawn.x + shift.x, y: drawn.y + shift.y }
        )
      }

      lastDrawn.current = { boxes: kept, width }

      if (before.size > 0) {
        play({ before, list: element, now, pace })
      }
    })

    resizes.current = observer

    return () => {
      observer.disconnect()
      resizes.current = null
    }
  }, [list, pace])

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
        if (pace === 'gather') {
          const shifts = haltTravels(element)
          const now = measureLaidOut(element)
          const before = gatheredFrom({
            list: element,
            previous: lastDrawn.current,
            shifts
          })

          lastDrawn.current = {
            boxes: now,
            width: frameOf(element).clientWidth
          }

          for (const row of keyedRowsOf(element)) {
            resizes.current?.observe(row)
          }

          if (before !== null) {
            play({ before, list: element, now, pace })
          }

          return
        }

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
