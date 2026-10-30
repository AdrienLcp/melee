import type { AtlasTargetKind } from '@melee/protocol/atlas'
import { UNIT_OF_FAMILY } from '@melee/protocol/estimate'
import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'
import type { RoundView } from '@melee/protocol/room'

import {
  atlasContent,
  distanceOf,
  estimateContent,
  higherLowerContent,
  rightPairsOf,
  swappedPairsOf
} from '@/helpers/round-content'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { useQuantityWords } from './use-quantity-words'

type DistanceForm = 'away' | 'km'

/**
 * A marker's distance in the reader's language: *Dedans* at nought from a
 * country, *Dans le mille* on a city or a capital, otherwise *à 1 480 km* in a sentence or
 * *1 480 km* on the map's own line.
 */
export const useDistanceWords = (
  target: AtlasTargetKind
): ((distanceKm: number, form: DistanceForm) => string) => {
  const { locale, translate } = useI18n()
  const kilometres = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })

  return (distanceKm, form) =>
    distanceKm === 0
      ? translate(
          target === 'country'
            ? 'atlas.reveal.inside'
            : 'atlas.reveal.onTheSpot'
        )
      : translate(`atlas.reveal.${form}`, {
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
 * place picked by name in the reader's language — on the world map its distance, on the timeline the pairs it swapped, and an estimate with its unit — the server
 * records a marker as two coordinates, an order as a row of ids and a guess as
 * bare digits and a sheet of pairs as its sides, which are nobody's answer to read:
 * a lone pair reads as the name picked, several as how many were right.
 */
export const useAnswerWords = (
  round: RoundView
): ((answer: { playerId: string; said: string }) => string) => {
  const { locale, translate } = useI18n()
  const atlas = atlasContent(round)
  const distanceWords = useDistanceWords(atlas?.target?.kind ?? 'country')

  const orderWords = useOrderWords()
  const quantityWords = useQuantityWords()
  const estimate = estimateContent(round)
  const higherLower = higherLowerContent(round)

  return (answer) => {
    if (higherLower !== null) {
      const onlyPair =
        higherLower.pairs.length === 1 ? higherLower.pairs[0] : undefined

      if (
        onlyPair !== undefined &&
        (answer.said === 'left' || answer.said === 'right')
      ) {
        return onlyPair[answer.said][locale]
      }

      return translate('higherlower.reveal.score', {
        count: HIGHER_LOWER_PAIR_COUNT,
        right: rightPairsOf(round, answer.playerId) ?? 0
      })
    }

    if (estimate !== null) {
      return quantityWords(
        Number(answer.said),
        UNIT_OF_FAMILY[estimate.question.family]
      )
    }

    const distanceKm = distanceOf(round, answer.playerId)
    const swappedPairs = swappedPairsOf(round, answer.playerId)
    // A place picked by name is recorded in French, whatever the picker read.
    const pickedName = atlas?.choices.find(
      (choice) => choice.fr === answer.said
    )

    return distanceKm !== null
      ? distanceWords(distanceKm, 'away')
      : swappedPairs !== null
        ? orderWords(swappedPairs)
        : (pickedName?.[locale] ?? answer.said)
  }
}
