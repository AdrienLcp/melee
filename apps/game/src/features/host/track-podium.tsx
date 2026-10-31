import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'

import { placeTrackPawns, type TrackPawn } from '@melee/core/board/track-pawns'

import { ReadyMark } from '@/presentation/components/ready-mark'
import {
  TrackPawnPiece,
  useTrackPawnName
} from '@/presentation/components/track-pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './track-podium.sass'

const PODIUM_PLACES = 3

const isReady = (pawn: TrackPawn): boolean =>
  pawn.kind === 'seat' && pawn.player.isReady

/** What the round on screen walked a pawn, before the case it reached. */
const Walked: React.FC<{ move: number }> = ({ move }) => {
  const translate = useTranslate()

  return move > 0 ? (
    <span className='walked'>{translate('board.walked', { count: move })}</span>
  ) : null
}

type TrackPodiumProps = {
  /**
   * Checks each seat back at the table between two rounds. Off wherever
   * nobody is asked to be ready.
   */
  marksReady?: boolean
  /** The track's pawns, in any order: the podium ranks them itself. */
  pawns: readonly TrackPawn[]
  /** The seated host's own pawn, in a keyline; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * The head of the race between two rounds, in a room where every seat walks
 * its own pawn: the three leaders on their steps, the second on the left and
 * the third on the right as a podium stands, and everyone else on a chip with
 * the case they stand on. A tie stands its pawns on steps of one height. A board of fifteen names read from across the room
 * is a list nobody reads; three steps and a heap is a race.
 */
export const TrackPodium: React.FC<TrackPodiumProps> = ({
  marksReady,
  pawns,
  youId
}) => {
  const translate = useTranslate()
  const pawnName = useTrackPawnName()
  const placed = placeTrackPawns(pawns)
  const leaders = placed.slice(0, PODIUM_PLACES)
  const rest = placed.slice(PODIUM_PLACES).map(({ pawn }) => pawn)

  return (
    <div className='track-podium'>
      <ol className='steps'>
        {leaders.map(({ pawn, place }, slot) => (
          <li
            className={classNames('step', pawn.id === youId && 'you')}
            data-place={place}
            data-slot={slot + 1}
            key={pawn.id}
          >
            <TrackPawnPiece pawn={pawn} />
            <span className='name'>{pawnName(pawn)}</span>
            {marksReady === true && isReady(pawn) && <ReadyMark />}
            <span className='at'>
              <Walked move={pawn.board.move} />
              {translate('board.at', { case: pawn.board.case })}
            </span>
          </li>
        ))}
      </ol>
      {rest.length > 0 && (
        <ol className='rest' start={PODIUM_PLACES + 1}>
          {rest.map((pawn) => (
            <li
              className={classNames('chip', pawn.id === youId && 'you')}
              key={pawn.id}
            >
              <TrackPawnPiece pawn={pawn} />
              <span className='name'>{pawnName(pawn)}</span>
              {marksReady === true && isReady(pawn) && <ReadyMark />}
              <span className='at'>
                <Walked move={pawn.board.move} />
                {pawn.board.case}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
