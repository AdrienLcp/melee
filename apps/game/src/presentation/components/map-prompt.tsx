import type React from 'react'

import type { AtlasTarget } from '@melee/protocol/atlas'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import './map-prompt.sass'

/**
 * The map round's question, on every screen at once: the country, the city or
 * the capital is public, because naming it is the question — what is hidden is
 * where everyone put it.
 */
export const MapPrompt: React.FC<{ target: AtlasTarget }> = ({ target }) => {
  const { locale, translate } = useI18n()

  const placeNamed = (): string => {
    switch (target.kind) {
      case 'capital':
        return target.names[locale]
      case 'city':
        return target.name
      case 'country':
        return translate(`atlas.country.${target.countryCode}.withArticle`)
    }
  }

  return (
    <p className='map-prompt'>
      {translate('atlas.prompt', { place: placeNamed() })}
    </p>
  )
}
