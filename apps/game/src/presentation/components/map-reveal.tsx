import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { distanceOf, worldmapContent } from '@/helpers/round-content'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { LazyWorldMap } from './lazy-world-map'
import { useDistanceWords } from './use-distance-words'
import { VisuallyHidden } from './visually-hidden'
import type { RevealedMarker } from './world-map'

import './map-reveal.sass'

type MapRevealProps = {
  /** Needed to colour each pawn by its seat, or its team. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * The map round turned over, on every screen alike: the country named and
 * filled, every pawn where it landed, and a line from each one outside to the
 * nearest border with how far that was.
 */
export const MapReveal: React.FC<MapRevealProps> = ({ players, round }) => {
  const translate = useTranslate()
  const distanceWords = useDistanceWords()
  const content = worldmapContent(round)

  if (content === null) {
    return null
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
          {`${translate('worldmap.reveal.title')} `}
        </VisuallyHidden>
        {translate(`worldmap.country.${content.countryCode}.name`)}
      </figcaption>
      <LazyWorldMap
        marker={null}
        revealed={{ countryCode: content.countryCode, markers }}
      />
    </figure>
  )
}
