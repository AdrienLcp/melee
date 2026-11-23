import type React from 'react'

import type { FiveCluesClue as Clue } from '@melee/protocol/five-clues'

import { CountrySilhouette } from '@/presentation/components/country-silhouette'
import { EstimatePhoto } from '@/presentation/components/estimate-photo'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './five-clues-clue.sass'

type FiveCluesClueProps = {
  clue: Clue
  /** The country is printed beside it, as on the reveal: the pictures are then repeats a screen reader skips. */
  isNamedBeside?: boolean
}

/**
 * A figure in the reader's own locale, read by its millions or thousands —
 * _34,2 millions_ — where nobody reads the units. French groups with a narrow
 * no-break space the condensed display face draws next to nothing wide.
 */
const useLongFigure = (): ((value: number) => string) => {
  const { locale } = useI18n()
  const figures = new Intl.NumberFormat(locale, {
    compactDisplay: 'long',
    maximumSignificantDigits: 3,
    notation: 'compact'
  })

  return (value) => figures.format(value).replaceAll(' ', ' ')
}

/**
 * One rung's clue, the same pieces at every size so a rung shrinking under
 * the next one carries its clue down with it rather than swapping it: the
 * ladder sizes it through `--clue-size`.
 */
export const FiveCluesClue: React.FC<FiveCluesClueProps> = ({
  clue,
  isNamedBeside = false
}) => {
  const { translate } = useI18n()
  const longFigure = useLongFigure()

  switch (clue.kind) {
    case 'size':
      return (
        <p className='five-clues-clue' data-kind='size'>
          <span className='figure'>
            {longFigure(clue.population)}
            <small>{translate('fiveclues.clue.inhabitants')}</small>
          </span>
          <span className='figure'>
            {longFigure(clue.areaSquareKilometres)}
            <small>{translate('fiveclues.clue.area')}</small>
          </span>
        </p>
      )

    case 'region':
      return (
        <p className='five-clues-clue' data-kind='region'>
          {translate(`fiveclues.region.${clue.region}`)}
        </p>
      )

    case 'outline':
      return (
        <div className='five-clues-clue' data-kind='outline'>
          <CountrySilhouette
            file={clue.silhouette}
            isNamedBeside={isNamedBeside}
          />
        </div>
      )

    case 'cities':
      return (
        <ul className='five-clues-clue' data-kind='cities'>
          {clue.cities.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      )

    case 'flag':
      return (
        <div className='five-clues-clue' data-kind='flag'>
          <FlagPicture file={clue.flag} isNamedBeside={isNamedBeside} />
          <p className='capital'>
            <small>{translate('fiveclues.clue.capital')}</small>
            {clue.capital}
          </p>
        </div>
      )

    case 'text':
      return (
        <p className='five-clues-clue' data-kind='text'>
          {clue.text}
        </p>
      )

    case 'image':
      return (
        <div
          aria-label={clue.alt}
          className='five-clues-clue'
          data-kind='image'
          role='img'
        >
          <EstimatePhoto photo={clue.photo} />
        </div>
      )
  }
}
