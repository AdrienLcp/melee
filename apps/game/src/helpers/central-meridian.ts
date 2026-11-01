const FULL_TURN = 360

/** A longitude brought into the map's own range, -180° up to 180°. */
const wrapped = (longitude: number): number =>
  ((((longitude + 180) % FULL_TURN) + FULL_TURN) % FULL_TURN) - 180

/**
 * The meridian a map holding these longitudes is centred on, in whole
 * degrees: Greenwich, unless the shortest span of longitude holding them all
 * crosses the antimeridian — the map's seam — and then the middle of that
 * span, so a pawn in Samoa and an answer in Fiji stand side by side rather
 * than at the two ends of the world.
 */
export const centralMeridianFor = (longitudes: readonly number[]): number => {
  const sorted = longitudes.map(wrapped).toSorted((one, other) => one - other)
  const first = sorted[0]
  const last = sorted.at(-1)

  if (first === undefined || last === undefined) {
    return 0
  }

  let widestGap = { east: first, length: first + FULL_TURN - last, west: last }

  for (let index = 1; index < sorted.length; index++) {
    const west = sorted[index - 1] ?? first
    const east = sorted[index] ?? first

    if (east - west > widestGap.length) {
      widestGap = { east, length: east - west, west }
    }
  }

  const spanCrossesTheSeam = widestGap.west !== last

  return spanCrossesTheSeam
    ? Math.round(wrapped((widestGap.east + widestGap.west + FULL_TURN) / 2))
    : 0
}
