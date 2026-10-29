import type React from 'react'
import { useState } from 'react'
import {
  Button as ReactAriaButton,
  ToggleButton as ReactAriaToggleButton,
  Toolbar
} from 'react-aria-components'

import type {
  StickMove,
  StickPlace,
  StickSlot
} from '@melee/protocol/matchsticks'

import {
  type DrawingPoint,
  type DrawnStick,
  isSamePlace,
  type MatchstickBox,
  type MatchstickLayout,
  movedLayoutOf,
  nearestPlace,
  STICK_LENGTH,
  type StickPose,
  spokenGlyph
} from '@/helpers/matchstick-geometry'
import { placedBy, shownMoveOf } from '@/helpers/stick-move'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { MatchstickRow } from './matchstick-row'

import './matchstick-board.sass'

type MatchstickBoardProps = {
  /** Read out as the board's name. */
  'aria-label': string
  /** Focus the first stick on mount: the board is back after a move was put back. */
  autoFocus?: boolean
  /** The puzzle as dealt. */
  glyphs: string
  /** The stick being held, and `null` while none is. */
  lifted: StickPlace | null
  /** A stick picked up — by a press, or as a drag leaves it — or the held one put back with `null`. */
  onLift: (place: StickPlace | null) => void
  /** The held stick laid down: the move it makes now, or `null` once it is back where it started. */
  onPlace: (move: StickMove | null) => void
  /** The one stick moved so far, drawn where it was laid; `null` before any. */
  placed: StickMove | null
}

/**
 * How far from a stick a press still picks it up, and how far from a groove
 * a dragged stick still drops into it, in the drawing's units: about half a
 * stick, so a thumb on a small screen need only land near one.
 */
const GRAB_REACH = 24
const DROP_REACH = 30
/** How far a pointer travels, in CSS pixels, before a press becomes a drag. */
const DRAG_SLOP = 6

/** Top to bottom, then the signs' two strokes: the order a reader walks a glyph. */
const READING_ORDER: readonly StickSlot[] = [
  'a',
  'f',
  'b',
  'g',
  'h',
  'v',
  'e',
  'c',
  'd'
]

const SLOT_KEYS = {
  a: 'matchsticks.move.slot.a',
  b: 'matchsticks.move.slot.b',
  c: 'matchsticks.move.slot.c',
  d: 'matchsticks.move.slot.d',
  e: 'matchsticks.move.slot.e',
  f: 'matchsticks.move.slot.f',
  g: 'matchsticks.move.slot.g',
  h: 'matchsticks.move.slot.h',
  v: 'matchsticks.move.slot.v'
} as const satisfies Record<StickSlot, PlainTranslationKey>

type Place = DrawnStick & { isEmpty: boolean }

const inReadingOrder = (left: Place, right: Place): number =>
  left.glyphIndex - right.glyphIndex ||
  READING_ORDER.indexOf(left.slot) - READING_ORDER.indexOf(right.slot)

const percentOf = (value: number, total: number): string =>
  `${(value / total) * 100}%`

/** The box a focused place is ringed in: a little short of a stick, so two meeting at a corner do not overlap much. */
const RING_LENGTH = STICK_LENGTH - 8
const RING_WIDTH = 22

const reachOf = (place: Place, box: MatchstickBox): React.CSSProperties => {
  const isStanding = place.pose.angle !== 0
  const width = isStanding ? RING_WIDTH : RING_LENGTH
  const height = isStanding ? RING_LENGTH : RING_WIDTH

  return {
    '--reach-height': percentOf(height, box.height),
    '--reach-left': percentOf(place.pose.x - width / 2 - box.x, box.width),
    '--reach-top': percentOf(place.pose.y - height / 2 - box.y, box.height),
    '--reach-width': percentOf(width, box.width)
  }
}

/** A press on the board, from the moment it lands until it lifts. */
type Press = {
  /** Where the stick's centre sits from the pointer, so it does not jump to the finger. */
  grip: DrawingPoint
  hasTravelled: boolean
  /** The place pressed: a stick to pick up, or an empty place to lay the held one on. */
  place: Place
  pointer: DrawingPoint
  pointerId: number
  startX: number
  startY: number
}

const pointInDrawing = ({
  box,
  event
}: {
  box: MatchstickBox
  event: React.PointerEvent<HTMLElement>
}): DrawingPoint => {
  const rect = event.currentTarget.getBoundingClientRect()

  return {
    x: box.x + ((event.clientX - rect.left) / rect.width) * box.width,
    y: box.y + ((event.clientY - rect.top) / rect.height) * box.height
  }
}

const placesOf = (layout: MatchstickLayout): Place[] =>
  [
    ...layout.sticks.map((stick) => ({ ...stick, isEmpty: false })),
    ...layout.empties.map((empty) => ({ ...empty, isEmpty: true }))
  ].toSorted(inReadingOrder)

const stickPlaceOf = (place: StickPlace): StickPlace => ({
  glyphIndex: place.glyphIndex,
  slot: place.slot
})

const centreOf = (press: Press): DrawingPoint => ({
  x: press.pointer.x + press.grip.x,
  y: press.pointer.y + press.grip.y
})

/**
 * The puzzle as something to play with: any stick dragged onto any empty
 * place — the nearest within reach of where it is let go — or pressed to pick
 * it up and an empty place pressed to lay it. One stop in the tab order,
 * walked with the arrows in reading order, so the keyboard plays it as a
 * pointer or a finger does. After a move the board stays in play: the moved
 * stick laid again keeps where it came from, laid back there is no move at
 * all, and another stick picked up puts the first one back.
 */
export const MatchstickBoard: React.FC<MatchstickBoardProps> = ({
  'aria-label': ariaLabel,
  autoFocus = false,
  glyphs,
  lifted,
  onLift,
  onPlace,
  placed
}) => {
  const translate = useTranslate()
  const [press, setPress] = useState<Press | null>(null)
  const [hovered, setHovered] = useState<StickPlace | null>(null)
  const chars = [...glyphs]
  const dragged = press?.hasTravelled && !press.place.isEmpty ? press : null
  const held = dragged === null ? lifted : stickPlaceOf(dragged.place)
  const shownMove = shownMoveOf({ lifted: held, placed })
  const layout = movedLayoutOf({ glyphs, move: shownMove })
  const places = placesOf(layout)
  const firstStickAt = places.findIndex((place) => !place.isEmpty)
  const target =
    dragged === null
      ? null
      : nearestPlace({
          candidates: layout.empties,
          point: centreOf(dragged),
          reach: DROP_REACH
        })
  const heldAt: StickPose | null =
    dragged === null
      ? null
      : {
          ...centreOf(dragged),
          angle: target?.pose.angle ?? dragged.place.pose.angle
        }

  const lay = ({ from, to }: { from: StickPlace; to: StickPlace }): void =>
    onPlace(placedBy({ lifted: from, placed, to }))

  const placeUnder = (point: DrawingPoint): Place | null =>
    nearestPlace({
      candidates: places.filter((place) => !place.isEmpty || lifted !== null),
      point,
      reach: GRAB_REACH
    })

  const nameOf = (place: Place): string =>
    translate(
      place.isEmpty ? 'matchsticks.move.groove' : 'matchsticks.move.stick',
      {
        glyph: spokenGlyph(chars[place.glyphIndex] ?? ''),
        position: place.glyphIndex + 1,
        slot: translate(SLOT_KEYS[place.slot])
      }
    )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || press !== null) {
      return
    }

    const pointer = pointInDrawing({ box: layout.box, event })
    const place = placeUnder(pointer)

    if (place === null) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setHovered(null)
    setPress({
      grip: { x: place.pose.x - pointer.x, y: place.pose.y - pointer.y },
      hasTravelled: false,
      place,
      pointer,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    })
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const pointer = pointInDrawing({ box: layout.box, event })

    if (press === null) {
      if (event.pointerType === 'mouse') {
        const place = placeUnder(pointer)

        setHovered(place === null ? null : stickPlaceOf(place))
      }

      return
    }

    if (press.pointerId !== event.pointerId) {
      return
    }

    const hasTravelled =
      press.hasTravelled ||
      Math.hypot(event.clientX - press.startX, event.clientY - press.startY) >
        DRAG_SLOP

    if (hasTravelled && !press.hasTravelled && !press.place.isEmpty) {
      onLift(stickPlaceOf(press.place))
    }

    setPress({ ...press, hasTravelled, pointer })
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (press === null || press.pointerId !== event.pointerId) {
      return
    }

    setPress(null)

    const pressed = stickPlaceOf(press.place)

    if (dragged !== null) {
      if (target === null) {
        onLift(null)
      } else {
        lay({ from: pressed, to: stickPlaceOf(target) })
      }

      return
    }

    if (press.place.isEmpty) {
      if (lifted !== null) {
        lay({ from: lifted, to: pressed })
      }

      return
    }

    onLift(
      lifted !== null && isSamePlace({ left: lifted, right: pressed })
        ? null
        : pressed
    )
  }

  const onPointerCancel = (): void => {
    if (dragged !== null) {
      onLift(null)
    }

    setPress(null)
  }

  return (
    <div
      className='matchstick-board'
      data-dragging={dragged !== null || undefined}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerLeave={() => setHovered(null)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ '--board-aspect': layout.box.width / layout.box.height }}
    >
      <MatchstickRow
        aimed={dragged === null ? hovered : target}
        glyphs={glyphs}
        heldAt={heldAt}
        isStill
        lifted={held}
        move={shownMove}
      />
      <Toolbar aria-label={ariaLabel} className='reaches'>
        {places.map((place, index) =>
          place.isEmpty ? (
            <ReactAriaButton
              aria-label={nameOf(place)}
              className='reach groove-reach'
              isDisabled={lifted === null}
              key={`${place.glyphIndex}${place.slot}`}
              onPress={() => {
                if (lifted !== null) {
                  lay({ from: lifted, to: stickPlaceOf(place) })
                }
              }}
              style={reachOf(place, layout.box)}
            />
          ) : (
            <ReactAriaToggleButton
              aria-label={nameOf(place)}
              autoFocus={autoFocus && index === firstStickAt}
              className='reach stick-reach'
              isSelected={
                lifted !== null && isSamePlace({ left: place, right: lifted })
              }
              key={`${place.glyphIndex}${place.slot}`}
              onChange={(isHeld) => onLift(isHeld ? stickPlaceOf(place) : null)}
              style={reachOf(place, layout.box)}
            />
          )
        )}
      </Toolbar>
    </div>
  )
}
