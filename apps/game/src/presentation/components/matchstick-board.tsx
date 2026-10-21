import type React from 'react'
import {
  Button as ReactAriaButton,
  ToggleButton as ReactAriaToggleButton,
  Toolbar
} from 'react-aria-components'

import type { StickPlace, StickSlot } from '@melee/protocol/matchsticks'

import {
  type DrawnStick,
  isSamePlace,
  layoutOf,
  type MatchstickBox,
  STICK_LENGTH,
  spokenGlyph
} from '@/helpers/matchstick-geometry'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { MatchstickRow } from './matchstick-row'

import './matchstick-board.sass'

type MatchstickBoardProps = {
  /** Read out as the board's name. */
  'aria-label': string
  /** Focus the first stick on mount: the board is back after a move was put back. */
  autoFocus?: boolean
  glyphs: string
  /** The stick being held, and `null` while none is. */
  lifted: StickPlace | null
  /** An empty place pressed while a stick is held. */
  onLay: (place: StickPlace) => void
  /** A stick picked up, or the held one put back with `null`. */
  onLift: (place: StickPlace | null) => void
}

/**
 * A press's reach around a stick, in the drawing's units: a little short of
 * its length so two sticks meeting at a corner do not overlap much, and far
 * wider than the wood so a thumb finds it.
 */
const HIT_LENGTH = STICK_LENGTH - 8
const HIT_WIDTH = 22

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

const reachOf = (place: Place, box: MatchstickBox): React.CSSProperties => {
  const isStanding = place.pose.angle !== 0
  const width = isStanding ? HIT_WIDTH : HIT_LENGTH
  const height = isStanding ? HIT_LENGTH : HIT_WIDTH

  return {
    '--reach-height': percentOf(height, box.height),
    '--reach-left': percentOf(place.pose.x - width / 2 - box.x, box.width),
    '--reach-top': percentOf(place.pose.y - height / 2 - box.y, box.height),
    '--reach-width': percentOf(width, box.width)
  }
}

/**
 * The puzzle as something to play with: every stick a press that picks it up,
 * and once one is held every empty place a press that lays it there. One stop
 * in the tab order, walked with the arrows in reading order, so the keyboard
 * plays it as a pointer or a finger does.
 */
export const MatchstickBoard: React.FC<MatchstickBoardProps> = ({
  'aria-label': ariaLabel,
  autoFocus = false,
  glyphs,
  lifted,
  onLay,
  onLift
}) => {
  const translate = useTranslate()
  const layout = layoutOf(glyphs)
  const chars = [...glyphs]
  const places: Place[] = [
    ...layout.sticks.map((stick) => ({ ...stick, isEmpty: false })),
    ...layout.empties.map((empty) => ({ ...empty, isEmpty: true }))
  ].toSorted(inReadingOrder)

  const firstStickAt = places.findIndex((place) => !place.isEmpty)

  const nameOf = (place: Place): string =>
    translate(
      place.isEmpty ? 'matchsticks.move.groove' : 'matchsticks.move.stick',
      {
        glyph: spokenGlyph(chars[place.glyphIndex] ?? ''),
        position: place.glyphIndex + 1,
        slot: translate(SLOT_KEYS[place.slot])
      }
    )

  return (
    <div
      className='matchstick-board'
      style={{ '--board-aspect': layout.box.width / layout.box.height }}
    >
      <MatchstickRow glyphs={glyphs} lifted={lifted} />
      <Toolbar aria-label={ariaLabel} className='reaches'>
        {places.map((place, index) =>
          place.isEmpty ? (
            <ReactAriaButton
              aria-label={nameOf(place)}
              className='reach groove-reach'
              isDisabled={lifted === null}
              key={`${place.glyphIndex}${place.slot}`}
              onPress={() => onLay(place)}
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
              onChange={(isHeld) =>
                onLift(
                  isHeld
                    ? { glyphIndex: place.glyphIndex, slot: place.slot }
                    : null
                )
              }
              style={reachOf(place, layout.box)}
            />
          )
        )}
      </Toolbar>
    </div>
  )
}
