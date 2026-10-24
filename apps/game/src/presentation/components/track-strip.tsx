import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import type { TrackPawn } from '@melee/core/board/track-pawns'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { TrackPawnPiece, trackPawnNumberOf } from './track-pawn'

import './track-strip.sass'

const CASES_SHOWN = 7
/** The other pawns a case shows before it says how many more stand there. */
const OTHERS_SHOWN = 3

type TrackStripProps = {
  /** A line under the cases, read with them. */
  children?: React.ReactNode
  /** The cases between the start and the finish. */
  length: number
  /** Every pawn on the track: a team's, or a seat's when the room plays alone. */
  pawns: readonly TrackPawn[]
  /**
   * How much of the track is drawn (default: `'around'`):
   * - `'around'` — seven cases around the pawn, beside a wall drawing the race
   * - `'whole'` — every case at full size, scrolled sideways and opened on the
   *   pawn, for a room with no wall to draw it
   */
  reach?: 'around' | 'whole'
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
  children,
  length,
  pawns,
  reach = 'around',
  yours
}) => {
  const translate = useTranslate()
  const at = yours?.board.case ?? 0
  const move = yours?.board.move ?? 0
  const isWhole = reach === 'whole'
  const cases = isWhole
    ? Array.from({ length: length + 1 }, (_, caseIndex) => caseIndex)
    : casesAround({ at, length })
  const first = cases[0] ?? 0
  const last = cases.at(-1) ?? length
  const ribbon = useRibbon({ at, isWhole })

  const caseList = (
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
            data-own={(yours !== undefined && caseIndex === at) || undefined}
            data-parity={caseIndex % 2 === 0 ? 'even' : 'odd'}
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
  )

  return (
    <div
      className='track-strip'
      data-reach={reach}
      data-runs-on={isWhole ? ribbon.runsOn : runsOnOf({ first, last, length })}
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
        {isWhole && yours !== undefined && (
          <Button
            className='recentre'
            data-hidden={!ribbon.isOwnAway || undefined}
            onPress={ribbon.recentre}
            size='small'
            variant='outlined'
          >
            <TrackPawnPiece pawn={yours} />
            {translate('board.recentre')}
          </Button>
        )}
      </p>
      {isWhole ? (
        <div className='ribbon' onScroll={ribbon.onScroll} ref={ribbon.ref}>
          {caseList}
        </div>
      ) : (
        caseList
      )}
      {children}
    </div>
  )
}

/** How close to an end, in pixels, still counts as standing on it. */
const SCROLL_SLACK_PX = 4

/** The whole track draws every case from the start, so a case is its own index. */
const caseIn = ({
  at,
  scroller
}: {
  at: number
  scroller: HTMLElement
}): HTMLElement | undefined => {
  const caseElement = scroller.firstElementChild?.children[at]

  return caseElement instanceof HTMLElement ? caseElement : undefined
}

const ribbonScrollOf = ({
  at,
  scroller
}: {
  at: number
  scroller: HTMLElement
}): RibbonScroll => {
  const own = caseIn({ at, scroller })
  const ownLeft = (own?.offsetLeft ?? 0) - scroller.scrollLeft
  const runsBefore = scroller.scrollLeft > SCROLL_SLACK_PX
  const runsAfter =
    scroller.scrollLeft + scroller.clientWidth <
    scroller.scrollWidth - SCROLL_SLACK_PX

  return {
    isOwnAway:
      own !== undefined &&
      (ownLeft + own.offsetWidth < 0 || ownLeft > scroller.clientWidth),
    runsOn:
      runsBefore && runsAfter
        ? 'both'
        : runsBefore
          ? 'before'
          : runsAfter
            ? 'after'
            : 'none'
  }
}

const centreOn = ({
  at,
  behavior,
  scroller
}: {
  at: number
  behavior: ScrollBehavior
  scroller: HTMLElement
}): void => {
  const own = caseIn({ at, scroller })

  if (own !== undefined) {
    scroller.scrollTo({
      behavior,
      left: own.offsetLeft + own.offsetWidth / 2 - scroller.clientWidth / 2
    })
  }
}

type RibbonScroll = {
  /** The pawn's case has left the view, which is when *Recentre* is offered. */
  isOwnAway: boolean
  runsOn: 'both' | 'before' | 'after' | 'none'
}

/**
 * The whole track's scroller: opened on the pawn, and again every time the
 * pawn moves, and saying whether the pawn has left the view and which ends
 * run on past it.
 */
const useRibbon = ({ at, isWhole }: { at: number; isWhole: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState<RibbonScroll>({
    isOwnAway: false,
    runsOn: 'none'
  })

  useLayoutEffect(() => {
    const scroller = ref.current

    if (!isWhole || scroller === null) {
      return
    }

    centreOn({ at, behavior: 'instant', scroller })
    setScroll(ribbonScrollOf({ at, scroller }))
  }, [at, isWhole])

  return {
    ...scroll,
    onScroll: (event: React.UIEvent<HTMLElement>) =>
      setScroll(ribbonScrollOf({ at, scroller: event.currentTarget })),
    recentre: () => {
      if (ref.current !== null) {
        centreOn({
          at,
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          scroller: ref.current
        })
      }
    },
    ref
  }
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
