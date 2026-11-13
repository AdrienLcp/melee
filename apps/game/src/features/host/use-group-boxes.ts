import { type RefObject, useLayoutEffect, useState } from 'react'

/** The content box a group of pieces has to fit in, in pixels. */
export type GroupBox = { height: number; width: number }

type Measured = {
  boxes: ReadonlyMap<string, GroupBox>
  /** The root font size, which every floor a fit keeps is written in. */
  remPx: number
}

const contentBoxOf = (element: HTMLElement): GroupBox => {
  const style = getComputedStyle(element)

  return {
    height: Math.floor(
      element.clientHeight -
        Number.parseFloat(style.paddingBlockStart) -
        Number.parseFloat(style.paddingBlockEnd)
    ),
    width: Math.floor(
      element.clientWidth -
        Number.parseFloat(style.paddingInlineStart) -
        Number.parseFloat(style.paddingInlineEnd)
    )
  }
}

const isSameMeasure = ({
  measured,
  next
}: {
  measured: Measured
  next: Measured
}): boolean =>
  measured.remPx === next.remPx &&
  measured.boxes.size === next.boxes.size &&
  [...next.boxes].every(([group, box]) => {
    const before = measured.boxes.get(group)

    return before?.height === box.height && before.width === box.width
  })

/**
 * The box every `[data-group]` inside the container gives its pieces, read
 * again whenever one of them is resized. The groups must be laid out by the
 * stylesheet alone — a grid track, never their content — or a fit read off
 * them would chase itself; and they must all be mounted from the start, since
 * only those present on the first layout are watched.
 */
export const useGroupBoxes = (
  container: RefObject<HTMLElement | null>
): Measured => {
  const [measured, setMeasured] = useState<Measured>({
    boxes: new Map(),
    remPx: 16
  })

  useLayoutEffect(() => {
    const element = container.current

    if (element === null) {
      return
    }

    const groups = [...element.querySelectorAll<HTMLElement>('[data-group]')]
    const measure = () => {
      const next = {
        boxes: new Map(
          groups.map((group) => [
            group.dataset.group ?? '',
            contentBoxOf(group)
          ])
        ),
        remPx:
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize
          ) || 16
      }

      setMeasured((current) =>
        isSameMeasure({ measured: current, next }) ? current : next
      )
    }
    const observer = new ResizeObserver(measure)

    measure()

    for (const group of groups) {
      observer.observe(group)
    }

    return () => {
      observer.disconnect()
    }
  }, [container])

  return measured
}
