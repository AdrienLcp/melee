import type React from 'react'
import { type RefObject, useEffect, useRef } from 'react'

import {
  type MapView,
  type Point,
  pannedBy,
  pinched,
  type Size,
  zoomedAround
} from '@/helpers/map-view'

/** Past this many pixels a press is a drag rather than a tap: a finger is never still. */
const TAP_SLOP_PX = 8
/** How far from the pawn's middle a press still picks it up — a finger's width. */
const MARKER_GRAB_PX = 36
/** The pawn stands on the point it marks, so its middle is this far above it. */
const MARKER_MIDDLE_ABOVE_FOOT_PX = 21
/** One notch of a mouse wheel zooms by about a sixth. */
const WHEEL_ZOOM_RATE = 0.0015

type Gesture =
  | { kind: 'idle' }
  /** One finger down, not yet moved far enough to say what it is doing. */
  | {
      kind: 'pressing'
      onMarker: boolean
      pointerId: number
      start: Point
    }
  | { kind: 'panning'; last: Point; pointerId: number }
  /** `grab` keeps the pawn where it sat under the finger, so it never jumps to the fingertip. */
  | { grab: Point; kind: 'dragging'; pointerId: number }
  /**
   * Measured from where the fingers landed and the view they landed on, never
   * step by step: a step the frame's edges refuse would carry its slip into
   * every later one, and the place under the fingers would wander off.
   */
  | { from: readonly [Point, Point]; kind: 'pinching'; view: MapView }

type MapGestures = {
  frame: Size
  map: Size
  /** Where the pawn's foot is on the screen, or `null` with no pawn down. */
  markerAt: Point | null
  /** A tap or a drag puts the pawn's foot here; absent where the map takes no answer. */
  onPlace: ((at: Point) => void) | undefined
  setView: (update: (view: MapView) => MapView) => void
  surface: RefObject<SVGSVGElement | null>
  view: MapView
}

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * One finger pans, two pinch, a tap puts the pawn down and a press on the pawn
 * picks it up — on any pointer, so a touch wall, a phone and a mouse run the
 * same code. The page never scrolls under it: the surface claims every touch.
 */
export const useMapGestures = ({
  frame,
  map,
  markerAt,
  onPlace,
  setView,
  surface,
  view
}: MapGestures) => {
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture>({ kind: 'idle' })

  const pointOf = (event: { clientX: number; clientY: number }): Point => {
    const box = surface.current?.getBoundingClientRect()

    return [event.clientX - (box?.left ?? 0), event.clientY - (box?.top ?? 0)]
  }

  const firstTwo = (): readonly [Point, Point] | null => {
    const [a, b] = [...pointers.current.values()]

    return a === undefined || b === undefined ? null : [a, b]
  }

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const at = pointOf(event)

    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, at)

    const pair = firstTwo()

    if (pair !== null) {
      gesture.current = { from: pair, kind: 'pinching', view }
      return
    }

    gesture.current = {
      kind: 'pressing',
      onMarker:
        onPlace !== undefined &&
        markerAt !== null &&
        distance(at, [markerAt[0], markerAt[1] - MARKER_MIDDLE_ABOVE_FOOT_PX]) <
          MARKER_GRAB_PX,
      pointerId: event.pointerId,
      start: at
    }
  }

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) {
      return
    }

    const at = pointOf(event)
    const current = gesture.current

    pointers.current.set(event.pointerId, at)

    if (current.kind === 'pinching') {
      const pair = firstTwo()

      if (pair !== null) {
        setView(() =>
          pinched({
            frame,
            from: current.from,
            map,
            to: pair,
            view: current.view
          })
        )
      }
      return
    }

    if (current.kind === 'pressing') {
      if (distance(at, current.start) < TAP_SLOP_PX) {
        return
      }

      gesture.current =
        current.onMarker && markerAt !== null
          ? {
              grab: [
                markerAt[0] - current.start[0],
                markerAt[1] - current.start[1]
              ],
              kind: 'dragging',
              pointerId: current.pointerId
            }
          : {
              kind: 'panning',
              last: current.start,
              pointerId: current.pointerId
            }
    }

    const next = gesture.current

    if (next.kind === 'panning') {
      setView((view) =>
        pannedBy({
          by: [at[0] - next.last[0], at[1] - next.last[1]],
          frame,
          map,
          view
        })
      )
      gesture.current = { ...next, last: at }
    } else if (next.kind === 'dragging') {
      onPlace?.([at[0] + next.grab[0], at[1] + next.grab[1]])
    }
  }

  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    const current = gesture.current

    pointers.current.delete(event.pointerId)

    // A cancelled pointer — the browser took the touch back — puts nothing down.
    if (
      event.type === 'pointerup' &&
      current.kind === 'pressing' &&
      !current.onMarker
    ) {
      onPlace?.(pointOf(event))
    }

    // A pinch that loses a finger carries on as a pan under the one left, and
    // never as a tap: lifting two fingers is not putting a pawn down.
    const [remainingId, remaining] = [...pointers.current][0] ?? []

    gesture.current =
      remainingId === undefined || remaining === undefined
        ? { kind: 'idle' }
        : { kind: 'panning', last: remaining, pointerId: remainingId }
  }

  useEffect(() => {
    const element = surface.current

    if (element === null) {
      return
    }

    // Registered by hand because React's own wheel listener is passive, and a
    // passive one cannot stop the page zooming along with the map.
    const zoomOnWheel = (event: WheelEvent) => {
      event.preventDefault()

      const box = element.getBoundingClientRect()

      setView((view) =>
        zoomedAround({
          factor: Math.exp(-event.deltaY * WHEEL_ZOOM_RATE),
          focus: [event.clientX - box.left, event.clientY - box.top],
          frame,
          map,
          view
        })
      )
    }

    element.addEventListener('wheel', zoomOnWheel, { passive: false })

    return () => {
      element.removeEventListener('wheel', zoomOnWheel)
    }
  }, [frame, map, setView, surface])

  return {
    onPointerCancel: onPointerUp,
    onPointerDown,
    onPointerMove,
    onPointerUp
  }
}
