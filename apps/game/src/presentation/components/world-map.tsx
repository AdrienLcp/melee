import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import type { CountryCode } from '@melee/protocol/country-code'
import type { GeoPoint } from '@melee/protocol/worldmap'

import {
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
  countryOutlineOf,
  geoPointAt,
  mapPointOf,
  nearestVertex,
  type ProjectedWorld,
  projectedWorld
} from '@/infrastructure/map/world-geometry'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { MinusIcon, PlusIcon, WorldIcon } from './icons'
import { PAWN_BOX, PawnShape, usePawnNumber } from './pawn'
import { useMapGestures } from './use-map-gestures'
import { VisuallyHidden } from './visually-hidden'

import './world-map.sass'

/** The pawn on the map is half as large again as in a row of names: it is pressed, not read. */
const MARKER_SCALE = 1.5
/** One press of a zoom button. */
const ZOOM_STEP = 2
/** A country drawn smaller than this, in screen pixels squared, is ringed: filled, it is a speck under a line. */
const SMALL_TARGET_AREA = 900
/** Where a line's label stands, from the pawn: the lines meet at the country, so their middles crowd and their starts do not. */
const LABEL_ALONG = 0.3
/** How far from its pawn a label stands at least, in screen pixels, so a short line's label does not sit on the pawn. */
const LABEL_CLEARANCE = 56
/** The zoom buttons' column, which a framing keeps clear so no pawn stands under them. */
const CONTROLS_INSET = 56
/** The ring's radius on screen, wide enough to read round a pawn standing in it. */
const RING_RADIUS = 22
/** The space between the pawn's actions, the pawn and the frame's edges. */
const PERCH_MARGIN = 12

/** A marker the reveal draws: whose pawn, where, and what its line says. */
export type RevealedMarker = {
  /** `0` inside the country, where no line is drawn. */
  distanceKm: number
  /** The line's label, *1 480 km*. */
  label: string
  playerId: string
  point: GeoPoint
  /** The seat's place in the roster, which colours its pawn. */
  seat: number
}

export type WorldMapProps = {
  /** The player's pawn and the colour it plays in, or `null` before it is put down. */
  marker: { pawnNumber: number; point: GeoPoint } | null
  /** The presses perched over the pawn while it can still move — sending it, taking it back. */
  markerActions?: React.ReactNode
  /** The answer and every pawn, once the round is revealed: the view opens framed on them. */
  revealed?: { countryCode: CountryCode; markers: readonly RevealedMarker[] }
  /** Where a tap or a drag puts the pawn; absent once nothing more can be placed. */
  onPlace?: (point: GeoPoint) => void
}

/**
 * The world in Equal Earth, every country its true size, on a frame that
 * zooms and pans under a finger or a mouse, and through its buttons. The view is the
 * reader's alone: nothing about it travels, only the point a pawn marks.
 */
export const WorldMap: React.FC<WorldMapProps> = ({
  marker,
  markerActions,
  onPlace,
  revealed
}) => {
  const world = projectedWorld()
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
          key={`${frame.width}×${frame.height}`}
          marker={marker}
          markerActions={markerActions}
          onPlace={onPlace}
          revealed={revealed}
          world={world}
        />
      )}
    </div>
  )
}

type MapSurfaceProps = WorldMapProps & { frame: Size; world: ProjectedWorld }

/** Mounted once per frame size, so a rotated phone starts again from the whole world. */
const MapSurface: React.FC<MapSurfaceProps> = ({
  frame,
  marker,
  markerActions,
  onPlace,
  revealed,
  world
}) => {
  const translate = useTranslate()
  const hintId = useId()
  const surface = useRef<SVGSVGElement>(null)
  const map = { height: world.height, width: world.width }
  const target =
    revealed === undefined ? null : countryOutlineOf(revealed.countryCode)
  const [view, setView] = useState<MapView>(() =>
    revealed === undefined || target === null
      ? fittedView({ frame, map })
      : clampedView({
          frame,
          map,
          view: framedOn({
            box: boxAround(target, revealed.markers),
            frame: { ...frame, width: frame.width - CONTROLS_INSET },
            map
          })
        })
  )

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
    frame,
    map,
    markerAt,
    onPlace: placeAt,
    setView,
    surface,
    view
  })

  const zoomBy = (factor: number) => {
    setView((current) =>
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
        aria-label={translate('worldmap.map.label')}
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
          {revealed !== undefined && (
            <path
              className='target'
              d={
                world.countries.find(
                  (country) => country.code === revealed.countryCode
                )?.path
              }
            />
          )}
        </g>
        {revealed !== undefined && target !== null && (
          <RevealedLayer
            markers={revealed.markers}
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
      <VisuallyHidden id={hintId}>
        {translate('worldmap.map.hint')}
      </VisuallyHidden>
      <div className='controls'>
        <Button
          aria-label={translate('worldmap.map.zoomIn')}
          onPress={() => zoomBy(ZOOM_STEP)}
          size='small'
          variant='outlined'
        >
          <PlusIcon />
        </Button>
        <Button
          aria-label={translate('worldmap.map.zoomOut')}
          onPress={() => zoomBy(1 / ZOOM_STEP)}
          size='small'
          variant='outlined'
        >
          <MinusIcon />
        </Button>
        <Button
          aria-label={translate('worldmap.map.whole')}
          onPress={() =>
            setView(
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

/** The country and every pawn, so a framing leaves none of them off screen. */
const boxAround = (
  target: CountryOutline,
  markers: readonly RevealedMarker[]
): MapBox => {
  const points = [
    target.box.min,
    target.box.max,
    ...markers.map((marker) => mapPointOf(marker.point))
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
  markers: readonly RevealedMarker[]
  target: CountryOutline
  view: MapView
}> = ({ markers, target, view }) => {
  const [centreX, centreY] = toScreen(view, target.centre)
  const lines = markers
    .filter((marker) => marker.distanceKm > 0)
    .map((marker) => {
      const at = mapPointOf(marker.point)

      return {
        from: toScreen(view, at),
        marker,
        to: toScreen(view, nearestVertex(target.vertices, at))
      }
    })

  return (
    <g className='revealed'>
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
      {markers.map((marker) => (
        <RevealedPawn
          at={toScreen(view, mapPointOf(marker.point))}
          key={marker.playerId}
          seat={marker.seat}
        />
      ))}
      {lines.map(({ from, marker, to }) => {
        const along = labelAlong(from, to)

        return (
          <text
            className='distance'
            key={marker.playerId}
            x={from[0] + (to[0] - from[0]) * along}
            y={from[1] + (to[1] - from[1]) * along}
          >
            {marker.label}
          </text>
        )
      })}
    </g>
  )
}

/** The share of a line its label stands at: clear of the pawn, and never past the middle, where the lines meet. */
const labelAlong = (from: Point, to: Point): number => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])

  return length === 0
    ? 0
    : Math.min(0.5, Math.max(LABEL_ALONG, LABEL_CLEARANCE / length))
}

const RevealedPawn: React.FC<{ at: Point; seat: number }> = ({ at, seat }) => {
  const pawnNumber = usePawnNumber({ seat })

  return (
    <g
      className='marker'
      style={{ '--pawn': `var(--pawn-${pawnNumber})` }}
      transform={`translate(${at[0]} ${at[1]}) translate(${-PAWN_BOX.width / 2} ${-PAWN_BOX.height})`}
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
