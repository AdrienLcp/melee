import { type RefObject, useLayoutEffect, useRef } from 'react'

import { millisecondsOf } from '@/presentation/still-copy'

type Size = {
  height: number
  width: number
}

type Drawn = {
  glide: Animation | null
  /** The size painted last, kept by the observer through folds and glides. */
  size: Size
  swap: unknown
}

const DEFAULT_EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const sizeOf = (element: HTMLElement): Size => {
  const { height, width } = element.getBoundingClientRect()

  return { height, width }
}

const frameOf = ({ height, width }: Size): Keyframe => ({
  blockSize: `${height}px`,
  // Border-box in both frames whatever the box's own sizing, so the sizes
  // drawn are the sizes eased between.
  boxSizing: 'border-box',
  inlineSize: `${width}px`,
  overflow: 'clip'
})

const glide = ({
  box,
  from,
  to
}: {
  box: HTMLElement
  from: Size
  to: Size
}): Animation | null => {
  const style = getComputedStyle(box)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))

  if (
    duration === 0 ||
    (Math.abs(from.width - to.width) < 1 &&
      Math.abs(from.height - to.height) < 1)
  ) {
    return null
  }

  return box.animate([frameOf(from), frameOf(to)], {
    duration,
    easing: style.getPropertyValue('--ease-out').trim() || DEFAULT_EASE_OUT
  })
}

/**
 * Eases a box from the size it was painted at to the size its new content
 * takes, on both axes, when `swap` changes while the box is on screen: a
 * line of text replaced by a longer one widens its box rather than throwing
 * what stands beside it sideways in one frame, and a swap landing mid-glide
 * eases on from where the box stands. `null` says the box is not on screen —
 * folded away — and a change to or from it plays nothing, the fold being the
 * motion then. The box is one element for the component's life, and its
 * content is the caller's to fade in; under reduced motion the tokens are
 * nought and the new size simply lands.
 */
export const useSizeGlideOnSwap = ({
  box,
  swap
}: {
  box: RefObject<HTMLElement | null>
  /** What the box holds, or `null` while it is not on screen. */
  swap: unknown
}): void => {
  const drawn = useRef<Drawn | null>(null)

  useLayoutEffect(() => {
    const element = box.current

    if (element === null) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      const [border] = entry?.borderBoxSize ?? []

      if (drawn.current !== null && border !== undefined) {
        drawn.current.size = {
          height: border.blockSize,
          width: border.inlineSize
        }
      }
    })

    observer.observe(element, { box: 'border-box' })

    return () => {
      observer.disconnect()
    }
  }, [box])

  useLayoutEffect(() => {
    const element = box.current

    if (element === null) {
      return
    }

    const before = drawn.current

    if (before === null) {
      drawn.current = { glide: null, size: sizeOf(element), swap }
      return
    }

    if (before.swap === swap) {
      return
    }

    before.glide?.cancel()

    const isOnScreen = before.swap !== null && swap !== null

    drawn.current = {
      glide: isOnScreen
        ? glide({ box: element, from: before.size, to: sizeOf(element) })
        : null,
      size: before.size,
      swap
    }
  })
}
