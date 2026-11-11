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
  /**
   * The height painted last, kept by an observer: measured on the commit that
   * starts a glide, it read the glide's first frame, and the next reshape
   * eased from that height to the same one — no glide at all.
   */
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

/** A reshape on screen: its height glide, and when its copy has faded. */
type Playing = {
  glide: Animation | null
  until: number
}

const heightFrames = ({
  from,
  to
}: {
  from: number
  to: string
}): Keyframe[] => [
  // Border-box in both frames, as the observer measures it: a padded box drew
  // its padding twice over and dropped by it as the glide ended.
  { boxSizing: 'border-box', height: `${from}px` },
  { boxSizing: 'border-box', height: to }
]

/**
 * Whether this box's height eases to `auto` at all: an engine may interpolate
 * the keyword and still not for every box — the own lines' fold, a grid item
 * of one `1fr` row, flipped to its new height at once — so a linear glide is
 * sampled halfway and dropped.
 */
const easesToAuto = ({ box, from }: { box: HTMLElement; from: number }) => {
  const sample = box.animate(heightFrames({ from, to: 'auto' }), 1000)

  sample.currentTime = 500

  const halfway = box.getBoundingClientRect().height

  sample.cancel()

  const settled = box.getBoundingClientRect().height

  return Math.abs(halfway - from) >= 1 && Math.abs(halfway - settled) >= 1
}

const glideHeight = ({
  box,
  from,
  to
}: {
  box: HTMLElement
  from: number
  to: number
}): Animation | null => {
  if (Math.abs(from - to) < 1) {
    return null
  }

  const style = getComputedStyle(box)
  const easeOut =
    style.getPropertyValue('--ease-out').trim() ||
    'cubic-bezier(0.16, 1, 0.3, 1)'
  const target =
    settledHeight(to) === 'auto' && easesToAuto({ box, from })
      ? 'auto'
      : `${to}px`

  return box.animate(heightFrames({ from, to: target }), {
    duration: millisecondsOf(style.getPropertyValue('--transition-base')),
    easing: to > from ? easeOut : easeInOf(style)
  })
}

const play = ({
  before,
  box
}: {
  before: Drawn
  box: HTMLElement
}): Playing | null => {
  const style = getComputedStyle(box)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))

  for (const running of box.querySelectorAll(`:scope > .${COPY_CLASS}`)) {
    running.remove()
  }

  if (duration === 0) {
    return null
  }

  const { copy } = before

  const ground = groundBehind(box)

  copy.style.background = ground
  box.append(copy)

  // The rest of the box, down over the margin its clip leaves for a focus
  // ring, is covered too: the copy is only as tall as what it shows, so what
  // the new content held below it was drawn at once — the note of an entry
  // played out over an empty sheet cut in, and a switch arriving under the
  // box's edge showed its first eight pixels. Stretching the copy instead
  // stretched its rows.
  const cover = document.createElement('div')

  cover.className = COPY_CLASS
  cover.setAttribute('aria-hidden', 'true')
  cover.style.background = ground
  cover.style.insetBlockStart = `${copy.getBoundingClientRect().height}px`
  cover.style.insetBlockEnd = `calc(-1 * ${style.overflowClipMargin || '0px'})`
  box.append(cover)

  // Gone on `--ease-in`: on `--ease-out` the old list was nine tenths faded
  // in the first frames and read as a cut, and a box that opens still holds
  // the old list over the new rows until it has room for them.
  for (const layer of [copy, cover]) {
    layer
      .animate([{ opacity: 1 }, { opacity: 0 }], {
        duration,
        easing: easeInOf(style)
      })
      .finished.then(
        () => {
          layer.remove()
        },
        () => {
          layer.remove()
        }
      )
  }

  return {
    glide: glideHeight({
      box,
      from: before.height,
      to: box.getBoundingClientRect().height
    }),
    until: performance.now() + duration
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
  const playing = useRef<Playing | null>(null)

  useLayoutEffect(() => {
    const element = box.current

    if (element === null) {
      return
    }

    // A list whose rows land a render after the reshape — `GridList` mounts
    // them late — measured the old height on the commit and snapped to the
    // new one under the fading copy: a resize while the copy fades, with no
    // glide running, glides from the height painted last.
    const observer = new ResizeObserver(([entry]) => {
      const [border] = entry?.borderBoxSize ?? []
      const before = drawn.current
      const now = playing.current

      if (before?.element !== element || border === undefined) {
        return
      }

      if (
        now !== null &&
        performance.now() < now.until &&
        now.glide?.playState !== 'running'
      ) {
        now.glide = glideHeight({
          box: element,
          from: before.height,
          to: border.blockSize
        })
      }

      before.height = border.blockSize
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

    // A box mounted anew arrives on its own motion, with nothing on screen to
    // fade from.
    if (
      before !== null &&
      before.element === element &&
      before.shape !== shape
    ) {
      playing.current?.glide?.cancel()
      playing.current = play({ before, box: element })
    }

    drawn.current = {
      copy: copyOf(element),
      element,
      height:
        before?.element === element
          ? before.height
          : element.getBoundingClientRect().height,
      shape
    }
  })
}
