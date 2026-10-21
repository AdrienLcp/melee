import type { StickSlot } from '@melee/protocol/matchsticks'

/**
 * The seven-segment shapes every matchstick puzzle is drawn in: a `1` stands
 * on the right (`b`, `c`), a `7` is three sticks, and a `6` and a `9` both
 * carry their tail — which is what lets one stick turn a `6` into an `8`.
 */
const DIGIT_SLOTS: ReadonlyMap<string, readonly StickSlot[]> = new Map([
  ['0', ['a', 'b', 'c', 'd', 'e', 'f']],
  ['1', ['b', 'c']],
  ['2', ['a', 'b', 'd', 'e', 'g']],
  ['3', ['a', 'b', 'c', 'd', 'g']],
  ['4', ['b', 'c', 'f', 'g']],
  ['5', ['a', 'c', 'd', 'f', 'g']],
  ['6', ['a', 'c', 'd', 'e', 'f', 'g']],
  ['7', ['a', 'b', 'c']],
  ['8', ['a', 'b', 'c', 'd', 'e', 'f', 'g']],
  ['9', ['a', 'b', 'c', 'd', 'f', 'g']]
])

/** A `-` is the `+` without its upright, so the two are one place with one stick missing. */
const SIGN_SLOTS: ReadonlyMap<string, readonly StickSlot[]> = new Map([
  ['+', ['h', 'v']],
  ['-', ['h']]
])

const DIGIT_PLACES: readonly StickSlot[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
const SIGN_PLACES: readonly StickSlot[] = ['h', 'v']

/**
 * The glyphs a place may read as. A digit stays a digit and a sign a sign,
 * because a stick moved never changes how many glyphs there are; `=` belongs
 * to neither, since taking a stick off it leaves a second minus and no
 * equation.
 */
const familyOf = (
  glyph: string
): {
  glyphs: ReadonlyMap<string, readonly StickSlot[]>
  places: readonly StickSlot[]
} | null => {
  if (DIGIT_SLOTS.has(glyph)) {
    return { glyphs: DIGIT_SLOTS, places: DIGIT_PLACES }
  }

  return SIGN_SLOTS.has(glyph)
    ? { glyphs: SIGN_SLOTS, places: SIGN_PLACES }
    : null
}

/** The sticks a glyph is drawn with — none for `=`, whose two bars never move. */
export const sticksOf = (glyph: string): readonly StickSlot[] =>
  familyOf(glyph)?.glyphs.get(glyph) ?? []

/** Where a stick could be laid on this glyph's place. */
export const emptyPlacesOf = (glyph: string): StickSlot[] => {
  const sticks = sticksOf(glyph)

  return (familyOf(glyph)?.places ?? []).filter(
    (slot) => !sticks.includes(slot)
  )
}

/**
 * What a glyph's place reads as with these sticks on it, or `null` when they
 * draw nothing — a lone stick where a digit stands, or a `+` with no bar.
 */
export const glyphWith = ({
  place,
  sticks
}: {
  /** The glyph the place held before, which says whether it holds a digit or a sign. */
  place: string
  sticks: readonly StickSlot[]
}): string | null => {
  const family = familyOf(place)

  if (family === null) {
    return null
  }

  for (const [glyph, slots] of family.glyphs) {
    if (
      slots.length === sticks.length &&
      slots.every((slot) => sticks.includes(slot))
    ) {
      return glyph
    }
  }

  return null
}
