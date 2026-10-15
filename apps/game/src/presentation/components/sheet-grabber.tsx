import type React from 'react'
import { useRef } from 'react'

import './sheet-grabber.sass'

/** A pull past this share of the sheet's height puts it away. */
const DISMISS_SHARE = 0.25
/** A flick faster than this, in pixels per millisecond, puts it away whatever the distance. */
const DISMISS_VELOCITY = 0.6
/** How far an upward pull moves the sheet for each pixel the thumb goes: it gives, then holds. */
const UPWARD_GIVE = 1 / 6

type Pull = {
  lastTime: number
  lastY: number
  sheet: HTMLElement
  startY: number
  velocity: number
}

type SheetGrabberProps = {
  /** Called once a pull or a flick has gone far enough to put the sheet away. */
  onDismiss: () => void
}

/**
 * The strip across the top of a sheet that a thumb pulls it down by. It must
 * be the sheet's first child: the sheet follows the thumb through
 * `--drag-offset`, which its rise ends on, so a sheet let go leaves from where
 * it was dropped.
 */
export const SheetGrabber: React.FC<SheetGrabberProps> = ({ onDismiss }) => {
  const pullRef = useRef<Pull | null>(null)

  const release = (): void => {
    const pull = pullRef.current

    if (pull === null) {
      return
    }

    pullRef.current = null
    delete pull.sheet.dataset.dragging

    const offset = pull.lastY - pull.startY
    const isDismissed =
      offset > pull.sheet.offsetHeight * DISMISS_SHARE ||
      pull.velocity > DISMISS_VELOCITY

    if (isDismissed) {
      onDismiss()

      return
    }

    pull.sheet.dataset.settling = ''
    pull.sheet.style.removeProperty('--drag-offset')
    pull.sheet.addEventListener(
      'transitionend',
      () => {
        delete pull.sheet.dataset.settling
      },
      { once: true }
    )
  }

  return (
    <div
      aria-hidden='true'
      className='sheet-grabber'
      onPointerCancel={release}
      onPointerDown={(event) => {
        const sheet = event.currentTarget.parentElement

        if (sheet === null) {
          return
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        sheet.dataset.dragging = ''
        delete sheet.dataset.settling
        pullRef.current = {
          lastTime: event.timeStamp,
          lastY: event.clientY,
          sheet,
          startY: event.clientY,
          velocity: 0
        }
      }}
      onPointerMove={(event) => {
        const pull = pullRef.current

        if (pull === null) {
          return
        }

        const elapsed = Math.max(1, event.timeStamp - pull.lastTime)
        pull.velocity = (event.clientY - pull.lastY) / elapsed
        pull.lastY = event.clientY
        pull.lastTime = event.timeStamp

        const offset = event.clientY - pull.startY
        pull.sheet.style.setProperty(
          '--drag-offset',
          `${offset > 0 ? offset : offset * UPWARD_GIVE}px`
        )
      }}
      onPointerUp={release}
    />
  )
}
