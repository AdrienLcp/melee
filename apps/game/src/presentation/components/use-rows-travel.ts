import { type RefObject, useEffectEvent, useLayoutEffect, useRef } from 'react'

import { keyedRowsOf, whenRowsDrawn } from './when-rows-drawn'

type Offset = { x: number; y: number }

/**
 * Where a row sits, how tall and how wide: a grid stretches a row it moves to
 * the row it lands in, and to the column's width.
 */
type Box = Offset & { height: number; width: number }

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
  /**
   * Rows that trade places pass one over the other: the one moving forwards
   * along a line — or up a column — travels on the layer above, rising in an
   * arc on a line, while the one going the other way shrinks and pales under
   * it, rather than both sliding through each other. `false` by default.
   */
  arcsWhenPassing?: boolean
  /**
   * The rows keep the order they were first drawn in and are laid out by
   * their CSS `order`, which lands in the same commit: the travel measures at
   * once rather than waiting for `order` to stand in the layout — which a
   * container query laying the list out backwards never does. `false` by
   * default.
   */
  isOrderedByStyle?: boolean
  /**
   * Matches what travels inside each row in the row's place, for a row part
   * of which stays put — the timeline's card and arrows beside a number that
   * never moves. The row itself by default.
   */
  piece?: string
}

type Drawn = { boxes: Boxes; width: number }

const MIN_TRAVEL_PX = 1
const TRAVEL_ID = 'rows-travel'

/** A list laid out as `display: contents` has no box: its rows sit in its parent's. */
const frameOf = (list: HTMLElement): HTMLElement =>
  list.getClientRects().length === 0 && list.parentElement !== null
    ? list.parentElement
    : list

/** What travels in a row's place: its pieces, or the row itself. */
const travellersOf = ({
  piece,
  row
}: {
  piece: string | undefined
  row: HTMLElement
}): HTMLElement[] =>
  piece === undefined ? [row] : [...row.querySelectorAll<HTMLElement>(piece)]

/**
 * Where each row is drawn inside the list, so a scrolled panel measures the
 * same: where its first piece is drawn, when its pieces travel without it.
 */
const measure = ({
  list,
  piece
}: {
  list: HTMLElement
  piece?: string
}): Map<string, Box> => {
  const origin = frameOf(list).getBoundingClientRect()

  return new Map(
    keyedRowsOf(list).map((row) => {
      const box = (
        travellersOf({ piece, row })[0] ?? row
      ).getBoundingClientRect()

      return [
        row.dataset.key ?? '',
        {
          height: row.offsetHeight,
          width: row.offsetWidth,
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
      {
        height: row.offsetHeight,
        width: row.offsetWidth,
        x: row.offsetLeft,
        y: row.offsetTop
      }
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
        : [[key, { ...slot, height: own.height, width: own.width }] as const]
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

/**
 * A row whose width changes travels to `auto` rather than to the width it was
 * measured at, so it follows a column still being resized under it — which
 * only a row allowing `interpolate-size: allow-keywords` can: anywhere else
 * `auto` does not interpolate, and the row keeps its width as it travels.
 */
const isWidthTravelling = (row: HTMLElement): boolean =>
  getComputedStyle(row).getPropertyValue('interpolate-size') ===
  'allow-keywords'

const isSameRows = (left: Boxes, right: Boxes): boolean =>
  left.size === right.size && [...left.keys()].every((key) => right.has(key))

/**
 * How a row passes another: along a `line` or down a `column`, and whether it
 * goes over — forwards on a line, up a column, as a climber does — or under.
 */
/**
 * How a row passes another: along which axis, over or under, and at what
 * share of the travel it stops overlapping every row it crosses.
 */
type Passing = { axis: 'column' | 'line'; clearsAt: number; isOver: boolean }

type Move = { is: Box; key: string; was: Box }

/** Whether two rows that stay on one line, or in one column, swapped their order along it. */
const isCrossing = ({
  axis,
  one,
  other
}: {
  axis: Passing['axis']
  one: Move
  other: Move
}): boolean => {
  const across = axis === 'line' ? 'y' : 'x'
  const along = axis === 'line' ? 'x' : 'y'

  return (
    Math.abs(one.was[across] - other.was[across]) < MIN_TRAVEL_PX &&
    Math.abs(one.is[across] - other.is[across]) < MIN_TRAVEL_PX &&
    Math.sign(one.was[along] - other.was[along]) *
      Math.sign(one.is[along] - other.is[along]) <
      0
  )
}

/**
 * The share of the travel past which two crossing rows no longer overlap:
 * both move, and grow, linearly in the travel's progress, so the gap between
 * the one landing ahead and the one landing behind it is linear too.
 */
const clearanceOf = ({
  axis,
  one,
  other
}: {
  axis: Passing['axis']
  one: Move
  other: Move
}): number => {
  const along = axis === 'line' ? 'x' : 'y'
  const size = axis === 'line' ? 'width' : 'height'
  const [ahead, behind] =
    one.is[along] < other.is[along] ? [one, other] : [other, one]
  const gapAt = (box: 'is' | 'was'): number =>
    behind[box][along] - ahead[box][along] - ahead[box][size]
  const atStart = gapAt('was')
  const atEnd = gapAt('is')

  return atEnd <= 0 || atStart >= 0 ? 1 : atStart / (atStart - atEnd)
}

/** The rows that cross another, each with how it passes. */
const passingOf = ({
  before,
  now
}: {
  before: Boxes
  now: Boxes
}): Map<string, Passing> => {
  const moves = [...now].flatMap(([key, is]): Move[] => {
    const was = before.get(key)

    return was === undefined ? [] : [{ is, key, was }]
  })
  const passing = new Map<string, Passing>()

  for (const one of moves) {
    const others = moves.filter((other) => other !== one)
    const axis = (['line', 'column'] as const).find((each) =>
      others.some((other) => isCrossing({ axis: each, one, other }))
    )

    if (axis === undefined) {
      continue
    }

    const clearsAt = Math.max(
      ...others
        .filter((other) => isCrossing({ axis, one, other }))
        .map((other) => clearanceOf({ axis, one, other }))
    )
    const isOver = axis === 'line' ? one.is.x > one.was.x : one.is.y < one.was.y

    passing.set(one.key, { axis, clearsAt, isOver })
  }

  return passing
}

const ARC_STEPS = 8
/** How high a row rises passing over, against its own height and against how far it goes. */
const ARC_RISE_OF_HEIGHT = 0.08
const ARC_RISE_OF_TRAVEL = 0.3
const PASSING_OVER_SCALE = 0.04
const PASSING_UNDER_SCALE = -0.06
const PASSING_UNDER_DIMMED = 0.7
/** How fast the row passing under pales as it sets off, against the arc's bulge. */
const PASSING_UNDER_PALE_HOLD = 1.8
/**
 * The latest the row passing under starts to come back: rows that still
 * touch as they land need some of the travel's tail to fade back in.
 */
const PASSING_UNDER_LATEST_RETURN = 0.98

/**
 * The positions a passing row goes through, sampled along a half sine so the
 * path in space stays an arc whatever easing the travel runs on. The row
 * sinking under pales as it passes, and stays pale until the rows it crosses
 * no longer overlap it, so the text of the two never reads one over the
 * other — through `filter`, never `opacity`, which a row leaving fades on and
 * a travel would take over. The fade back is a keyframe of its own: an ease
 * out crawls through the last hundredth of the way, and a fade sampled with
 * the arc came back while the climber's last line still sat over it.
 */
const arcOf = ({
  passing,
  row,
  x,
  y
}: {
  passing: Passing
  row: HTMLElement
  x: number
  y: number
}): Keyframe[] => {
  const rise =
    passing.isOver && passing.axis === 'line'
      ? Math.min(
          row.offsetHeight * ARC_RISE_OF_HEIGHT,
          Math.abs(x) * ARC_RISE_OF_TRAVEL
        )
      : 0
  // A row swelling down a column grows taller too, and reached into the row
  // it passed as that row settled under it.
  const overSwell = passing.axis === 'line' ? PASSING_OVER_SCALE : 0
  const swell = passing.isOver ? overSwell : PASSING_UNDER_SCALE
  const returnsAt = Math.min(
    Math.max(passing.clearsAt, 0.5),
    PASSING_UNDER_LATEST_RETURN
  )
  const paleAt = (paled: number): Keyframe => ({
    filter: `opacity(${1 - PASSING_UNDER_DIMMED * paled})`
  })

  const path = Array.from({ length: ARC_STEPS - 1 }, (_, step): Keyframe => {
    const at = (step + 1) / ARC_STEPS
    const bulge = Math.sin(Math.PI * at)
    const paled = at < 0.5 ? Math.min(1, bulge * PASSING_UNDER_PALE_HOLD) : 1

    return {
      offset: at,
      transform: `translate(${x * (1 - at)}px, ${y * (1 - at) - rise * bulge}px) scale(${1 + swell * bulge})`,
      ...(!passing.isOver && at < returnsAt && paleAt(paled))
    }
  })

  if (passing.isOver) {
    return path
  }

  const returning = { offset: returnsAt, ...paleAt(1) }

  return [...path, returning].toSorted(
    (left, right) => (left.offset ?? 0) - (right.offset ?? 0)
  )
}

const play = ({
  arcsWhenPassing = false,
  before,
  list,
  now,
  pace,
  piece
}: {
  arcsWhenPassing?: boolean
  before: Boxes
  list: HTMLElement
  now: Boxes
  pace: TravelPace
  piece?: string
}): void => {
  const timing = timingOf({ list, pace })

  if (timing.duration === 0) {
    return
  }

  const passing = arcsWhenPassing
    ? passingOf({ before, now })
    : new Map<string, Passing>()

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
    const isWidened =
      Math.abs(was.width - is.width) >= MIN_TRAVEL_PX && isWidthTravelling(row)

    if (Math.hypot(x, y) < MIN_TRAVEL_PX && !isResized && !isWidened) {
      continue
    }

    const layer = restingLayerOf(row)
    const way = passing.get(key)
    const isClimbing = way === undefined ? y > 0 : way.isOver
    const zIndex = String(isClimbing ? layer + 1 : layer)
    const heights = isResized
      ? [{ height: `${was.height}px` }, { height: `${is.height}px` }]
      : [{}, {}]
    const widths = isWidened
      ? [{ width: `${was.width}px` }, { width: 'auto' }]
      : [{}, {}]
    const arc = way === undefined ? [] : arcOf({ passing: way, row, x, y })

    for (const traveller of travellersOf({ piece, row })) {
      const animation = traveller.animate(
        [
          {
            transform: `translate(${x}px, ${y}px)`,
            zIndex,
            ...heights[0],
            ...widths[0]
          },
          ...arc.map((frame) => ({ ...frame, zIndex })),
          { transform: 'none', zIndex, ...heights[1], ...widths[1] }
        ],
        { ...timing, id: TRAVEL_ID }
      )

      keepTravel({ row: traveller, travel: { animation, isResized } })
    }
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
  const width = row.offsetWidth

  for (const { animation } of travels) {
    animation.cancel()
  }

  return { height, width, x: shift.m41, y: shift.m42 }
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
          : {
              height: shift.height,
              width: shift.width,
              x: box.x + shift.x,
              y: box.y + shift.y
            }
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
  arcsWhenPassing = false,
  from,
  isOrderedByStyle = false,
  list,
  order,
  pace,
  piece
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

        // Its height is the one it travels to, but where it stands is now:
        // a row above it closing as it leaves moves it, and the stale place
        // sent it back down by that row's height when the next draw set off.
        if (isTravellingInHeight(row)) {
          kept.set(key, { ...is, height: drawn.height })
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

    // A remount keeps the rows but not the observer: under StrictMode the
    // first draw observed them on the one torn down, so no resize reached the
    // last draw's width and the next change set off from nowhere.
    for (const row of keyedRowsOf(element)) {
      observer.observe(row)
    }

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

    const onDrawn = () => {
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
          play({ arcsWhenPassing, before, list: element, now, pace })
        }

        return
      }

      const now = measure({ list: element, piece })
      const before =
        seen ?? (isFirst && from != null ? slotsOf({ from, now }) : null)

      if (before !== null && isSameRows(before, now)) {
        play({ arcsWhenPassing, before, list: element, now, pace, piece })
      }
    }

    if (isOrderedByStyle) {
      onDrawn()

      return
    }

    return whenRowsDrawn({ list: element, onDrawn, order: drawn })
  })

  useLayoutEffect(() => travel(order), [order])

  return () => {
    if (list.current !== null) {
      remembered.current = measure({ list: list.current, piece })
    }
  }
}
