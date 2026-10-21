import type React from 'react'
import { useState } from 'react'

import {
  type ChallengeFinisher,
  type ChallengePlace,
  challengePlaces
} from '@melee/protocol/challenge'
import type { ClientMessage, ScoreTarget } from '@melee/protocol/client-message'
import type { HostRoomView, RoundView } from '@melee/protocol/room'

import { Button } from '@/presentation/components/button'
import { Pawn } from '@/presentation/components/pawn'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './challenge-placing.sass'

const UNPLACED = 'none'

const PLACE_KEYS: Record<ChallengePlace, PlainTranslationKey> = {
  1: 'challenge.places.first',
  2: 'challenge.places.second',
  3: 'challenge.places.third'
}

type Finisher = {
  /** The team's pawn; a seat has none of its own. */
  colour: number | null
  id: string
  name: string
  target: ScoreTarget
}

type ChallengePlacingProps = {
  isLive: boolean
  round: RoundView
  send: (message: ClientMessage) => boolean
  view: HostRoomView
}

/**
 * The host's word on who finished where: a place per team, or per seat with
 * Teams off, then one press that pays and reveals. Giving it to nobody is the
 * plain reveal, which pays nought.
 *
 * In roster order, never ranked, for the reason the menu's points are: a row
 * that moves under the thumb sends the next press to somebody else.
 */
export const ChallengePlacing: React.FC<ChallengePlacingProps> = ({
  isLive,
  round,
  send,
  view
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const [places, setPlaces] = useState<ReadonlyMap<string, ChallengePlace>>(
    () => new Map()
  )

  // A seat that sat down after the round opened plays from the next one, and
  // has nothing here to be placed for.
  const finishers: Finisher[] =
    view.teams.length > 0
      ? view.teams.map((team) => ({
          colour: team.colour,
          id: team.id,
          name: teamName(team),
          target: { kind: 'team', teamId: team.id }
        }))
      : view.players
          .filter(
            (player) => round.openedWithPlayerIds?.includes(player.id) ?? true
          )
          .map((player) => ({
            colour: null,
            id: player.id,
            name: player.nickname,
            target: { kind: 'seat', playerId: player.id }
          }))

  const placed: ChallengeFinisher[] = finishers.flatMap((finisher) => {
    const place = places.get(finisher.id)

    return place === undefined ? [] : [{ place, target: finisher.target }]
  })

  const options = [
    { label: translate('challenge.places.none'), value: UNPLACED },
    ...challengePlaces.map((place) => ({
      label: translate(PLACE_KEYS[place]),
      value: String(place)
    }))
  ]

  const placeFinisher = (id: string, value: string) => {
    const place = challengePlaces.find(
      (candidate) => String(candidate) === value
    )
    const next = new Map(places)

    if (place === undefined) {
      next.delete(id)
    } else {
      next.set(id, place)
    }

    setPlaces(next)
  }

  return (
    <section
      aria-label={translate('challenge.places.label')}
      className='challenge-placing'
    >
      <ul className='challenge-placing-rows'>
        {finishers.map((finisher) => (
          <li
            className='challenge-placing-row'
            key={finisher.id}
            style={
              finisher.colour === null
                ? undefined
                : { '--team': `var(--pawn-${finisher.colour})` }
            }
          >
            {finisher.colour !== null && <Pawn colour={finisher.colour} />}
            <SegmentedControl
              isDisabled={!isLive}
              label={finisher.name}
              onChange={(value) => {
                placeFinisher(finisher.id, value)
              }}
              options={options}
              value={String(places.get(finisher.id) ?? UNPLACED)}
            />
          </li>
        ))}
      </ul>
      <div className='challenge-placing-actions'>
        <Button
          isDisabled={!isLive || placed.length === 0}
          onPress={() => {
            send({
              places: placed,
              roundId: round.id,
              type: 'host.awardPlaces'
            })
          }}
          size='large'
        >
          {translate('challenge.places.confirm')}
        </Button>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ roundId: round.id, type: 'host.reveal' })
          }}
          variant='underlined'
        >
          {translate('challenge.places.nobody')}
        </Button>
      </div>
    </section>
  )
}
