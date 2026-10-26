import type React from 'react'
import { useState } from 'react'

import type { GeoPoint } from '@melee/protocol/atlas'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundView } from '@melee/protocol/room'

import { atlasContent, mapRegionOf } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { LazyWorldMap } from '@/presentation/components/lazy-world-map'
import { usePawnNumber } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './map-answer.sass'

type MapAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  round: RoundView
  /** The answering seat's place in the roster, which colours the pawn — its team's when there are teams. */
  seat: number
  /** The seat answering: a player's, a seated console's, or the wall's team. */
  youId: PlayerId | null
}

/**
 * The pawn goes down, moves as often as the player likes, and leaves only on
 * the press perched over it: a slipped finger is not an answer, and a map
 * round is one shot a seat.
 *
 * Mounted under `key={round.id}`, so the pawn is about this round alone.
 */
export const MapAnswer: React.FC<MapAnswerProps> = ({
  onAnswer,
  round,
  seat,
  youId
}) => {
  const translate = useTranslate()
  const pawnNumber = usePawnNumber({ seat })
  const [point, setPoint] = useState<GeoPoint | null>(null)
  const [isSent, setIsSent] = useState(false)

  // The server's record is what survives a reload — the pawn itself does not,
  // since no screen is told where anyone put theirs before the reveal.
  const hasAnswered =
    isSent || round.answers.some((answer) => answer.playerId === youId)
  const content = atlasContent(round)

  return (
    <section
      className='answer-form map-answer'
      data-sent={hasAnswered || undefined}
    >
      <LazyWorldMap
        marker={point === null ? null : { pawnNumber, point }}
        markerActions={
          hasAnswered || point === null ? undefined : (
            <>
              <Button
                onPress={() => {
                  if (onAnswer({ kind: 'point', point })) {
                    setIsSent(true)
                  }
                }}
                size='large'
              >
                {translate('atlas.answer.confirm')}
              </Button>
              <Button
                onPress={() => setPoint(null)}
                size='large'
                variant='outlined'
              >
                {translate('atlas.answer.cancel')}
              </Button>
            </>
          )
        }
        onPlace={hasAnswered ? undefined : setPoint}
        region={content === null ? 'world' : mapRegionOf(content)}
      />
      <p className='hint' role='status'>
        {translate(
          hasAnswered
            ? 'atlas.answer.sent'
            : point === null
              ? 'atlas.map.hint'
              : 'atlas.map.moveHint'
        )}
      </p>
    </section>
  )
}
