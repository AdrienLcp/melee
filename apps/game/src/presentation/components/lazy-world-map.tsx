import type React from 'react'
import {
  Suspense,
  use,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from 'react'

import type { GameSettings } from '@melee/protocol/game'

import type { Size } from '@/helpers/map-view'
import { onceIdle } from '@/infrastructure/browser'
import { lazyModule } from '@/infrastructure/lazy-module'
import type { MapRegion } from '@/infrastructure/map/world-geometry'
import { holdWhileReloading } from '@/infrastructure/stale-build'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Loader } from './loader'
import { useLeavingValue } from './use-leaving-value'
import type { WorldMapProps } from './world-map'

import './world-map.sass'

const worldMapModule = lazyModule(() => import('./world-map'))
const importWorldGeometry = holdWhileReloading(
  () => import('@/infrastructure/map/world-geometry')
)

const placesAhead = (lineUp: readonly GameSettings[]) =>
  new Set(
    lineUp.flatMap((entry) => (entry.kind === 'atlas' ? entry.places : []))
  )

/**
 * Fetches the map and projects its outlines while the room is quiet, once the
 * evening holds an Atlas: left to the round, the chunk lands after the stage
 * has entered, and projecting the world is a long task that stalls the
 * entrance it lands in. One region per idle moment, since each is one.
 */
export const useWorldMapAhead = (lineUp: readonly GameSettings[]): void => {
  const places = placesAhead(lineUp)
  const isWorldAhead = places.has('countries') || places.has('worldCapitals')
  const isFranceAhead = places.has('frenchCities')

  useEffect(() => {
    const regions: readonly MapRegion[] = [
      ...(isWorldAhead ? (['world'] as const) : []),
      ...(isFranceAhead ? (['france'] as const) : [])
    ]

    if (regions.length === 0) {
      return undefined
    }

    const controller = new AbortController()
    let cancelIdle = onceIdle(() => {
      void worldMapModule.load()
      void importWorldGeometry().then(({ mapGeometryOf }) => {
        const projectFrom = (pending: readonly MapRegion[]): void => {
          const [region, ...rest] = pending

          if (controller.signal.aborted || region === undefined) {
            return
          }

          cancelIdle = onceIdle(() => {
            mapGeometryOf(region)
            projectFrom(rest)
          })
        }

        projectFrom(regions)
      })
    })

    return () => {
      controller.abort()
      cancelIdle()
    }
  }, [isFranceAhead, isWorldAhead])
}

type LoadedWorldMapProps = WorldMapProps & {
  frame: Size
  /** Called once the map is drawn in the frame. */
  onDrawn: () => void
}

const LoadedWorldMap: React.FC<LoadedWorldMapProps> = ({
  onDrawn,
  ...props
}) => {
  const { WorldMap } = use(worldMapModule.load())
  const reportDrawn = useEffectEvent(onDrawn)

  useEffect(() => {
    reportDrawn()
  }, [])

  return <WorldMap {...props} />
}

/**
 * The map behind its own chunk: the 1:50m outlines weigh more than the rest of
 * a player's screen together, and a join page or a lobby never draws them.
 *
 * The frame is drawn here, sea and all, so it enters with the stage whether or
 * not the chunk has landed; the map fades in over it, and the loader that
 * stood in its place fades out.
 */
export const LazyWorldMap: React.FC<WorldMapProps> = (props) => {
  const translate = useTranslate()
  const frameRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<Size | null>(null)
  const [isWaiting, setIsWaiting] = useState(worldMapModule.loaded() === null)
  const waiting = useLeavingValue(isWaiting ? true : null)

  useEffect(() => {
    const element = frameRef.current

    if (element === null) {
      return
    }

    void worldMapModule.load()

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
        <Suspense fallback={null}>
          <LoadedWorldMap
            {...props}
            frame={frame}
            onDrawn={() => setIsWaiting(false)}
          />
        </Suspense>
      )}
      {waiting.drawn !== null && (
        <div
          className='waiting'
          data-leaving={waiting.isLeaving || undefined}
          onAnimationEnd={waiting.onAnimationEnd}
        >
          <Loader label={translate('atlas.map.loading')} />
        </div>
      )}
    </div>
  )
}
