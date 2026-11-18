import { describe, expect, it } from 'vitest'

import { FIVE_CLUES_CLUE_COUNT } from '@melee/protocol/five-clues'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { pointsForClue, worthOfClue } from './clue-pay'
import {
  type CluesSeat,
  isRaceSettled,
  LAST_CLUE_INDEX,
  mayGuess,
  opensNextClueEarly,
  RACING_SEAT,
  seatAfterGuess
} from './clue-race'

const CLUE_MS = 10_000

const clueIndexes = Array.from(
  { length: FIVE_CLUES_CLUE_COUNT },
  (_, index) => index
)

describe('the five-clues pay', () => {
  it('[fiveclues] pays the first clue the whole round and each later one a fifth less', () => {
    expect(clueIndexes.map((index) => worthOfClue(index) / POINT)).toEqual([
      100, 80, 60, 40, 20
    ])
    expect(worthOfClue(0)).toBe(MOST_A_ROUND_PAYS)
  })

  it('[fiveclues] pays nine tenths flat and the clock the last tenth, falling over the clue', () => {
    expect(
      pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: 1,
        elapsedInClueMs: 0,
        paysForSpeed: true
      })
    ).toEqual({ points: 80 * POINT, speedBonus: 8 * POINT })
    expect(
      pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: 1,
        elapsedInClueMs: CLUE_MS / 2,
        paysForSpeed: true
      })
    ).toEqual({ points: 76 * POINT, speedBonus: 4 * POINT })
    expect(
      pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: 1,
        elapsedInClueMs: CLUE_MS * 2,
        paysForSpeed: true
      })
    ).toEqual({ points: 72 * POINT, speedBonus: 0 })
  })

  it('[fiveclues] separates two seats on the same clue by the millisecond', () => {
    const first = pointsForClue({
      clueDurationMs: CLUE_MS,
      clueIndex: 2,
      elapsedInClueMs: 1_200,
      paysForSpeed: true
    })
    const second = pointsForClue({
      clueDurationMs: CLUE_MS,
      clueIndex: 2,
      elapsedInClueMs: 1_201,
      paysForSpeed: true
    })

    expect(first.points).toBeGreaterThan(second.points)
  })

  it('[fiveclues] pays the slowest answer on a clue more than the quickest on the next', () => {
    for (const index of clueIndexes.slice(0, LAST_CLUE_INDEX)) {
      const slowest = pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: index,
        elapsedInClueMs: CLUE_MS,
        paysForSpeed: true
      })
      const quickestNext = pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: index + 1,
        elapsedInClueMs: 0,
        paysForSpeed: true
      })

      expect(slowest.points).toBeGreaterThan(quickestNext.points)
    }
  })

  it('[fiveclues] pays the clue its whole worth, unclocked, when the room pays no speed', () => {
    expect(
      pointsForClue({
        clueDurationMs: CLUE_MS,
        clueIndex: 3,
        elapsedInClueMs: 9_000,
        paysForSpeed: false
      })
    ).toEqual({ points: 40 * POINT, speedBonus: 0 })
  })
})

describe('the five-clues race', () => {
  const lockedOn = (clueIndex: number): CluesSeat => ({
    guessedOnClue: clueIndex,
    status: 'racing'
  })
  const found: CluesSeat = {
    clueIndex: 0,
    elapsedInClueMs: 500,
    status: 'found'
  }

  it('[fiveclues] lets a typed seat guess once per clue, and again once the next opens', () => {
    expect(mayGuess({ openClueIndex: 0, seat: RACING_SEAT })).toBe(true)
    expect(mayGuess({ openClueIndex: 1, seat: lockedOn(1) })).toBe(false)
    expect(mayGuess({ openClueIndex: 2, seat: lockedOn(1) })).toBe(true)
  })

  it('[fiveclues] locks a wrong typed guess to its clue and puts a wrong pick out', () => {
    expect(
      seatAfterGuess({
        elapsedInClueMs: 3_000,
        isCorrect: false,
        mode: 'typed',
        openClueIndex: 2
      })
    ).toEqual(lockedOn(2))

    const out = seatAfterGuess({
      elapsedInClueMs: 3_000,
      isCorrect: false,
      mode: 'choice',
      openClueIndex: 2
    })

    expect(out).toEqual({ status: 'out' })
    expect(mayGuess({ openClueIndex: 3, seat: out })).toBe(false)
  })

  it('[fiveclues] records the clue and the moment a right answer landed on', () => {
    const seat = seatAfterGuess({
      elapsedInClueMs: 2_345,
      isCorrect: true,
      mode: 'choice',
      openClueIndex: 3
    })

    expect(seat).toEqual({
      clueIndex: 3,
      elapsedInClueMs: 2_345,
      status: 'found'
    })
    expect(mayGuess({ openClueIndex: 4, seat })).toBe(false)
  })

  it('[fiveclues] opens the next clue early once every seat still racing has guessed on this one', () => {
    expect(
      opensNextClueEarly({
        openClueIndex: 1,
        seats: [lockedOn(1), found, { status: 'out' }]
      })
    ).toBe(true)
    expect(
      opensNextClueEarly({
        openClueIndex: 1,
        seats: [lockedOn(1), lockedOn(0)]
      })
    ).toBe(false)
    expect(
      opensNextClueEarly({
        openClueIndex: 1,
        seats: [lockedOn(1), RACING_SEAT]
      })
    ).toBe(false)
  })

  it('[fiveclues] never opens past the last clue, nor on a round nobody is racing', () => {
    expect(
      opensNextClueEarly({
        openClueIndex: LAST_CLUE_INDEX,
        seats: [lockedOn(LAST_CLUE_INDEX)]
      })
    ).toBe(false)
    expect(opensNextClueEarly({ openClueIndex: 0, seats: [found] })).toBe(false)
  })

  it('[fiveclues] settles the round once every seat has found or is out', () => {
    expect(
      isRaceSettled({ openClueIndex: 2, seats: [found, { status: 'out' }] })
    ).toBe(true)
    expect(
      isRaceSettled({ openClueIndex: 3, seats: [found, lockedOn(3)] })
    ).toBe(false)
  })

  it('[fiveclues] settles the last clue once every seat still racing has guessed on it', () => {
    expect(
      isRaceSettled({
        openClueIndex: LAST_CLUE_INDEX,
        seats: [found, lockedOn(4)]
      })
    ).toBe(true)
    expect(
      isRaceSettled({
        openClueIndex: LAST_CLUE_INDEX,
        seats: [found, lockedOn(3)]
      })
    ).toBe(false)
    expect(
      isRaceSettled({ openClueIndex: LAST_CLUE_INDEX, seats: [RACING_SEAT] })
    ).toBe(false)
  })
})
