import { type RefObject, useEffect, useEffectEvent } from 'react'

/** The custom property a row is shifted by while a finger drags. */
const SHIFT_PROPERTY = '--touch-shift'
/** The attribute the row under the finger carries, for the sheet to lift it. */
const LIFTED_ATTRIBUTE = 'data-touch-lifted'

type TouchReorderOptions = {
  /** Matches the grip inside a row that a finger picks the row up by. */
  grip: string
  /** The list whose `[data-key]` rows are reordered. */
  list: RefObject<HTMLElement | null>
  /** Called once the finger lifts, with the row's key and the index it lands at. */
  onMove: (key: string, at: number) => void
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

/**
 * react-aria drags a row through the browser's own drag and drop, which a
 * phone starts on a long press when it starts it at all. A finger on the grip
 * moves the row here instead, on pointer events, while the rows it passes step
 * aside; a mouse and the keyboard stay react-aria's.
 */
export const useTouchReorder = ({
  grip,
  list,
  onMove
}: TouchReorderOptions): void => {
  const land = useEffectEvent(onMove)

  useEffect(() => {
    const element = list.current

    if (element === null) {
      return
    }

    let drag: Drag | null = null

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse' || !(event.target instanceof Element)) {
        return
      }

      const handle = event.target.closest(grip)
      const row = handle?.closest<HTMLElement>('[data-key]')

      if (handle == null || row == null) {
        return
      }

      const rows = [...element.querySelectorAll<HTMLElement>('[data-key]')]
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
      settle(rows)

      if (event.type === 'pointerup' && key !== undefined && to !== from) {
        land(key, to)
      }
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerEnd)
    element.addEventListener('pointercancel', onPointerEnd)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerEnd)
      element.removeEventListener('pointercancel', onPointerEnd)
      if (drag !== null) {
        settle(drag.rows)
      }
    }
  }, [grip, list])
}
