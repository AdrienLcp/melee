import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import {
  distanceOf,
  mapRegionOf,
  worldmapContent
} from '@/helpers/round-content'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

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
 * filled or the city dotted, every pawn where it landed, and a line from each
 * one off it to the nearest border or to the city, with how far that was.
 */
export const MapReveal: React.FC<MapRevealProps> = ({ players, round }) => {
  const translate = useTranslate()
  const content = worldmapContent(round)
  const distanceWords = useDistanceWords(content?.target.kind ?? 'country')

  if (content === null) {
    return null
  }

  const { target } = content
  const revealedTarget: RevealedTarget | null =
    target.kind === 'country'
      ? target
      : target.point === null
        ? null
        : { kind: 'city', point: target.point }

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
          {`${translate(target.kind === 'city' ? 'worldmap.reveal.cityTitle' : 'worldmap.reveal.title')} `}
        </VisuallyHidden>
        {target.kind === 'city'
          ? target.name
          : translate(`worldmap.country.${target.countryCode}.name`)}
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
