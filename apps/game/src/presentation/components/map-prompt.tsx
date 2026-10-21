import type React from 'react'

import type { WorldmapTarget } from '@melee/protocol/worldmap'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './map-prompt.sass'

/**
 * The map round's question, on every screen at once: the country or the city
 * is public, because naming it is the question — what is hidden is where
 * everyone put it.
 */
export const MapPrompt: React.FC<{ target: WorldmapTarget }> = ({ target }) => {
  const translate = useTranslate()

  return (
    <p className='map-prompt'>
      {translate('worldmap.prompt', {
        place:
          target.kind === 'city'
            ? target.name
            : translate(`worldmap.country.${target.countryCode}.withArticle`)
      })}
    </p>
  )
}
