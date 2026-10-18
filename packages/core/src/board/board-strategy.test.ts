import { describe, expect, it } from 'vitest'

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

const play = (rounds: Record<string, number>[]) => {
  const positions = new Map<string, number>()
  const log: { isOver: boolean; positions: Record<string, number> }[] = []

  for (const round of rounds) {
    const progress = advanceOnTrack({
      length: LENGTH,
      positions,
      results: Object.entries(round).map(([teamId, points]) => ({
        points,
        teamId
      })),
      strategy: 'onePointOneCase'
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
    expect(play(EVENING)).toEqual([
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
      length: LENGTH,
      positions: new Map(),
      results: [{ points: 0.99 * POINT, teamId: 'blue' }],
      strategy: 'onePointOneCase'
    })

    expect(progress.moves).toEqual([{ cases: 0, teamId: 'blue' }])
  })

  it('[board] stops a pawn on the last case and ends there', () => {
    const progress = advanceOnTrack({
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
      length: LENGTH,
      positions: new Map([['blue', LENGTH - 4]]),
      results: [{ points: 3 * POINT, teamId: 'blue' }],
      strategy: 'onePointOneCase'
    })

    expect(progress.isOver).toBe(false)
  })
})
