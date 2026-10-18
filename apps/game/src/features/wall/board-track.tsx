import { prefersReducedMotion } from '@adrienlcp/browser'
import type React from 'react'
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

import type { Team, TeamId } from '@melee/protocol/team'

import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './board-track.sass'

const CASES_PER_MARK = 5
const MIN_ROWS = 2
const MIN_TOP_COLUMNS = 1
const STEP_MS = 240
/** Long enough for the answer to land before the pawns set off. */
const WALK_DELAY_MS = 600

type TrackShape = { columns: number; rows: number }

type WalkTarget = { id: TeamId; move: number; target: number }

type BoardTrackProps = {
  /** The track's length in cases: the start is nought, the finish this. */
  length: number
  /** The teams racing, each standing on its `board.case`. */
  teams: readonly Team[]
}

/**
 * The teams' race, printed round the wall like a board game's track: up the
 * left side from the start, across the top, down the right side to the
 * finish, the bottom left open for the round. Its rows follow the screen's
 * aspect, so a wall lying down and one standing up draw the same U.
 *
 * At a reveal each pawn walks the cases its team just won rather than
 * teleporting, which is the moment the room watches.
 */
export const BoardTrack: React.FC<BoardTrackProps> = ({ length, teams }) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const trackRef = useRef<HTMLDivElement>(null)
  const shape = useTrackShape({ caseCount: length + 1, trackRef })
  const shownCases = useWalkedCases(teams)

  return (
    <div className='board-track' ref={trackRef}>
      <VisuallyHidden elementType='ol'>
        {teams.map((team) => (
          <li key={team.id}>
            {translate('board.standing', {
              case: team.board?.case ?? 0,
              length,
              team: teamName(team)
            })}
          </li>
        ))}
      </VisuallyHidden>
      {shape !== null && (
        <div
          aria-hidden='true'
          className='cases'
          style={{
            '--track-columns': shape.columns,
            '--track-rows': shape.rows
          }}
        >
          {casesOf(length).map((caseIndex) => {
            const [column, row] = cellOf({ caseIndex, shape })
            const standing = teams.filter(
              (team) => shownCases.get(team.id) === caseIndex
            )

            return (
              <div
                className='case'
                data-mark={markOf({ caseIndex, length })}
                data-parity={caseIndex % 2 === 0 ? 'even' : 'odd'}
                key={caseIndex}
                style={{
                  '--column': column,
                  '--pawn-scale': pawnScaleFor(standing.length),
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
                    {standing.map((team) => (
                      <span
                        className='standing'
                        // Keyed on the case too, so each step is a new element
                        // that hops in rather than one that slides.
                        key={`${team.id}:${caseIndex}`}
                      >
                        <Pawn colour={team.colour} />
                      </span>
                    ))}
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
 * The U's rows and columns for this screen: as many rows as keep the cases
 * near square once the two sides and the top share the track out, and never
 * so many that the top keeps no case of its own.
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

    const measure = () => {
      const { clientHeight, clientWidth } = track

      if (clientHeight === 0 || clientWidth === 0) {
        setShape(null)

        return
      }

      const maxRows = Math.floor((caseCount - MIN_TOP_COLUMNS) / 2)
      const rows = Math.min(
        maxRows,
        Math.max(
          MIN_ROWS,
          Math.round((caseCount + 2) / (2 + clientWidth / clientHeight))
        )
      )
      const columns = caseCount + 2 - 2 * rows

      setShape((current) =>
        current?.columns === columns && current.rows === rows
          ? current
          : { columns, rows }
      )
    }

    const observer = new ResizeObserver(measure)

    observer.observe(track)

    return () => {
      observer.disconnect()
    }
  }, [caseCount, trackRef])

  return shape
}

/**
 * The case each team's pawn is drawn on. A pawn the round has just moved
 * starts back where it stood and steps a case at a time to its new one; a
 * correction after that walks from wherever it is drawn. Under reduced motion
 * every pawn is simply where its team is.
 */
const useWalkedCases = (
  teams: readonly Team[]
): ReadonlyMap<TeamId, number> => {
  const [shown, setShown] = useState<ReadonlyMap<TeamId, number>>(
    () => new Map(teams.map((team) => [team.id, team.board?.case ?? 0]))
  )
  const seenMoves = useRef<ReadonlyMap<TeamId, number>>(new Map())
  const targets = teams.map((team) => ({
    id: team.id,
    move: team.board?.move ?? 0,
    target: team.board?.case ?? 0
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
      current: ReadonlyMap<TeamId, number>
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
  current: ReadonlyMap<TeamId, number>
  targets: readonly WalkTarget[]
}): ReadonlyMap<TeamId, number> => {
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
 * fits under its number: every team starts on one case.
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

  return 0.26
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

  return caseIndex % CASES_PER_MARK === 0 ? 'five' : undefined
}

const casesOf = (length: number): number[] =>
  Array.from({ length: length + 1 }, (_, caseIndex) => caseIndex)

/**
 * The grid cell, one-based, of a case: up the first column from the bottom,
 * along the top row, down the last column.
 */
const cellOf = ({
  caseIndex,
  shape: { columns, rows }
}: {
  caseIndex: number
  shape: TrackShape
}): [number, number] => {
  if (caseIndex < rows) {
    return [1, rows - caseIndex]
  }

  if (caseIndex < rows + columns - 2) {
    return [caseIndex - rows + 2, 1]
  }

  return [columns, caseIndex - rows - columns + 3]
}
