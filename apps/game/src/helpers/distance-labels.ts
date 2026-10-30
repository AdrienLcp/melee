import type { Point, Size } from './map-view'

/** A rectangle on the frame, by its top-left corner and its size, in pixels. */
export type LabelBox = { height: number; width: number; x: number; y: number }

/** One label to place: the line it belongs to, from the pawn to the place, and how many characters it prints. */
export type DistanceLine = { characters: number; from: Point; to: Point }

/** The shares of its line a label tries in turn, the pawn's end first. */
const ALONG_TRIES = [0.3, 0.45, 0.6, 0.75] as const
/** A numeral of the numeric face is a little over half its size wide. */
const GLYPH_WIDTH = 0.62
const LINE_HEIGHT = 1.15
/** The label's halo, drawn outside the glyphs. */
const HALO = 4

const boxCentredOn = ([x, y]: Point, { height, width }: Size): LabelBox => ({
  height,
  width,
  x: x - width / 2,
  y: y - height / 2
})

const overlaps = (one: LabelBox, other: LabelBox): boolean =>
  one.x < other.x + other.width &&
  other.x < one.x + one.width &&
  one.y < other.y + other.height &&
  other.y < one.y + one.height

const isInside = (box: LabelBox, frame: Size): boolean =>
  box.x >= 0 &&
  box.y >= 0 &&
  box.x + box.width <= frame.width &&
  box.y + box.height <= frame.height

const pointAlong = ({ from, to }: DistanceLine, share: number): Point => [
  from[0] + (to[0] - from[0]) * share,
  from[1] + (to[1] - from[1]) * share
]

/** The size a label of `length` characters takes at `fontSize` pixels, its halo included. */
export const labelSize = ({
  fontSize,
  length
}: {
  fontSize: number
  length: number
}): Size => ({
  height: fontSize * LINE_HEIGHT + HALO,
  width: length * fontSize * GLYPH_WIDTH + HALO
})

/**
 * Where each line's label stands, or `null` for one with nowhere left to go:
 * each in turn tries a few points along its own line, then either side of its
 * pawn, and takes the first
 * that covers no pawn, no label already placed and nothing outside the frame.
 * A label left out is never lost — the list beside the map prints every
 * distance — whereas four piled on one another print none.
 */
export const placedDistanceLabels = ({
  fontSize,
  frame,
  lines,
  obstacles,
  pawn
}: {
  fontSize: number
  frame: Size
  lines: readonly DistanceLine[]
  obstacles: readonly LabelBox[]
  /** The pawn standing on each line's `from`, its tip there: a label may sit beside it. */
  pawn: Size
}): (Point | null)[] => {
  const taken = [...obstacles]

  return lines.map((line) => {
    const size = labelSize({ fontSize, length: line.characters })
    const besidePawn = pawn.width / 2 + size.width / 2 + HALO
    const pawnMiddle = line.from[1] - pawn.height / 2
    const tries: Point[] = [
      ...ALONG_TRIES.map((share) => pointAlong(line, share)),
      [line.from[0] + besidePawn, pawnMiddle],
      [line.from[0] - besidePawn, pawnMiddle]
    ]
    const spot = tries.find((at) => {
      const box = boxCentredOn(at, size)

      return (
        isInside(box, frame) && !taken.some((other) => overlaps(box, other))
      )
    })

    if (spot === undefined) {
      return null
    }

    taken.push(boxCentredOn(spot, size))

    return spot
  })
}

/** How small a crowded pawn may stand, as a share of its own size. */
const LEAST_PAWN_SCALE = 0.6

/**
 * How large the reveal's pawns stand: whole until two of them come closer
 * than a pawn's width, then shrunk towards that gap, so a table that all
 * landed in one place stays a cluster of pawns rather than one blot.
 */
export const crowdedPawnScale = ({
  pawnWidth,
  points
}: {
  pawnWidth: number
  points: readonly Point[]
}): number => {
  const nearestGap = Math.min(
    ...points.flatMap((one, index) =>
      points
        .slice(index + 1)
        .map((other) => Math.hypot(one[0] - other[0], one[1] - other[1]))
    )
  )

  return Math.min(1, Math.max(LEAST_PAWN_SCALE, nearestGap / pawnWidth))
}
