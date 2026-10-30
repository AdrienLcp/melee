import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import type { AtlasShown, GeoPoint } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'

import {
  crowdedPawnScale,
  placedDistanceLabels
} from '@/helpers/distance-labels'
import {
  atLeastSpanning,
  clampedView,
  fittedView,
  framedOn,
  type MapBox,
  type MapView,
  type Point,
  perchedOver,
  type Size,
  toMap,
  toScreen,
  zoomedAround
} from '@/helpers/map-view'
import {
  type CountryOutline,
  type MapGeometry,
  type MapRegion,
  mapGeometryOf,
  nearestVertex,
  type ProjectedWorld
} from '@/infrastructure/map/world-geometry'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { MinusIcon, PlusIcon, WorldIcon } from './icons'
import { PAWN_BOX, PawnShape, usePawnNumber } from './pawn'
import { useEasedMapView } from './use-eased-map-view'
import { useMapGestures } from './use-map-gestures'
import { VisuallyHidden } from './visually-hidden'

import './world-map.sass'

/** The pawn on the map is half as large again as in a row of names: it is pressed, not read. */
const MARKER_SCALE = 1.5
/** One press of a zoom button. */
const ZOOM_STEP = 2
/** A country drawn smaller than this, in screen pixels squared, is ringed: filled, it is a speck under a line. A city is always ringed. */
const SMALL_TARGET_AREA = 900
/** The city's own dot, in screen pixels. */
const CITY_RADIUS = 5
/** A distance label's size bounds in pixels, read across the room on a wall, the frame's own width deciding between them. */
const DISTANCE_SIZE = { least: 14, most: 28, share: 0.022 } as const
/** The zoom buttons' column, which a framing keeps clear so no pawn stands under them. */
const CONTROLS_INSET = 56
/** The ring's radius on screen, wide enough to read round a pawn standing in it. */
const RING_RADIUS = 22
/** The space between the pawn's actions, the pawn and the frame's edges. */
const PERCH_MARGIN = 12
/** How many times its own size the view around a shown place spans: a country is named by its neighbours as much as by its shape. */
const SHOWN_CONTEXT = 3
/** The least a view around a shown place spans, as a share of the map's width — a dot or an islet still needs a coastline to be found. */
const SHOWN_LEAST_SPAN = 0.08
/**
 * The least the world map's reveal spans, as a share of its width — about a
 * continent, so a table that all landed near the answer still sees where on
 * the globe that was. The map of France is never framed tighter than itself.
 */
const REVEAL_LEAST_SPAN = 0.2

/** A marker the reveal draws: whose pawn, where, and what its line says. */
export type RevealedMarker = {
  /** `0` inside the country or on the city, where no line is drawn. */
  distanceKm: number
  /** The line's label, *1 480 km*. */
  label: string
  playerId: string
  point: GeoPoint
  /** The seat's place in the roster, which colours its pawn. */
  seat: number
}

/** What the reveal points at: a country filled, or a city's own spot. */
export type RevealedTarget =
  | { countryCode: CountryCode; kind: 'country' }
  | { kind: 'city'; point: GeoPoint }

export type WorldMapProps = {
  /** The player's pawn and the colour it plays in, or `null` before it is put down. */
  marker: { pawnNumber: number; point: GeoPoint } | null
  /** The presses perched over the pawn while it can still move — sending it, taking it back. */
  markerActions?: React.ReactNode
  /** The answer and every pawn, once the round is revealed: the view opens framed on them. */
  revealed?: { markers: readonly RevealedMarker[]; target: RevealedTarget }
  /** The world for a country, France for one of its cities. */
  region: MapRegion
  /** What a `name` round shows while it is open: the country filled around its point, or a dot. */
  shown?: AtlasShown | null
  /** Where a tap or a drag puts the pawn; absent once nothing more can be placed. */
  onPlace?: (point: GeoPoint) => void
}

/**
 * The world in Equal Earth, every country its true size — or France in its
 * own conic projection — on a frame that zooms and pans under a finger or a
 * mouse, and through its buttons. The view is the reader's alone: nothing
 * about it travels, only the point a pawn marks.
 */
export const WorldMap: React.FC<WorldMapProps> = ({
  marker,
  markerActions,
  onPlace,
  region,
  revealed,
  shown
}) => {
  const geometry = mapGeometryOf(region)
  const frameRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<Size | null>(null)

  useEffect(() => {
    const element = frameRef.current

    if (element === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      setFrame({ height: element.clientHeight, width: element.clientWidth })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className='world-map' ref={frameRef}>
      {frame !== null && frame.width > 0 && frame.height > 0 && (
        <MapSurface
          frame={frame}
          geometry={geometry}
          key={`${region} ${frame.width}×${frame.height}`}
          marker={marker}
          markerActions={markerActions}
          onPlace={onPlace}
          region={region}
          revealed={revealed}
          shown={shown}
        />
      )}
    </div>
  )
}

type MapSurfaceProps = WorldMapProps & { frame: Size; geometry: MapGeometry }

/** Mounted once per frame size, so a rotated phone starts again from the whole world. */
const MapSurface: React.FC<MapSurfaceProps> = ({
  frame,
  geometry,
  marker,
  markerActions,
  onPlace,
  region,
  revealed,
  shown
}) => {
  const translate = useTranslate()
  const hintId = useId()
  const surface = useRef<SVGSVGElement>(null)
  const { geoPointAt, mapPointOf, projected: world } = geometry
  const map = { height: world.height, width: world.width }
  const shownTarget = shownTargetOf(geometry, shown ?? null)
  const target =
    revealed === undefined
      ? shownTarget === null
        ? null
        : targetOutlineOf(geometry, shownTarget)
      : targetOutlineOf(geometry, revealed.target)
  const markers = revealed?.markers ?? []
  const { easeView, setView, view } = useEasedMapView(() =>
    target === null || region === 'france'
      ? fittedView({ frame, map })
      : clampedView({
          frame,
          map,
          view: framedOn({
            box:
              markers.length === 0
                ? boxInContext({ map, target })
                : atLeastSpanning({
                    box: boxAround({ geometry, markers, target }),
                    span: map.width * REVEAL_LEAST_SPAN
                  }),
            frame: { ...frame, width: frame.width - CONTROLS_INSET },
            map
          })
        })
  )
  const drawnTarget = revealed?.target ?? shownTarget

  const markerAt =
    marker === null ? null : toScreen(view, mapPointOf(marker.point))

  const placeAt =
    onPlace === undefined
      ? undefined
      : (at: Point) => {
          const point = geoPointAt(toMap(view, at))

          if (point !== null) {
            onPlace(point)
          }
        }

  const gestures = useMapGestures({
    easeView,
    frame,
    map,
    markerAt,
    onPlace: placeAt,
    setView,
    surface,
    view
  })

  const zoomBy = (factor: number) => {
    easeView((current) =>
      zoomedAround({
        factor,
        focus: markerAt ?? [frame.width / 2, frame.height / 2],
        frame,
        map,
        view: current
      })
    )
  }

  return (
    <>
      <svg
        aria-describedby={onPlace === undefined ? undefined : hintId}
        aria-label={translate(
          region === 'france' ? 'atlas.map.labelFrance' : 'atlas.map.label'
        )}
        className='surface'
        data-placing={onPlace !== undefined || undefined}
        height={frame.height}
        ref={surface}
        role='img'
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        width={frame.width}
        {...gestures}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <WorldShapes world={world} />
          {drawnTarget?.kind === 'country' && (
            <path
              className='target'
              d={
                world.countries.find(
                  (country) => country.code === drawnTarget.countryCode
                )?.path
              }
            />
          )}
        </g>
        {drawnTarget !== null && target !== null && (
          <RevealedLayer
            frame={frame}
            isCity={drawnTarget.kind === 'city'}
            mapPointOf={mapPointOf}
            markers={markers}
            target={target}
            view={view}
          />
        )}
        {marker !== null && markerAt !== null && (
          <g
            className='marker'
            style={{ '--pawn': `var(--pawn-${marker.pawnNumber})` }}
            transform={`translate(${markerAt[0]} ${markerAt[1]}) scale(${MARKER_SCALE}) translate(${-PAWN_BOX.width / 2} ${-PAWN_BOX.height})`}
          >
            <PawnShape />
          </g>
        )}
      </svg>
      {onPlace !== undefined && (
        <VisuallyHidden id={hintId}>
          {translate('atlas.map.hint')}
        </VisuallyHidden>
      )}
      <div className='controls'>
        <Button
          aria-label={translate('atlas.map.zoomIn')}
          onPress={() => zoomBy(ZOOM_STEP)}
          size='small'
          variant='outlined'
        >
          <PlusIcon />
        </Button>
        <Button
          aria-label={translate('atlas.map.zoomOut')}
          onPress={() => zoomBy(1 / ZOOM_STEP)}
          size='small'
          variant='outlined'
        >
          <MinusIcon />
        </Button>
        <Button
          aria-label={translate(
            region === 'france' ? 'atlas.map.wholeFrance' : 'atlas.map.whole'
          )}
          onPress={() =>
            easeView(() =>
              clampedView({ frame, map, view: fittedView({ frame, map }) })
            )
          }
          size='small'
          variant='outlined'
        >
          <WorldIcon />
        </Button>
      </div>
      {markerActions !== undefined && markerAt !== null && (
        <MarkerActions anchor={markerAt} frame={frame}>
          {markerActions}
        </MarkerActions>
      )}
    </>
  )
}

/**
 * Follows the pawn through every pan, pinch and move, so the press that sends
 * it is always under the hand that put it down — on an upright wall, a press
 * under the map would be near the floor. Hidden for the one frame it takes to
 * measure itself.
 */
const MarkerActions: React.FC<{
  anchor: Point
  children: React.ReactNode
  frame: Size
}> = ({ anchor, children, frame }) => {
  const [box, setBox] = useState<Size | null>(null)

  const observe = (element: HTMLDivElement | null) => {
    if (element === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      setBox({ height: element.offsetHeight, width: element.offsetWidth })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }

  const perch =
    box === null
      ? null
      : perchedOver({
          anchor,
          box,
          frame: { ...frame, width: frame.width - CONTROLS_INSET },
          lift: PAWN_BOX.height * MARKER_SCALE,
          margin: PERCH_MARGIN
        })

  return (
    <div
      className='marker-actions'
      data-below={perch?.isBelow || undefined}
      data-measuring={perch === null || undefined}
      ref={observe}
      style={{
        '--perch-tip': `${anchor[0] - (perch?.at[0] ?? 0)}px`,
        '--perch-x': `${perch?.at[0] ?? 0}px`,
        '--perch-y': `${perch?.at[1] ?? 0}px`
      }}
    >
      {children}
    </div>
  )
}

/** A city as the reveal points at it: one spot, its own box and its only vertex. */
const targetOutlineOf = (
  geometry: MapGeometry,
  target: RevealedTarget
): CountryOutline | null => {
  if (target.kind === 'country') {
    return geometry.countryOutlineOf(target.countryCode)
  }

  const spot = geometry.mapPointOf(target.point)

  return {
    area: 0,
    box: { max: spot, min: spot },
    centre: spot,
    vertices: [spot]
  }
}

/**
 * What a `name` round points at: the country the point falls in, which this
 * screen finds in its own outlines because no code is sent, or the point
 * itself for a city or a capital.
 */
const shownTargetOf = (
  geometry: MapGeometry,
  shown: AtlasShown | null
): RevealedTarget | null => {
  if (shown === null) {
    return null
  }

  if (shown.kind !== 'country') {
    return { kind: 'city', point: shown.point }
  }

  const countryCode = geometry.countryAt(shown.point)

  return countryCode === null ? null : { countryCode, kind: 'country' }
}

/** A place with enough of the map around it to be recognised by where it is. */
const boxInContext = ({
  map,
  target
}: {
  map: Size
  target: CountryOutline
}): MapBox => {
  const span = Math.max(
    map.width * SHOWN_LEAST_SPAN,
    (target.box.max[0] - target.box.min[0]) * SHOWN_CONTEXT,
    (target.box.max[1] - target.box.min[1]) * SHOWN_CONTEXT
  )
  const [centreX, centreY] = target.centre

  return {
    max: [centreX + span / 2, centreY + span / 2],
    min: [centreX - span / 2, centreY - span / 2]
  }
}

/** The target and every pawn, so a framing leaves none of them off screen. */
const boxAround = ({
  geometry,
  markers,
  target
}: {
  geometry: MapGeometry
  markers: readonly RevealedMarker[]
  target: CountryOutline
}): MapBox => {
  const points = [
    target.box.min,
    target.box.max,
    ...markers.map((marker) => geometry.mapPointOf(marker.point))
  ]

  return {
    max: [
      Math.max(...points.map(([x]) => x)),
      Math.max(...points.map(([, y]) => y))
    ],
    min: [
      Math.min(...points.map(([x]) => x)),
      Math.min(...points.map(([, y]) => y))
    ]
  }
}

/**
 * Drawn in the frame's pixels rather than under the map's transform, so a
 * line, a ring and a label keep their size at every zoom.
 */
const RevealedLayer: React.FC<{
  frame: Size
  /** A city is a spot rather than a shape: dotted, and ringed at every zoom. */
  isCity: boolean
  mapPointOf: MapGeometry['mapPointOf']
  markers: readonly RevealedMarker[]
  target: CountryOutline
  view: MapView
}> = ({ frame, isCity, mapPointOf, markers, target, view }) => {
  const [centreX, centreY] = toScreen(view, target.centre)
  const lines = markers
    .filter((marker) => marker.distanceKm > 0)
    .toSorted((one, other) => one.distanceKm - other.distanceKm)
    .map((marker) => {
      const at = mapPointOf(marker.point)

      return {
        characters: marker.label.length,
        from: toScreen(view, at),
        marker,
        to: toScreen(view, nearestVertex(target.vertices, at))
      }
    })
  const pawns = markers.map((marker) => ({
    at: toScreen(view, mapPointOf(marker.point)),
    marker
  }))
  const pawnScale = crowdedPawnScale({
    pawnWidth: PAWN_BOX.width,
    points: pawns.map(({ at }) => at)
  })
  const pawn = {
    height: PAWN_BOX.height * pawnScale,
    width: PAWN_BOX.width * pawnScale
  }
  const distanceSize = Math.min(
    DISTANCE_SIZE.most,
    Math.max(DISTANCE_SIZE.least, frame.width * DISTANCE_SIZE.share)
  )
  const labelsAt = placedDistanceLabels({
    fontSize: distanceSize,
    frame,
    lines,
    obstacles: [
      ...pawns.map(({ at: [x, y] }) => ({
        ...pawn,
        x: x - pawn.width / 2,
        y: y - pawn.height
      })),
      {
        height: RING_RADIUS * 2,
        width: RING_RADIUS * 2,
        x: centreX - RING_RADIUS,
        y: centreY - RING_RADIUS
      },
      {
        height: frame.height,
        width: CONTROLS_INSET,
        x: frame.width - CONTROLS_INSET,
        y: 0
      }
    ],
    pawn
  })

  return (
    <g className='revealed' style={{ '--distance-size': `${distanceSize}px` }}>
      {lines.map(({ from, marker, to }) => (
        <line
          className='reach'
          key={marker.playerId}
          x1={from[0]}
          x2={to[0]}
          y1={from[1]}
          y2={to[1]}
        />
      ))}
      {target.area * view.scale ** 2 < SMALL_TARGET_AREA && (
        <circle className='ring' cx={centreX} cy={centreY} r={RING_RADIUS} />
      )}
      {isCity && (
        <circle className='city' cx={centreX} cy={centreY} r={CITY_RADIUS} />
      )}
      {pawns.map(({ at, marker }) => (
        <RevealedPawn
          at={at}
          key={marker.playerId}
          scale={pawnScale}
          seat={marker.seat}
        />
      ))}
      {lines.map(({ marker }, index) => {
        const at = labelsAt[index]

        return (
          at != null && (
            <text
              className='distance'
              key={marker.playerId}
              x={at[0]}
              y={at[1]}
            >
              {marker.label}
            </text>
          )
        )
      })}
    </g>
  )
}

const RevealedPawn: React.FC<{
  at: Point
  /** Below 1 where the table's pawns crowd one another. */
  scale: number
  seat: number
}> = ({ at, scale, seat }) => {
  const pawnNumber = usePawnNumber({ seat })

  return (
    <g
      className='marker'
      style={{ '--pawn': `var(--pawn-${pawnNumber})` }}
      transform={`translate(${at[0]} ${at[1]}) scale(${scale}) translate(${-PAWN_BOX.width / 2} ${-PAWN_BOX.height})`}
    >
      <PawnShape />
    </g>
  )
}

/**
 * The sea, the meridians and every country — the part of the map that never
 * changes, so a pan redraws one transform and none of the 240 outlines.
 */
const WorldShapes: React.FC<{ world: ProjectedWorld }> = ({ world }) => (
  <>
    <path className='sea' d={world.outline} />
    <path className='graticule' d={world.graticule} />
    {world.countries.map((country) => (
      <path className='country' d={country.path} key={country.code} />
    ))}
    <path className='rim' d={world.outline} />
  </>
)
