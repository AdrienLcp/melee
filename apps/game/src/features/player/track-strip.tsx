import type React from 'react'

import type { PlayerRoomView } from '@melee/protocol/room'

import { type TrackPawn, trackPawnsOf } from '@melee/core/board/track-pawns'

import {
  TrackPawnPiece,
  trackPawnNumberOf
} from '@/presentation/components/track-pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './track-strip.sass'

const CASES_SHOWN = 7

/**
 * The stretch of the track this player's pawn — their team's, or their own —
 * stands on, centred on it:
 * the wall draws the whole race, a screen in the hand needs where its own
 * pawn is and who is close. The ends of the strip fade where the track runs
 * on past them, and stop square on the start and the finish.
 */
export const TrackStrip: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const translate = useTranslate()
  const { board } = view.settings
  const pawns = trackPawnsOf(view)
  const yours = pawns.find((pawn) => isPlayersPawn({ pawn, view }))

  if (board.kind !== 'track' || yours === undefined) {
    return null
  }

  const { length } = board
  const { case: at, move } = yours.board
  const cases = casesAround({ at, length })
  const first = cases[0] ?? 0
  const last = cases.at(-1) ?? length

  return (
    <div
      className='track-strip'
      data-runs-on={runsOnOf({ first, last, length })}
      style={{ '--team': `var(--pawn-${trackPawnNumberOf(yours)})` }}
    >
      <p className='where'>
        {translate('board.case', { case: at, length })}
        {move > 0 && (
          <span className='walked'>
            {translate('board.walked', { count: move })}
          </span>
        )}
      </p>
      <div
        aria-hidden='true'
        className='cases'
        style={{ '--cases': cases.length }}
      >
        {cases.map((caseIndex) => {
          const others = pawns.filter(
            (pawn) => pawn.id !== yours.id && pawn.board.case === caseIndex
          )

          return (
            <div
              className='case'
              data-mark={markOf({ caseIndex, length })}
              data-parity={caseIndex % 2 === 0 ? 'even' : 'odd'}
              data-yours={caseIndex === at || undefined}
              key={caseIndex}
            >
              <span className='number'>
                {caseIndex === 0
                  ? translate('board.start')
                  : caseIndex === length
                    ? translate('board.finish')
                    : caseIndex}
              </span>
              {others.length > 0 && (
                <span className='others'>
                  {others.map((pawn) => (
                    <TrackPawnPiece key={pawn.id} pawn={pawn} />
                  ))}
                </span>
              )}
              {caseIndex === at && (
                // Keyed on the case, so a correction is a fresh hop.
                <span className='own' key={at}>
                  <TrackPawnPiece pawn={yours} />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const isPlayersPawn = ({
  pawn,
  view
}: {
  pawn: TrackPawn
  view: PlayerRoomView
}): boolean =>
  pawn.kind === 'seat'
    ? pawn.id === view.youId
    : pawn.team.seatIds.includes(view.youId)

/** Seven cases with `at` in the middle, slid inward rather than cut at an end. */
const casesAround = ({
  at,
  length
}: {
  at: number
  length: number
}): number[] => {
  const shown = Math.min(CASES_SHOWN, length + 1)
  const first = Math.min(
    Math.max(0, at - Math.floor(shown / 2)),
    length + 1 - shown
  )

  return Array.from({ length: shown }, (_, offset) => first + offset)
}

const runsOnOf = ({
  first,
  last,
  length
}: {
  first: number
  last: number
  length: number
}): string => {
  if (first > 0 && last < length) {
    return 'both'
  }

  if (first > 0) {
    return 'before'
  }

  return last < length ? 'after' : 'none'
}

const markOf = ({
  caseIndex,
  length
}: {
  caseIndex: number
  length: number
}): string | undefined => {
  if (caseIndex === 0) {
    return 'start'
  }

  if (caseIndex === length) {
    return 'finish'
  }

  return caseIndex % 5 === 0 ? 'five' : undefined
}
