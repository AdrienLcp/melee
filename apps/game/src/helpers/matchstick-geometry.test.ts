import { describe, expect, it } from 'vitest'

import type { StickPlace } from '@melee/protocol/matchsticks'

import {
  layoutOf,
  type MatchstickLayout,
  movedLayoutOf,
  nearestPlace,
  poseOf,
  stickLiftedBy
} from './matchstick-geometry'

const GLYPHS = '1+1=2'
const BAR: StickPlace = { glyphIndex: 1, slot: 'h' }
const UPRIGHT: StickPlace = { glyphIndex: 1, slot: 'v' }

/** A press halfway along each arm of the bar, where the upright is furthest. */
const armPoints = (() => {
  const { x, y } = poseOf({ glyphs: GLYPHS, place: BAR })

  return [
    { x: x - 15, y },
    { x: x + 15, y }
  ]
})()

const liftedAt = ({
  layout,
  point
}: {
  layout: MatchstickLayout
  point: { x: number; y: number }
}): StickPlace | null => {
  const pressed = nearestPlace({ candidates: layout.sticks, point, reach: 30 })

  if (pressed === null) {
    return null
  }

  const { glyphIndex, slot } = stickLiftedBy({ pressed, sticks: layout.sticks })

  return { glyphIndex, slot }
}

describe('a press on a plus', () => {
  it('[matchsticks] lifts the upright of a whole plus, pressed on either arm of its bar', () => {
    const layout = layoutOf(GLYPHS)

    for (const point of armPoints) {
      expect(liftedAt({ layout, point })).toEqual(UPRIGHT)
    }
  })

  it('[matchsticks] lifts the bar once the upright has moved, as the minus it then is', () => {
    const layout = movedLayoutOf({
      glyphs: GLYPHS,
      move: { from: UPRIGHT, to: { glyphIndex: 0, slot: 'e' } }
    })

    for (const point of armPoints) {
      expect(liftedAt({ layout, point })).toEqual(BAR)
    }
  })

  it('[matchsticks] lifts a minus by its bar', () => {
    const layout = layoutOf('1-1=0')

    for (const point of armPoints) {
      expect(liftedAt({ layout, point })).toEqual(BAR)
    }
  })
})
