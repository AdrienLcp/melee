import { prefersReducedMotion } from '@adrienlcp/browser'
import type React from 'react'
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { flushSync } from 'react-dom'

import type { BoardSettings } from '@melee/protocol/board'

import type { PawnId } from '@melee/core/board/board-strategy'
import type { TrackPawn } from '@melee/core/board/track-pawns'
import {
  type TrackShape,
  trackCellOf,
  trackShapeFor
} from '@melee/core/board/track-shape'

import { onLayoutMoved } from '@/infrastructure/browser'
import {
  TrackPawnPiece,
  useTrackPawnName
} from '@/presentation/components/track-pawn'
import { useTrackPresence } from '@/presentation/components/use-track-presence'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './board-track.sass'

const CASES_PER_MARK = 5
/** Past this many on one case, three are drawn and a count stands for the rest. */
const MAX_PAWNS_DRAWN = 4
const PAWNS_BESIDE_COUNT = 3
const STEP_MS = 240
/** Long enough for the answer to land before the pawns set off. */
const WALK_DELAY_MS = 600

type WalkTarget = { id: PawnId; move: number; target: number }

type BoardTrackProps = {
  /** The room's board; `off` sends a track on the screen back out past the edges. */
  board: BoardSettings
  /** The pawns racing — the teams', or every seat's — each on its `board.case`. */
  pawns: readonly TrackPawn[]
}

/**
 * The table's race, printed round the stage like a board game's track: one
 * line along the top while its cases stay readable, else up the left side,
 * across the top and down the right, the bottom left open for the round, else
 * closed along the bottom too (`trackShapeFor`). It fills the wall, or a
 * console's stage beside its panel when no wall is in the room.
 *
 * At a reveal each pawn walks the cases it just won rather than teleporting,
 * which is the moment the room watches. Turned on, the cases come in from the
 * edges they lie along while the stage draws in to make room; turned off, they
 * go back out and the stage spreads again.
 */
export const BoardTrack: React.FC<BoardTrackProps> = ({ board, pawns }) => {
  const translate = useTranslate()
  const pawnName = useTrackPawnName()
  const trackRef = useRef<HTMLDivElement>(null)
  const [length, setLength] = useState(trackLengthOf(board))
  const shape = useTrackShape({ caseCount: length + 1, trackRef })
  const track = useTrackPresence({
    board,
    isDrawn: shape !== null,
    pawns,
    trackRef
  })
  const shownCases = useWalkedCases(track?.pawns ?? NO_PAWNS)

  if (track !== null && track.length !== length) {
    setLength(track.length)
  }

  return (
    <div
      className='board-track'
      data-presence={track?.presence}
      data-shape={track === null ? undefined : shape?.kind}
      ref={trackRef}
    >
      {track !== null && (
        <VisuallyHidden elementType='ol'>
          {track.pawns.map((pawn) => (
            <li key={pawn.id}>
              {translate('board.standing', {
                case: pawn.board.case,
                length,
                team: pawnName(pawn)
              })}
            </li>
          ))}
        </VisuallyHidden>
      )}
      {track !== null && shape !== null && (
        <div
          aria-hidden='true'
          className='cases'
          style={{
            '--track-columns': shape.columns,
            '--track-rows': shape.rows
          }}
        >
          {casesOf(length).map((caseIndex) => {
            const [column, row] = trackCellOf({ caseIndex, shape })
            const standing = track.pawns.filter(
              (pawn) => shownCases.get(pawn.id) === caseIndex
            )
            const drawn =
              standing.length > MAX_PAWNS_DRAWN
                ? standing.slice(0, PAWNS_BESIDE_COUNT)
                : standing

            return (
              <div
                className='case'
                data-mark={markOf({ caseIndex, length })}
                data-parity={caseIndex % 2 === 0 ? 'even' : 'odd'}
                data-side={sideOf({ column, row, shape })}
                key={caseIndex}
                style={{
                  '--case-order': caseIndex / length,
                  '--column': column,
                  '--pawn-scale': pawnScaleFor(drawn.length),
                  '--row': row
                }}
              >
                <span className='number'>
                  {caseIndex === 0
                    ? translate('board.start')
                    : caseIndex === length
                      ? translate('board.finish')
                      : caseIndex}
                </span>
                {standing.length > 0 && (
                  <span className='pawns'>
                    {drawn.map((pawn) => (
                      <span
                        className='standing'
                        // Keyed on the case too, so each step is a new element
                        // that hops in rather than one that slides.
                        key={`${pawn.id}:${caseIndex}`}
                      >
                        <TrackPawnPiece pawn={pawn} />
                      </span>
                    ))}
                    {drawn.length < standing.length && (
                      <span className='more'>
                        {translate('board.more', {
                          count: standing.length - drawn.length
                        })}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * The track's shape in the box it fills, re-measured as the box changes. The
 * smaller side of a case is published on the root element, where the page's
 * gutters and the fixed menu read it to keep clear of the track.
 */
const useTrackShape = ({
  caseCount,
  trackRef
}: {
  caseCount: number
  trackRef: React.RefObject<HTMLDivElement | null>
}): TrackShape | null => {
  const [shape, setShape] = useState<TrackShape | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current

    if (track === null) {
      return
    }

    const root = document.documentElement.style

    const measure = () => {
      const { clientHeight: height, clientWidth: width } = track

      if (height === 0 || width === 0) {
        setShape(null)

        return
      }

      const next = trackShapeFor({
        bandSide: Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--board-band-wanted'
          )
        ),
        caseCount,
        height,
        width
      })

      root.setProperty(
        '--board-case',
        `${Math.min(next.cellWidth, next.cellHeight)}px`
      )
      setShape((current) =>
        current?.kind === next.kind &&
        current.columns === next.columns &&
        current.rows === next.rows
          ? current
          : next
      )
    }

    const observer = new ResizeObserver(measure)
    const stopFollowingMoves = onLayoutMoved(() => {
      flushSync(measure)
    })

    measure()
    observer.observe(track)

    return () => {
      observer.disconnect()
      stopFollowingMoves()
      root.removeProperty('--board-case')
    }
  }, [caseCount, trackRef])

  return shape
}

/**
 * The case each pawn is drawn on. A pawn the round has just moved
 * starts back where it stood and steps a case at a time to its new one; a
 * correction after that walks from wherever it is drawn. Under reduced motion
 * every pawn is simply where it stands.
 */
const useWalkedCases = (
  pawns: readonly TrackPawn[]
): ReadonlyMap<PawnId, number> => {
  const [shown, setShown] = useState<ReadonlyMap<PawnId, number>>(
    () => new Map(pawns.map((pawn) => [pawn.id, pawn.board.case]))
  )
  const seenMoves = useRef<ReadonlyMap<PawnId, number>>(new Map())
  const targets = pawns.map((pawn) => ({
    id: pawn.id,
    move: pawn.board.move,
    target: pawn.board.case
  }))
  const signature = targets
    .map(({ id, move, target }) => `${id}:${target}:${move}`)
    .join(',')

  const startWalk = useEffectEvent(() => {
    const isFreshMove = ({ id, move }: WalkTarget) =>
      move > 0 && (seenMoves.current.get(id) ?? 0) === 0

    const isReduced = prefersReducedMotion()
    const startOf = (
      entry: WalkTarget,
      current: ReadonlyMap<PawnId, number>
    ) => {
      if (isReduced) {
        return entry.target
      }

      return isFreshMove(entry)
        ? entry.target - entry.move
        : (current.get(entry.id) ?? entry.target)
    }

    setShown(
      (current) =>
        new Map(targets.map((entry) => [entry.id, startOf(entry, current)]))
    )
    seenMoves.current = new Map(targets.map(({ id, move }) => [id, move]))

    return targets
  })

  // Re-armed on what the pawns must reach, not on every snapshot: a frame
  // that moved nobody must not restart a walk under way.
  useEffect(() => {
    const walkTargets = startWalk()

    if (prefersReducedMotion() || signature === '') {
      return
    }

    let interval: ReturnType<typeof setInterval> | undefined
    const delay = setTimeout(() => {
      interval = setInterval(() => {
        setShown((current) => stepTowards({ current, targets: walkTargets }))
      }, STEP_MS)
    }, WALK_DELAY_MS)

    return () => {
      clearTimeout(delay)
      clearInterval(interval)
    }
  }, [signature])

  return shown
}

/** One case nearer every target, the same map back once all have arrived. */
const stepTowards = ({
  current,
  targets
}: {
  current: ReadonlyMap<PawnId, number>
  targets: readonly WalkTarget[]
}): ReadonlyMap<PawnId, number> => {
  const hasArrived = targets.every(
    ({ id, target }) => current.get(id) === target
  )

  if (hasArrived) {
    return current
  }

  return new Map(
    targets.map(({ id, target }) => {
      const at = current.get(id) ?? target

      return [id, at + Math.sign(target - at)]
    })
  )
}

/**
 * A pawn's height as a share of the band, measured so a case's whole crowd
 * fits under its number: every pawn starts on one case.
 */
const pawnScaleFor = (standing: number): number => {
  if (standing <= 1) {
    return 0.6
  }

  if (standing === 2) {
    return 0.46
  }

  if (standing <= 4) {
    return 0.34
  }

  return 0.22
}

/** The edge of the screen a case lies along, which it comes in from and goes back out past. */
const sideOf = ({
  column,
  row,
  shape
}: {
  column: number
  row: number
  shape: TrackShape
}): 'bottom' | 'left' | 'right' | 'top' => {
  if (shape.kind === 'line' || row === 1) {
    return 'top'
  }

  if (column === 1) {
    return 'left'
  }

  if (column === shape.columns) {
    return 'right'
  }

  return 'bottom'
}

const NO_PAWNS: readonly TrackPawn[] = []

const trackLengthOf = (board: BoardSettings): number =>
  board.kind === 'track' ? board.length : 0

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

  return caseIndex % CASES_PER_MARK === 0 ? 'five' : undefined
}

const casesOf = (length: number): number[] =>
  Array.from({ length: length + 1 }, (_, caseIndex) => caseIndex)
