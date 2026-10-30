/** A width and a height, in whatever units the caller measures in. */
export type Size = { height: number; width: number }

/** A point on the screen or on the map, by its two coordinates. */
export type Point = readonly [x: number, y: number]

/**
 * How the map sits in its frame: a map point `p` is drawn at
 * `p × scale + (x, y)`, in the frame's own pixels.
 */
export type MapView = { scale: number; x: number; y: number }

/** Deep enough to set a marker inside Luxembourg on a phone. */
export const MAX_ZOOM = 24

type Frame = { frame: Size; map: Size }

/** A rectangle of the map, by its two corners, in map units. */
export type MapBox = { max: Point; min: Point }

/**
 * The box grown about its own centre until each side spans at least `span`
 * map units — a framing that opens on it then never zooms past the context a
 * place is recognised in.
 */
export const atLeastSpanning = ({
  box,
  span
}: {
  box: MapBox
  span: number
}): MapBox => {
  const grown = (min: number, max: number): readonly [number, number] => {
    const half = Math.max(span, max - min) / 2
    const centre = (min + max) / 2

    return [centre - half, centre + half]
  }
  const [minX, maxX] = grown(box.min[0], box.max[0])
  const [minY, maxY] = grown(box.min[1], box.max[1])

  return { max: [maxX, maxY], min: [minX, minY] }
}

/** What a framing leaves around the box on each side, as a share of the frame. */
const FRAMING_MARGIN = 0.15

/** The whole world, as large as the frame allows, centred. */
export const fittedView = ({ frame, map }: Frame): MapView => {
  const scale = Math.min(frame.width / map.width, frame.height / map.height)

  return {
    scale,
    x: (frame.width - map.width * scale) / 2,
    y: (frame.height - map.height * scale) / 2
  }
}

/**
 * On each axis, a map wider than the frame keeps its edges outside it — no sea
 * of nothing beside the globe — and one narrower than the frame stays inside
 * it. Never re-centred: on a portrait phone the world is a strip shorter than
 * the frame, and centring it would slide the place under the fingers away.
 */
const clampedAxis = (offset: number, frameLength: number, mapLength: number) =>
  mapLength <= frameLength
    ? Math.min(frameLength - mapLength, Math.max(0, offset))
    : Math.min(0, Math.max(frameLength - mapLength, offset))

const clampedScale = ({ frame, map }: Frame, scale: number) => {
  const fitted = fittedView({ frame, map })

  return Math.min(fitted.scale * MAX_ZOOM, Math.max(fitted.scale, scale))
}

export const clampedView = ({
  frame,
  map,
  view
}: Frame & { view: MapView }): MapView => {
  const scale = clampedScale({ frame, map }, view.scale)

  return {
    scale,
    x: clampedAxis(view.x, frame.width, map.width * scale),
    y: clampedAxis(view.y, frame.height, map.height * scale)
  }
}

export const toMap = (view: MapView, [x, y]: Point): Point => [
  (x - view.x) / view.scale,
  (y - view.y) / view.scale
]

export const toScreen = (view: MapView, [x, y]: Point): Point => [
  x * view.scale + view.x,
  y * view.scale + view.y
]

/** Zoomed by `factor` around a screen point that stays under the finger. */
export const zoomedAround = ({
  factor,
  focus,
  frame,
  map,
  view
}: Frame & { factor: number; focus: Point; view: MapView }): MapView => {
  const [focusX, focusY] = focus
  const [mapX, mapY] = toMap(view, focus)
  const scale = clampedScale({ frame, map }, view.scale * factor)

  return clampedView({
    frame,
    map,
    view: { scale, x: focusX - mapX * scale, y: focusY - mapY * scale }
  })
}

export const pannedBy = ({
  by: [dx, dy],
  frame,
  map,
  view
}: Frame & { by: Point; view: MapView }): MapView =>
  clampedView({ frame, map, view: { ...view, x: view.x + dx, y: view.y + dy } })

/**
 * Two fingers: the map point that was under their midpoint follows it, and
 * the scale follows the distance between them.
 */
export const pinched = ({
  frame,
  from,
  map,
  to,
  view
}: Frame & {
  from: readonly [Point, Point]
  to: readonly [Point, Point]
  view: MapView
}): MapView => {
  const midpoint = ([a, b]: readonly [Point, Point]): Point => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2
  ]
  const spread = ([a, b]: readonly [Point, Point]) =>
    Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1]))
  const [mapX, mapY] = toMap(view, midpoint(from))
  const [toX, toY] = midpoint(to)
  const scale = clampedScale(
    { frame, map },
    (view.scale * spread(to)) / spread(from)
  )

  return clampedView({
    frame,
    map,
    view: { scale, x: toX - mapX * scale, y: toY - mapY * scale }
  })
}

/**
 * The box as large as the frame allows with a margin round it, centred —
 * the reveal opening on the country and every pawn around it rather than on
 * the whole world, where twelve pawns in one country are one blot.
 */
export const framedOn = ({
  box,
  frame,
  map
}: Frame & { box: MapBox }): MapView => {
  const room = 1 - 2 * FRAMING_MARGIN
  const width = Math.max(1, box.max[0] - box.min[0])
  const height = Math.max(1, box.max[1] - box.min[1])
  const scale = clampedScale(
    { frame, map },
    Math.min((frame.width * room) / width, (frame.height * room) / height)
  )
  const centreX = (box.min[0] + box.max[0]) / 2
  const centreY = (box.min[1] + box.max[1]) / 2

  return clampedView({
    frame,
    map,
    view: {
      scale,
      x: frame.width / 2 - centreX * scale,
      y: frame.height / 2 - centreY * scale
    }
  })
}

/** What stands at a point on the frame and what is perched on it. */
type Perch = {
  /** The point it stands on, in the frame's pixels: a pawn's tip. */
  anchor: Point
  /** The perched box's size. */
  box: Size
  /** The frame it must stay inside. */
  frame: Size
  /** How far above the anchor the thing standing there reaches: the pawn's height. */
  lift: number
  /** The space kept between the box, the pawn and the frame's edges. */
  margin: number
}

/**
 * Where a box sits over a pawn: centred above it, flipped under its tip when
 * the frame's top would cut it, and slid sideways to stay inside the frame,
 * so it is always under the hand that put the pawn down.
 */
export const perchedOver = ({
  anchor: [x, y],
  box,
  frame,
  lift,
  margin
}: Perch): { at: Point; isBelow: boolean } => {
  const above = y - lift - margin - box.height
  const isBelow = above < margin
  const top = isBelow ? y + margin : above
  const left = Math.min(
    Math.max(x - box.width / 2, margin),
    Math.max(margin, frame.width - margin - box.width)
  )

  return {
    at: [
      left,
      Math.min(top, Math.max(margin, frame.height - margin - box.height))
    ],
    isBelow
  }
}
