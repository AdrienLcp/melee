import { describe, expect, it } from 'vitest'

import type { BoardStrategy } from '@melee/protocol/board'
import { POINT } from '@melee/protocol/scoring'

import { advanceOnTrack } from './board-strategy'

const LENGTH = 12

/** Three teams over six rounds, as a team evening would score them. */
const EVENING: Record<string, number>[] = [
  { blue: 2.4 * POINT, green: 0, red: 3 * POINT },
  { blue: 1.9 * POINT, green: 0.6 * POINT, red: POINT },
  { blue: 3 * POINT, green: 2 * POINT, red: 0 },
  { blue: 0, green: 3 * POINT, red: 2.5 * POINT },
  { blue: 2 * POINT, green: POINT, red: 3 * POINT },
  { blue: 3 * POINT, green: 3 * POINT, red: 3 * POINT }
]

const play = ({
  catchUp = false,
  rounds,
  strategy
}: {
  catchUp?: boolean
  rounds: Record<string, number>[]
  strategy: BoardStrategy
}) => {
  const positions = new Map<string, number>()
  const log: { isOver: boolean; positions: Record<string, number> }[] = []

  for (const round of rounds) {
    const progress = advanceOnTrack({
      catchUp,
      length: LENGTH,
      positions,
      results: Object.entries(round).map(([teamId, points]) => ({
        points,
        teamId
      })),
      strategy
    })

    for (const position of progress.positions) {
      positions.set(position.teamId, position.case)
    }

    log.push({
      isOver: progress.isOver,
      positions: Object.fromEntries(positions)
    })

    if (progress.isOver) {
      break
    }
  }

  return log
}

describe('board strategy', () => {
  it('[board] walks three teams over six rounds to the finish', () => {
    expect(play({ rounds: EVENING, strategy: 'onePointOneCase' })).toEqual([
      { isOver: false, positions: { blue: 2, green: 0, red: 3 } },
      { isOver: false, positions: { blue: 3, green: 0, red: 4 } },
      { isOver: false, positions: { blue: 6, green: 2, red: 4 } },
      { isOver: false, positions: { blue: 6, green: 5, red: 6 } },
      { isOver: false, positions: { blue: 8, green: 6, red: 9 } },
      { isOver: true, positions: { blue: 11, green: 9, red: 12 } }
    ])
  })

  it('[board] moves no pawn on the speed bonus alone', () => {
    const progress = advanceOnTrack({
      catchUp: false,
      length: LENGTH,
      positions: new Map(),
      results: [{ points: 0.99 * POINT, teamId: 'blue' }],
      strategy: 'onePointOneCase'
    })

    expect(progress.moves).toEqual([{ cases: 0, teamId: 'blue' }])
  })

  it('[board] stops a pawn on the last case and ends there', () => {
    const progress = advanceOnTrack({
      catchUp: false,
      length: LENGTH,
      positions: new Map([['blue', LENGTH - 1]]),
      results: [{ points: 3 * POINT, teamId: 'blue' }],
      strategy: 'onePointOneCase'
    })

    expect(progress).toEqual({
      isOver: true,
      moves: [{ cases: 1, teamId: 'blue' }],
      positions: [{ case: LENGTH, teamId: 'blue' }]
    })
  })

  it('[board] is not over while every pawn is short of the end', () => {
    const progress = advanceOnTrack({
      catchUp: false,
      length: LENGTH,
      positions: new Map([['blue', LENGTH - 4]]),
      results: [{ points: 3 * POINT, teamId: 'blue' }],
      strategy: 'onePointOneCase'
    })

    expect(progress.isOver).toBe(false)
  })

  it('[board] ranks the same evening 3, 2 and 1 cases a round', () => {
    expect(play({ rounds: EVENING, strategy: 'rank' })).toEqual([
      { isOver: false, positions: { blue: 2, green: 0, red: 3 } },
      { isOver: false, positions: { blue: 5, green: 1, red: 5 } },
      { isOver: false, positions: { blue: 8, green: 3, red: 5 } },
      { isOver: false, positions: { blue: 8, green: 6, red: 7 } },
      { isOver: false, positions: { blue: 10, green: 7, red: 10 } },
      { isOver: true, positions: { blue: 12, green: 10, red: 12 } }
    ])
  })

  it('[board] shares the better place on a tie and skips the next', () => {
    const progress = advanceOnTrack({
      catchUp: false,
      length: LENGTH,
      positions: new Map(),
      results: [
        { points: 2 * POINT, teamId: 'blue' },
        { points: 2 * POINT, teamId: 'red' },
        { points: POINT, teamId: 'green' },
        { points: 0.5 * POINT, teamId: 'gold' },
        { points: 0, teamId: 'pink' }
      ],
      strategy: 'rank'
    })

    expect(progress.moves).toEqual([
      { cases: 3, teamId: 'blue' },
      { cases: 3, teamId: 'red' },
      { cases: 1, teamId: 'green' },
      { cases: 0, teamId: 'gold' },
      { cases: 0, teamId: 'pink' }
    ])
  })

  it('[board] ranks a turn against nobody, the waiting teams paid nothing', () => {
    const progress = advanceOnTrack({
      catchUp: false,
      length: LENGTH,
      positions: new Map(),
      results: [
        { points: 0.4 * POINT, teamId: 'blue' },
        { points: 0, teamId: 'red' }
      ],
      strategy: 'rank'
    })

    expect(progress.moves).toEqual([
      { cases: 3, teamId: 'blue' },
      { cases: 0, teamId: 'red' }
    ])
  })

  it('[board] gives the team alone at the back one case more on a round it scores', () => {
    expect(
      play({ catchUp: true, rounds: EVENING, strategy: 'onePointOneCase' })
    ).toEqual([
      { isOver: false, positions: { blue: 2, green: 0, red: 3 } },
      { isOver: false, positions: { blue: 3, green: 0, red: 4 } },
      { isOver: false, positions: { blue: 6, green: 3, red: 4 } },
      { isOver: false, positions: { blue: 6, green: 7, red: 6 } },
      { isOver: false, positions: { blue: 8, green: 8, red: 9 } },
      { isOver: true, positions: { blue: 11, green: 11, red: 12 } }
    ])
    expect(play({ catchUp: true, rounds: EVENING, strategy: 'rank' })).toEqual([
      { isOver: false, positions: { blue: 2, green: 0, red: 3 } },
      { isOver: false, positions: { blue: 5, green: 2, red: 5 } },
      { isOver: false, positions: { blue: 8, green: 5, red: 5 } },
      { isOver: false, positions: { blue: 8, green: 8, red: 7 } },
      { isOver: false, positions: { blue: 10, green: 9, red: 11 } },
      { isOver: true, positions: { blue: 12, green: 12, red: 12 } }
    ])
  })
})
