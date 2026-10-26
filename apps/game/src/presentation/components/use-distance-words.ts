import type { RoundView } from '@melee/protocol/room'
import type { WorldmapTargetKind } from '@melee/protocol/worldmap'

import {
  distanceOf,
  swappedPairsOf,
  worldmapContent
} from '@/helpers/round-content'
import { useI18n } from '@/presentation/i18n/i18n-provider'

type DistanceForm = 'away' | 'km'

/**
 * A marker's distance in the reader's language: *Dedans* at nought from a
 * country, *Dans le mille* on a city or a capital, otherwise *à 1 480 km* in a sentence or
 * *1 480 km* on the map's own line.
 */
export const useDistanceWords = (
  target: WorldmapTargetKind
): ((distanceKm: number, form: DistanceForm) => string) => {
  const { locale, translate } = useI18n()
  const kilometres = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })

  return (distanceKm, form) =>
    distanceKm === 0
      ? translate(
          target === 'country'
            ? 'worldmap.reveal.inside'
            : 'worldmap.reveal.onTheSpot'
        )
      : translate(`worldmap.reveal.${form}`, {
          distance: kilometres.format(distanceKm)
        })
}

/** An order's result in the reader's language: *In order*, or how many pairs it swapped. */
export const useOrderWords = (): ((swappedPairs: number) => string) => {
  const { translate } = useI18n()

  return (swappedPairs) =>
    swappedPairs === 0
      ? translate('timeline.reveal.perfect')
      : translate('timeline.reveal.swapped', { pairs: swappedPairs })
}

/**
 * A move's result in the reader's language: right, the second or third best a
 * number could be made, better than dealt but not by enough, or nothing.
 */
export const useMoveWords = (): ((placesFromBest: number | null) => string) => {
  const { translate } = useI18n()

  return (placesFromBest) => {
    switch (placesFromBest) {
      case null:
        return translate('matchsticks.reveal.wrong')
      case 0:
        return translate('matchsticks.reveal.right')
      case 1:
        return translate('matchsticks.reveal.second')
      case 2:
        return translate('matchsticks.reveal.third')
      default:
        return translate('matchsticks.reveal.short')
    }
  }
}

/**
 * What a revealed answer reads as: the line it was typed or picked as — a
 * place picked by name in the reader's language — on the world map its distance and on the timeline the pairs it swapped — the server
 * records a marker as two coordinates and an order as a row of ids, which are
 * nobody's answer to read.
 */
export const useAnswerWords = (
  round: RoundView
): ((answer: { playerId: string; said: string }) => string) => {
  const { locale } = useI18n()
  const worldmap = worldmapContent(round)
  const distanceWords = useDistanceWords(worldmap?.target?.kind ?? 'country')

  const orderWords = useOrderWords()

  return (answer) => {
    const distanceKm = distanceOf(round, answer.playerId)
    const swappedPairs = swappedPairsOf(round, answer.playerId)
    // A place picked by name is recorded in French, whatever the picker read.
    const pickedName = worldmap?.choices.find(
      (choice) => choice.fr === answer.said
    )

    return distanceKm !== null
      ? distanceWords(distanceKm, 'away')
      : swappedPairs !== null
        ? orderWords(swappedPairs)
        : (pickedName?.[locale] ?? answer.said)
  }
}
