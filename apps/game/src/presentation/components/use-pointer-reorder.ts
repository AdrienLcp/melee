import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef
} from 'react'

import { whenRowsDrawn } from './when-rows-drawn'

/** The custom property a row is shifted by while it is dragged. */
const SHIFT_PROPERTY = '--drag-shift'
/** The attribute the dragged row carries, for the sheet to lift it. */
const LIFTED_ATTRIBUTE = 'data-lifted'
/**
 * How long a dropped row holds where the pointer left it, waiting for the order
 * to come back: past it, the move was refused and the rows step home.
 */
const HELD_DROP_MS = 2000

type PointerReorderOptions = {
  /** Matches the grip inside a row that a pointer picks the row up by. */
  grip: string
  /** The list whose `[data-key]` rows are reordered. */
  list: RefObject<HTMLElement | null>
  /** Called once the pointer lifts, with the row's key and the index it lands at. */
  onMove: (key: string, at: number) => void
  /** The rows' keys in the order drawn, joined: the drop holds until it changes. */
  order: string
  /**
   * Matches the rows a dragged row steps among and lands between, which must
   * lead the list; every `[data-key]` row by default.
   */
  rows?: string
}

type Drag = {
  from: number
  pitch: number
  pointerId: number
  rows: HTMLElement[]
  startY: number
  middles: number[]
  to: number
}

const settle = (rows: readonly HTMLElement[]): void => {
  for (const row of rows) {
    row.style.removeProperty(SHIFT_PROPERTY)
    row.removeAttribute(LIFTED_ATTRIBUTE)
  }
}

/** Settles rows without the step home a transition would draw: they are already there. */
const settleInPlace = (rows: readonly HTMLElement[]): void => {
  settle(rows)

  for (const row of rows) {
    for (const animation of row.getAnimations()) {
      if (animation instanceof CSSTransition) {
        animation.cancel()
      }
    }
  }
}

/**
 * react-aria drags a row with a mouse or a finger through the browser's own
 * drag and drop: a ghost and a drop line, which a phone starts on a long press
 * when it starts it at all. A pointer on the grip moves the row here instead,
 * while the rows it passes step aside, and the native drag is refused; the
 * keyboard and screen reader drag stay react-aria's, which never go through it.
 * A dropped row stays where the pointer left it until the new order is drawn,
 * rather than stepping back to its old place for the length of the round trip.
 */
export const usePointerReorder = ({
  grip,
  list,
  onMove,
  order,
  rows: rowSelector = '[data-key]'
}: PointerReorderOptions): void => {
  const land = useEffectEvent(onMove)
  const dropOrder = useEffectEvent(() => order)
  const held = useRef<{
    order: string
    rows: HTMLElement[]
    timer: number
  } | null>(null)

  const release = useEffectEvent((drawn: string) => {
    const drop = held.current
    const element = list.current

    if (drop === null || drop.order === drawn || element === null) {
      return
    }

    held.current = null
    clearTimeout(drop.timer)

    return whenRowsDrawn({
      list: element,
      onDrawn: () => {
        settleInPlace(drop.rows)
      },
      order: drawn
    })
  })

  useLayoutEffect(() => release(order), [order])

  useEffect(() => {
    const element = list.current

    if (element === null) {
      return
    }

    let drag: Drag | null = null

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || !(event.target instanceof Element)) {
        return
      }

      const handle = event.target.closest(grip)
      const row = handle?.closest<HTMLElement>('[data-key]')

      if (handle == null || row == null) {
        return
      }

      const rows = [...element.querySelectorAll<HTMLElement>(rowSelector)]
      const rects = rows.map((each) => each.getBoundingClientRect())
      const from = rows.indexOf(row)
      const next = rects[from + 1] ?? rects[from - 1]
      const own = rects[from]

      if (own === undefined) {
        return
      }

      event.preventDefault()
      handle.setPointerCapture(event.pointerId)
      row.setAttribute(LIFTED_ATTRIBUTE, '')
      drag = {
        from,
        middles: rects.map((rect) => rect.top + rect.height / 2),
        pitch: next === undefined ? own.height : Math.abs(next.top - own.top),
        pointerId: event.pointerId,
        rows,
        startY: event.clientY,
        to: from
      }
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (drag?.pointerId !== event.pointerId) {
        return
      }

      const { from, middles, pitch, rows, startY } = drag
      const offset = event.clientY - startY
      const middle = (middles[from] ?? 0) + offset
      const to = middles.filter(
        (each, at) => at !== from && each < middle
      ).length

      drag.to = to
      rows.forEach((row, at) => {
        const shift =
          at === from
            ? offset
            : at > from && at <= to
              ? -pitch
              : at < from && at >= to
                ? pitch
                : 0

        row.style.setProperty(SHIFT_PROPERTY, `${shift}px`)
      })
    }

    const onPointerEnd = (event: PointerEvent): void => {
      if (drag?.pointerId !== event.pointerId) {
        return
      }

      const { from, rows, to } = drag
      const key = rows[from]?.dataset.key

      drag = null

      if (event.type !== 'pointerup' || key === undefined || to === from) {
        settle(rows)
        return
      }

      held.current = {
        order: dropOrder(),
        rows,
        timer: window.setTimeout(() => {
          settle(rows)
          held.current = null
        }, HELD_DROP_MS)
      }
      land(key, to)
    }

    const onNativeDragStart = (event: DragEvent): void => {
      event.preventDefault()
    }

    element.addEventListener('dragstart', onNativeDragStart, true)
    element.addEventListener('pointerdown', onPointerDown)
    // On the document, not the list: react-aria's press on the grip releases
    // the pointer capture taken above, so a drop past the list's edge — over
    // the panel's sticky foot — never reached it and left the row lifted.
    const { ownerDocument } = element
    ownerDocument.addEventListener('pointermove', onPointerMove)
    ownerDocument.addEventListener('pointerup', onPointerEnd)
    ownerDocument.addEventListener('pointercancel', onPointerEnd)

    return () => {
      element.removeEventListener('dragstart', onNativeDragStart, true)
      element.removeEventListener('pointerdown', onPointerDown)
      ownerDocument.removeEventListener('pointermove', onPointerMove)
      ownerDocument.removeEventListener('pointerup', onPointerEnd)
      ownerDocument.removeEventListener('pointercancel', onPointerEnd)
      if (drag !== null) {
        settle(drag.rows)
      }
    }
  }, [grip, list, rowSelector])
}
