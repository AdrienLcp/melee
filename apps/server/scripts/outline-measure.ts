type Point = { x: number; y: number }

/**
 * Two numbers that tell outlines apart at a glance, measured on the path a
 * screen draws: how stretched it is — the square root of its two principal
 * second moments' ratio, 1 for a disc, Chile past 10 — and how compact — its
 * area over the disc of the same perimeter's, 1 for a disc and next to
 * nothing for a coast of fjords or a scatter of islands. Both ignore scale
 * and turning, which the silhouettes' fitted view box already took away.
 */
export type OutlineMeasure = {
  compactness: number
  elongation: number
}

const ringsOf = (path: string): Point[][] =>
  path
    .split('M')
    .map((ring) => ring.replace('Z', ''))
    .filter((ring) => ring !== '')
    .map((ring) =>
      ring
        .split('L')
        .map((pair) => pair.split(',').map(Number))
        .flatMap(([x, y]) =>
          x === undefined || y === undefined ? [] : [{ x, y }]
        )
    )

const edgesOf = (ring: readonly Point[]): { from: Point; to: Point }[] =>
  ring.flatMap((from, index) => {
    const to = ring[(index + 1) % ring.length]

    return to === undefined ? [] : [{ from, to }]
  })

const ROUNDED_TO = 1000

const rounded = (value: number): number =>
  Math.round(value * ROUNDED_TO) / ROUNDED_TO

/** The outline of a silhouette's `d`, its holes and islands summed by their winding. */
export const outlineMeasureOf = (path: string): OutlineMeasure => {
  const edges = ringsOf(path).flatMap(edgesOf)
  let doubledArea = 0
  let perimeter = 0
  let sumX = 0
  let sumY = 0
  let sumXX = 0
  let sumYY = 0
  let sumXY = 0

  for (const { from, to } of edges) {
    const cross = from.x * to.y - to.x * from.y

    doubledArea += cross
    perimeter += Math.hypot(to.x - from.x, to.y - from.y)
    sumX += (from.x + to.x) * cross
    sumY += (from.y + to.y) * cross
    sumXX += (from.x * from.x + from.x * to.x + to.x * to.x) * cross
    sumYY += (from.y * from.y + from.y * to.y + to.y * to.y) * cross
    sumXY +=
      (from.x * to.y + 2 * from.x * from.y + 2 * to.x * to.y + to.x * from.y) *
      cross
  }

  const area = doubledArea / 2
  const centreX = sumX / (6 * area)
  const centreY = sumY / (6 * area)
  const spreadXX = sumXX / (12 * area) - centreX * centreX
  const spreadYY = sumYY / (12 * area) - centreY * centreY
  const spreadXY = sumXY / (24 * area) - centreX * centreY
  const mean = (spreadXX + spreadYY) / 2
  const deviation = Math.hypot((spreadXX - spreadYY) / 2, spreadXY)

  return {
    compactness: rounded((4 * Math.PI * Math.abs(area)) / perimeter ** 2),
    elongation: rounded(Math.sqrt((mean + deviation) / (mean - deviation)))
  }
}
