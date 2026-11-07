import { describe, expect, it } from 'vitest'

import {
  MOST_A_ROUND_PAYS,
  POINTS_PER_HALF,
  type Verdict
} from '@melee/protocol/scoring'

import {
  isFullyBanked,
  isMiss,
  nothingScored,
  pointsFor,
  pointsForSimultaneousAnswer,
  verdictKindFor
} from './verdict'

describe('verdictKindFor', () => {
  // The whole reason the verdict is a union. A bare claim judged as halves pays
  // two points for guessing one charade, which is the blind test's price for an
  // answer that has two parts to get.
  it('[verdict] judges a game with nothing to split as one claim', () => {
    expect(verdictKindFor('buzzer')).toBe('single')
    expect(verdictKindFor('blindtest')).toBe('halves')
  })
})

const halves = (titleCorrect: boolean, artistCorrect: boolean): Verdict => ({
  artistCorrect,
  kind: 'halves',
  titleCorrect
})

describe('pointsFor', () => {
  it.each([
    [halves(true, true), MOST_A_ROUND_PAYS],
    [halves(true, false), POINTS_PER_HALF],
    [halves(false, true), POINTS_PER_HALF],
    [halves(false, false), 0]
  ])(
    '[verdict] pays a half alone less than half the round, and the pair all of it',
    (given, expected) => {
      expect(pointsFor(given)).toBe(expected)
    }
  )

  // A charade is one thing to guess. Judging it in halves would pay it twice,
  // which is what the union exists to make impossible.
  it('[verdict] pays a bare claim the whole round, once', () => {
    expect(pointsFor({ isCorrect: true, kind: 'single' })).toBe(
      MOST_A_ROUND_PAYS
    )
    expect(pointsFor({ isCorrect: false, kind: 'single' })).toBe(0)
  })
})

describe('isMiss', () => {
  it('[verdict] reads a scoreless verdict of either shape as the lockout', () => {
    expect(isMiss(nothingScored('buzzer'))).toBe(true)
    expect(isMiss(nothingScored('blindtest'))).toBe(true)
    expect(isMiss({ isCorrect: true, kind: 'single' })).toBe(false)
  })
})

describe('isFullyBanked', () => {
  // What closes typed mode for a player. Half an answer leaves the round open
  // to them, and one claim is finished the moment it is right.
  it('[verdict] wants both halves, and one claim only once', () => {
    expect(isFullyBanked(halves(true, true))).toBe(true)
    expect(isFullyBanked(halves(true, false))).toBe(false)
    expect(isFullyBanked({ isCorrect: true, kind: 'single' })).toBe(true)
    expect(isFullyBanked({ isCorrect: false, kind: 'single' })).toBe(false)
  })
})

describe('pointsForSimultaneousAnswer', () => {
  it('[verdict] pays a right claim the whole round and a wrong one nothing', () => {
    expect(
      pointsForSimultaneousAnswer({
        verdict: { isCorrect: true, kind: 'single' }
      })
    ).toBe(MOST_A_ROUND_PAYS)
    expect(
      pointsForSimultaneousAnswer({
        verdict: { isCorrect: false, kind: 'single' }
      })
    ).toBe(0)
  })

  it('[verdict] weighs a sheet’s lone finds double, and nothing else', () => {
    const sheet: Verdict = {
      cellCount: 9,
      foundCells: [0, 8],
      hitBlackWord: false,
      kind: 'cells'
    }

    expect(
      pointsForSimultaneousAnswer({ doubledCells: [8], verdict: sheet })
    ).toBeGreaterThan(pointsForSimultaneousAnswer({ verdict: sheet }))
  })
})
