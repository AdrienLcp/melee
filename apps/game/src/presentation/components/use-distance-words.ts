import type { RoundView } from '@melee/protocol/room'

import { distanceOf } from '@/helpers/round-content'
import { useI18n } from '@/presentation/i18n/i18n-provider'

type DistanceForm = 'away' | 'km'

/**
 * A marker's distance in the reader's language: *Dedans* at nought, otherwise
 * *à 1 480 km* in a sentence or *1 480 km* on the map's own line.
 */
export const useDistanceWords = (): ((
  distanceKm: number,
  form: DistanceForm
) => string) => {
  const { locale, translate } = useI18n()
  const kilometres = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })

  return (distanceKm, form) =>
    distanceKm === 0
      ? translate('worldmap.reveal.inside')
      : translate(`worldmap.reveal.${form}`, {
          distance: kilometres.format(distanceKm)
        })
}

/**
 * What a revealed answer reads as: the line it was typed or picked as, and
 * on the world map its distance — the server records a marker as two
 * coordinates, which is nobody's answer to read.
 */
export const useAnswerWords = (
  round: RoundView
): ((answer: { playerId: string; said: string }) => string) => {
  const distanceWords = useDistanceWords()

  return (answer) => {
    const distanceKm = distanceOf(round, answer.playerId)

    return distanceKm === null ? answer.said : distanceWords(distanceKm, 'away')
  }
}
