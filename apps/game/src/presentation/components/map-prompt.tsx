import type React from 'react'

import type { CountryCode } from '@melee/protocol/country-code'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './map-prompt.sass'

/**
 * The map round's question, on every screen at once: the country is public,
 * because naming it is the question — what is hidden is where everyone put it.
 */
export const MapPrompt: React.FC<{ countryCode: CountryCode }> = ({
  countryCode
}) => {
  const translate = useTranslate()

  return (
    <p className='map-prompt'>
      {translate('worldmap.prompt', {
        country: translate(`worldmap.country.${countryCode}.withArticle`)
      })}
    </p>
  )
}
