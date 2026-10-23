import type React from 'react'

import type { TrackPawn } from '@melee/core/board/track-pawns'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { TrackPawnPiece, trackPawnNumberOf } from './track-pawn'

import './track-strip.sass'

const CASES_SHOWN = 7
/** The other pawns a case shows before it says how many more stand there. */
const OTHERS_SHOWN = 3

type TrackStripProps = {
  /** The cases between the start and the finish. */
  length: number
  /** Every pawn on the track: a team's, or a seat's when the room plays alone. */
  pawns: readonly TrackPawn[]
  /**
   * The pawn this screen plays, stood up and ringed, and what the strip is
   * centred on; `undefined` on a screen holding none, which shows the start
   * and says how long the race is.
   */
  yours: TrackPawn | undefined
}

/**
 * The stretch of the track a pawn stands on, centred on it: the wall draws
 * the whole race, a screen in the hand needs where its own pawn is and who is
 * close. The ends of the strip fade where the track runs on past them, and
 * stop square on the start and the finish.
 */
export const TrackStrip: React.FC<TrackStripProps> = ({
  length,
  pawns,
  yours
}) => {
  const translate = useTranslate()
  const at = yours?.board.case ?? 0
  const move = yours?.board.move ?? 0
  const cases = casesAround({ at, length })
  const first = cases[0] ?? 0
  const last = cases.at(-1) ?? length

  return (
    <div
      className='track-strip'
      data-runs-on={runsOnOf({ first, last, length })}
      style={
        yours === undefined
          ? undefined
          : { '--team': `var(--pawn-${trackPawnNumberOf(yours)})` }
      }
    >
      <p className='where'>
        {yours === undefined
          ? translate('board.setting.length', { length })
          : translate('board.case', { case: at, length })}
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
            (pawn) => pawn.id !== yours?.id && pawn.board.case === caseIndex
          )

          return (
            <div
              className='case'
              data-mark={markOf({ caseIndex, length })}
              data-parity={caseIndex % 2 === 0 ? 'even' : 'odd'}
              data-yours={
                (yours !== undefined && caseIndex === at) || undefined
              }
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
                  {others.slice(0, OTHERS_SHOWN).map((pawn) => (
                    <TrackPawnPiece key={pawn.id} pawn={pawn} />
                  ))}
                  {others.length > OTHERS_SHOWN && (
                    <span className='more'>
                      {translate('board.more', {
                        count: others.length - OTHERS_SHOWN
                      })}
                    </span>
                  )}
                </span>
              )}
              {yours !== undefined && caseIndex === at && (
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
