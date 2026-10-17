import type React from 'react'
import { lazy, Suspense } from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Loader } from './loader'
import './world-map.sass'
import type { WorldMapProps } from './world-map'

const LoadedWorldMap = lazy(async () => ({
  default: (await import('./world-map')).WorldMap
}))

/**
 * The map behind its own chunk: the 1:50m outlines weigh more than the rest of
 * a player's screen together, and a join page or a lobby never draws them.
 */
export const LazyWorldMap: React.FC<WorldMapProps> = (props) => {
  const translate = useTranslate()

  return (
    <Suspense
      fallback={
        <div className='world-map'>
          <Loader label={translate('worldmap.map.loading')} />
        </div>
      }
    >
      <LoadedWorldMap {...props} />
    </Suspense>
  )
}
