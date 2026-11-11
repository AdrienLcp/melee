import { type RefObject, useLayoutEffect, useRef } from 'react'

import { interpolatesToAuto } from '@/infrastructure/browser'
import {
  easeInOf,
  groundBehind,
  millisecondsOf,
  stillCopyOf
} from '@/presentation/still-copy'

const COPY_CLASS = 'reshape-copy'

type Drawn = {
  copy: HTMLElement
  element: HTMLElement
  height: number
  shape: string
}

const copyOf = (element: HTMLElement): HTMLElement =>
  stillCopyOf({ className: COPY_CLASS, element })

/**
 * Where the box's height eases to. The new content may still be opening once
 * the reshape has been drawn — the running order's rows unfold as they
 * arrive, 630px of a 4600px list on the first frame — so an engine that
 * interpolates to `auto` follows it; any other gets the height drawn now.
 */
const settledHeight = (drawnNow: number): string =>
  interpolatesToAuto() ? 'auto' : `${drawnNow}px`

const play = ({ before, box }: { before: Drawn; box: HTMLElement }): void => {
  const style = getComputedStyle(box)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))

  for (const running of box.querySelectorAll(`:scope > .${COPY_CLASS}`)) {
    running.remove()
  }

  if (duration === 0) {
    return
  }

  const easeOut =
    style.getPropertyValue('--ease-out').trim() ||
    'cubic-bezier(0.16, 1, 0.3, 1)'
  const easeIn = easeInOf(style)
  const { copy } = before
  const height = box.getBoundingClientRect().height

  copy.style.background = groundBehind(box)
  box.append(copy)
  // Gone on `--ease-in`: on `--ease-out` the old list was nine tenths faded
  // in the first frames and read as a cut, and a box that opens still holds
  // the old list over the new rows until it has room for them.
  copy
    .animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: easeIn })
    .finished.then(
      () => {
        copy.remove()
      },
      () => {
        copy.remove()
      }
    )

  if (Math.abs(before.height - height) >= 1) {
    box.animate(
      [{ height: `${before.height}px` }, { height: settledHeight(height) }],
      { duration, easing: height > before.height ? easeOut : easeIn }
    )
  }
}

/**
 * Plays a box whose content is laid out anew — one shape of list replaced by
 * another, where nothing can travel because the rows themselves change: a
 * copy of what was drawn fades out over the new content while the box eases
 * from its old height to its new. Only a change of `shape` plays; every other
 * commit just keeps the copy current. The box clips (`overflow: hidden`),
 * places the copy (`position: relative`, the copy at its top) and allows
 * `interpolate-size: allow-keywords`; under reduced motion the tokens are
 * nought and the new content simply lands.
 */
export const useCrossFadeOnReshape = ({
  box,
  shape
}: {
  box: RefObject<HTMLElement | null>
  /** What the content is laid out as: a change is what plays. */
  shape: string
}): void => {
  const drawn = useRef<Drawn | null>(null)

  useLayoutEffect(() => {
    const element = box.current

    if (element === null) {
      return
    }

    const before = drawn.current

    // A box mounted anew arrives on its own motion, with nothing on screen to
    // fade from.
    if (
      before !== null &&
      before.element === element &&
      before.shape !== shape
    ) {
      play({ before, box: element })
    }

    drawn.current = {
      copy: copyOf(element),
      element,
      height: element.getBoundingClientRect().height,
      shape
    }
  })
}
