import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import type { GeoPoint } from '@melee/protocol/worldmap'

import {
  clampedView,
  fittedView,
  type MapView,
  type Point,
  type Size,
  toMap,
  toScreen,
  zoomedAround
} from '@/helpers/map-view'
import {
  geoPointAt,
  mapPointOf,
  type ProjectedWorld,
  projectedWorld
} from '@/infrastructure/map/world-geometry'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { MinusIcon, PlusIcon, WorldIcon } from './icons'
import { PAWN_BOX, PawnShape } from './pawn'
import { useMapGestures } from './use-map-gestures'
import { VisuallyHidden } from './visually-hidden'

import './world-map.sass'

/** The pawn on the map is half as large again as in a row of names: it is pressed, not read. */
const MARKER_SCALE = 1.5
/** One press of a zoom button. */
const ZOOM_STEP = 2

export type WorldMapProps = {
  /** The player's pawn and the colour it plays in, or `null` before it is put down. */
  marker: { pawnNumber: number; point: GeoPoint } | null
  /** Where a tap or a drag puts the pawn; absent once nothing more can be placed. */
  onPlace?: (point: GeoPoint) => void
}

/**
 * The world in Equal Earth, every country its true size, on a frame that
 * zooms and pans under a finger or a mouse, and through its buttons. The view is the
 * reader's alone: nothing about it travels, only the point a pawn marks.
 */
export const WorldMap: React.FC<WorldMapProps> = ({ marker, onPlace }) => {
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
          onPlace={onPlace}
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
  onPlace,
  world
}) => {
  const translate = useTranslate()
  const hintId = useId()
  const surface = useRef<SVGSVGElement>(null)
  const map = { height: world.height, width: world.width }
  const [view, setView] = useState<MapView>(() => fittedView({ frame, map }))

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
        </g>
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
    </>
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
