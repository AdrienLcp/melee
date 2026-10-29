import type { QuantityUnit } from '@melee/protocol/estimate'

import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * A quantity in the reader's language with its unit — *124 000 000 habitants*,
 * *4 810 m* — grouped by the locale, so a population reads the way it was
 * typed. Two decimals at most: the bank's smallest values are a few square
 * kilometres.
 */
export const useQuantityWords = (): ((
  value: number,
  unit: QuantityUnit
) => string) => {
  const { locale, translate } = useI18n()
  const figures = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })

  // French groups with a narrow no-break space, which the condensed display
  // face draws next to nothing wide: 2 780 read as 2780.
  return (value, unit) =>
    translate(`estimate.units.${unit}`, {
      value: figures.format(value).replaceAll('\u202f', '\u00a0')
    })
}

/**
 * How many times off a guess is, said as a factor: one decimal under ten,
 * none from ten up, where the decimal is noise.
 */
export const useFactorWords = (): ((factor: number) => string) => {
  const { locale } = useI18n()
  const small = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const large = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })

  return (factor) => (factor < 10 ? small : large).format(factor)
}

/** From a million up a figure is read by its millions, which is all a comparison needs. */
const SHORTENED_FROM = 1_000_000

/**
 * A quantity as {@link useQuantityWords} says it, shortened from a million up —
 * *3,7 M habitants* — where two of them share a line and nobody reads the
 * thousands.
 */
export const useShortQuantityWords = (): ((
  value: number,
  unit: QuantityUnit
) => string) => {
  const { locale, translate } = useI18n()
  const quantityWords = useQuantityWords()
  const compact = new Intl.NumberFormat(locale, {
    maximumSignificantDigits: 3,
    notation: 'compact'
  })

  return (value, unit) =>
    value < SHORTENED_FROM
      ? quantityWords(value, unit)
      : translate(`estimate.units.${unit}`, {
          value: compact.format(value).replaceAll(' ', ' ')
        })
}
