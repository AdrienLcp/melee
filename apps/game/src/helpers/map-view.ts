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
