import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  distanceOf,
  mapRegionOf,
  worldmapContent
} from '@/helpers/round-content'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { LazyWorldMap } from './lazy-world-map'
import { useDistanceWords } from './use-distance-words'
import { VisuallyHidden } from './visually-hidden'
import type { RevealedMarker, RevealedTarget } from './world-map'

import './map-reveal.sass'

type MapRevealProps = {
  /** Needed to colour each pawn by its seat, or its team. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * The map round turned over, on every screen alike: the country named and
 * filled, or the city or the capital dotted — the capital beside its country — every pawn where it landed, and a line from each
 * one off it to the nearest border or to the city, with how far that was.
 */
export const MapReveal: React.FC<MapRevealProps> = ({ players, round }) => {
  const { locale, translate } = useI18n()
  const content = worldmapContent(round)
  const distanceWords = useDistanceWords(content?.target?.kind ?? 'country')

  if (content === null || content.target === null) {
    return null
  }

  const { target } = content
  const revealedTarget: RevealedTarget | null =
    target.kind === 'country'
      ? target
      : target.point === null
        ? null
        : { kind: 'city', point: target.point }

  const captionTitle = (): string => {
    switch (target.kind) {
      case 'capital':
        return translate('worldmap.reveal.capitalTitle')
      case 'city':
        return translate('worldmap.reveal.cityTitle')
      case 'country':
        return translate('worldmap.reveal.title')
    }
  }

  const captionName = (): string => {
    switch (target.kind) {
      case 'capital':
        return target.countryCode === null
          ? target.names[locale]
          : translate('worldmap.reveal.capitalOf', {
              capital: target.names[locale],
              country: translate(`worldmap.country.${target.countryCode}.name`)
            })
      case 'city':
        return target.name
      case 'country':
        return translate(`worldmap.country.${target.countryCode}.name`)
    }
  }

  const markers = (content.revealedPlacements ?? []).flatMap(
    (placement): RevealedMarker[] => {
      const distanceKm = distanceOf(round, placement.playerId)

      return distanceKm === null
        ? []
        : [
            {
              distanceKm,
              label: distanceWords(distanceKm, 'km'),
              playerId: placement.playerId,
              point: placement.point,
              seat: players.findIndex(
                (player) => player.id === placement.playerId
              )
            }
          ]
    }
  )

  return (
    <figure className='map-reveal'>
      <figcaption className='country'>
        <VisuallyHidden elementType='span'>
          {`${captionTitle()} `}
        </VisuallyHidden>
        {captionName()}
      </figcaption>
      <LazyWorldMap
        marker={null}
        region={mapRegionOf(content)}
        revealed={
          revealedTarget === null
            ? undefined
            : { markers, target: revealedTarget }
        }
      />
    </figure>
  )
}
