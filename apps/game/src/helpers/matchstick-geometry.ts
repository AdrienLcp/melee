import type { StickPlace, StickSlot } from '@melee/protocol/matchsticks'

import { emptyPlacesOf, sticksOf } from '@melee/core/matchsticks/glyphs'

/** One stick's length and thickness, in the drawing's own units. */
export const STICK_LENGTH = 40
export const STICK_THICKNESS = 8

/** Corner to corner along a digit's side: the stick and a hair of gap at each end. */
const SPAN = 44
const GLYPH_GAP = 20
const DIGIT_WIDTH = SPAN
const SIGN_WIDTH = STICK_LENGTH
/** The `=` bars sit either side of a `-`, so a `+` and an `=` share a midline. */
const EQUALS_OFFSET = 8
const MARGIN = 8

/** Where a stick lies: its centre, and `0` lying flat with the head right, `-90` standing with the head up. */
export type StickPose = {
  angle: 0 | -90
  x: number
  y: number
}

const FLAT = 0
const STANDING = -90

const DIGIT_POSES: Readonly<Record<StickSlot, StickPose>> = {
  a: { angle: FLAT, x: SPAN / 2, y: 0 },
  b: { angle: STANDING, x: SPAN, y: SPAN / 2 },
  c: { angle: STANDING, x: SPAN, y: SPAN * 1.5 },
  d: { angle: FLAT, x: SPAN / 2, y: SPAN * 2 },
  e: { angle: STANDING, x: 0, y: SPAN * 1.5 },
  f: { angle: STANDING, x: 0, y: SPAN / 2 },
  g: { angle: FLAT, x: SPAN / 2, y: SPAN },
  h: { angle: FLAT, x: SIGN_WIDTH / 2, y: SPAN },
  v: { angle: STANDING, x: SIGN_WIDTH / 2, y: SPAN }
}

const isDigit = (glyph: string): boolean => /^\d$/.test(glyph)

const widthOf = (glyph: string): number =>
  isDigit(glyph) ? DIGIT_WIDTH : SIGN_WIDTH

/** Where each glyph's own drawing starts along the row. */
const glyphOffsets = (glyphs: string): number[] => {
  const offsets: number[] = []
  let x = 0

  for (const glyph of glyphs) {
    offsets.push(x)
    x += widthOf(glyph) + GLYPH_GAP
  }

  return offsets
}

const poseAt = (offset: number, slot: StickSlot): StickPose => {
  const pose = DIGIT_POSES[slot]

  return { ...pose, x: pose.x + offset }
}

export type DrawnStick = StickPlace & { pose: StickPose }

/** Every stick and every empty place of a row, and the box that frames them. */
export type MatchstickLayout = {
  /** The two fixed bars of each `=`. */
  bars: StickPose[]
  empties: DrawnStick[]
  sticks: DrawnStick[]
  viewBox: string
}

export const layoutOf = (glyphs: string): MatchstickLayout => {
  const offsets = glyphOffsets(glyphs)
  const bars: StickPose[] = []
  const empties: DrawnStick[] = []
  const sticks: DrawnStick[] = []

  ;[...glyphs].forEach((glyph, glyphIndex) => {
    const offset = offsets[glyphIndex] ?? 0

    if (glyph === '=') {
      for (const y of [SPAN - EQUALS_OFFSET, SPAN + EQUALS_OFFSET]) {
        bars.push({ angle: FLAT, x: offset + SIGN_WIDTH / 2, y })
      }

      return
    }

    for (const slot of sticksOf(glyph)) {
      sticks.push({ glyphIndex, pose: poseAt(offset, slot), slot })
    }

    for (const slot of emptyPlacesOf(glyph)) {
      empties.push({ glyphIndex, pose: poseAt(offset, slot), slot })
    }
  })

  const lastGlyph = glyphs.at(-1) ?? '0'
  const width = (offsets.at(-1) ?? 0) + widthOf(lastGlyph)
  const reach = STICK_THICKNESS / 2 + MARGIN

  return {
    bars,
    empties,
    sticks,
    viewBox: `${-reach} ${-reach} ${width + reach * 2} ${SPAN * 2 + reach * 2}`
  }
}

/** Where a place lies in a row of these glyphs. */
export const poseOf = ({
  glyphs,
  place
}: {
  glyphs: string
  place: StickPlace
}): StickPose => poseAt(glyphOffsets(glyphs)[place.glyphIndex] ?? 0, place.slot)

export const isSamePlace = ({
  left,
  right
}: {
  left: StickPlace
  right: StickPlace
}): boolean => left.glyphIndex === right.glyphIndex && left.slot === right.slot

/** The row as a sentence a screen reader says, with a true minus sign. */
export const spokenGlyphs = (glyphs: string): string =>
  [...glyphs].map((glyph) => (glyph === '-' ? '−' : glyph)).join(' ')
