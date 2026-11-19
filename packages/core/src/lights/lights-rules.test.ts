import { describe, expect, it } from 'vitest'

import { LIGHTS_CELL_COUNT } from '@melee/protocol/lights'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { isPaidForSpeed, pointsFor } from '../scoring/verdict'
import {
  HIT_FLOOR_MS,
  LATE_TAP_GRACE_MS,
  type LightsTap,
  lightsRunLengthOf,
  tapOutcomeOf
} from './counted-tap'
import { bestHitsOf, isBestCount, pointsForCount } from './hits-pay'
import { type LightsStep, lightsRunOf, TRAP_SHARE } from './lights-run'

const RUN_LENGTH = lightsRunLengthOf(20_000)
const SEEDS = Array.from({ length: 200 }, (_, index) => index * 7_919 + 1)

const runsOf = (hasTraps: boolean): LightsStep[][] =>
  SEEDS.map((seed) => lightsRunOf({ hasTraps, length: RUN_LENGTH, seed }))

const pairsOf = (run: readonly LightsStep[]) =>
  run.slice(1).map((step, index) => ({ previous: run[index], step }))

describe('the lights run', () => {
  it('[lights] builds the same run from the same seed', () => {
    const settings = { hasTraps: true, length: RUN_LENGTH, seed: 2_024 }

    expect(lightsRunOf(settings)).toEqual(lightsRunOf(settings))
    expect(lightsRunOf(settings)).not.toEqual(
      lightsRunOf({ ...settings, seed: 2_025 })
    )
  })

  it('[lights] is as long as asked', () => {
    expect(lightsRunOf({ hasTraps: true, length: 37, seed: 1 })).toHaveLength(
      37
    )
  })

  it('[lights] never lights the same cell twice running', () => {
    for (const run of runsOf(true)) {
      for (const { previous, step } of pairsOf(run)) {
        expect(step.target).not.toBe(previous?.target)
      }
    }
  })

  it('[lights] lights every cell of the board, and nothing off it', () => {
    const targets = new Set(
      runsOf(true)
        .flat()
        .map((step) => step.target)
    )

    expect([...targets].toSorted((left, right) => left - right)).toEqual(
      Array.from({ length: LIGHTS_CELL_COUNT }, (_, cell) => cell)
    )
  })

  it('[lights] never sets a trap on its target, nor on the cell just hit', () => {
    for (const run of runsOf(true)) {
      expect(run[0]?.trap).not.toBe(run[0]?.target)

      for (const { previous, step } of pairsOf(run)) {
        expect(step.trap).not.toBe(step.target)
        expect(step.trap).not.toBe(previous?.target)
      }
    }
  })

  it('[lights] traps about a quarter of the steps', () => {
    const steps = runsOf(true).flat()
    const trapped = steps.filter((step) => step.trap !== null).length

    expect(trapped / steps.length).toBeCloseTo(TRAP_SHARE, 1)
  })

  it('[lights] sets every trap cell, and nothing off the board', () => {
    const traps = new Set(
      runsOf(true)
        .flat()
        .flatMap((step) => (step.trap === null ? [] : [step.trap]))
    )

    expect(traps.size).toBe(LIGHTS_CELL_COUNT)
    expect(Math.max(...traps)).toBe(LIGHTS_CELL_COUNT - 1)
    expect(Math.min(...traps)).toBe(0)
  })

  it('[lights] lights the same targets with traps off, and no trap', () => {
    const settings = { length: RUN_LENGTH, seed: 99 }
    const trapped = lightsRunOf({ ...settings, hasTraps: true })
    const plain = lightsRunOf({ ...settings, hasTraps: false })

    expect(plain.map((step) => step.target)).toEqual(
      trapped.map((step) => step.target)
    )
    expect(plain.every((step) => step.trap === null)).toBe(true)
  })
})

const OPENS_AT = 50_000
const WINDOW_MS = 20_000
const WINDOW = { closesAt: OPENS_AT + WINDOW_MS, opensAt: OPENS_AT }
const RUN = lightsRunOf({
  hasTraps: true,
  length: lightsRunLengthOf(WINDOW_MS),
  seed: 7
})
const TRAPPED_STEP = RUN.findIndex((step) => step.trap !== null)

const stepAt = (index: number): LightsStep => {
  const step = RUN[index]

  if (step === undefined) {
    throw new Error(`No step ${index} in the run`)
  }

  return step
}

const outcomeOf = ({ hits, tap }: { hits: number; tap: LightsTap }) =>
  tapOutcomeOf({ hits, run: RUN, tap, window: WINDOW })

const hitOn = ({ arrivedAt, step }: { arrivedAt: number; step: number }) => ({
  arrivedAt,
  cell: stepAt(step).target,
  step
})

describe('a tap counted', () => {
  it('[lights] counts the target of the seat’s next step inside the window', () => {
    expect(
      outcomeOf({
        hits: 3,
        tap: hitOn({ arrivedAt: OPENS_AT + 5_000, step: 3 })
      })
    ).toBe('hit')
  })

  it('[lights] holds hit n to the floor n × HIT_FLOOR_MS after the window opens', () => {
    const floor = OPENS_AT + 5 * HIT_FLOOR_MS

    expect(
      outcomeOf({ hits: 4, tap: hitOn({ arrivedAt: floor, step: 4 }) })
    ).toBe('hit')
    expect(
      outcomeOf({ hits: 4, tap: hitOn({ arrivedAt: floor - 1, step: 4 }) })
    ).toBe('uncounted')
  })

  it('[lights] holds the first hit to the floor as well', () => {
    expect(
      outcomeOf({
        hits: 0,
        tap: hitOn({ arrivedAt: OPENS_AT + HIT_FLOOR_MS - 1, step: 0 })
      })
    ).toBe('uncounted')
  })

  it('[lights] counts nothing before the window opens, a trap included', () => {
    const trap = stepAt(TRAPPED_STEP).trap

    expect(trap).not.toBeNull()
    expect(
      outcomeOf({
        hits: TRAPPED_STEP,
        tap: { arrivedAt: OPENS_AT - 1, cell: trap ?? 0, step: TRAPPED_STEP }
      })
    ).toBe('uncounted')
  })

  it('[lights] counts a tap still in the air through the grace, and none after it', () => {
    const lastCounted = WINDOW.closesAt + LATE_TAP_GRACE_MS

    expect(
      outcomeOf({ hits: 40, tap: hitOn({ arrivedAt: lastCounted, step: 40 }) })
    ).toBe('hit')
    expect(
      outcomeOf({
        hits: 40,
        tap: hitOn({ arrivedAt: lastCounted + 1, step: 40 })
      })
    ).toBe('uncounted')
  })

  it('[lights] counts a step already passed nothing a second time, nor a step ahead', () => {
    const arrivedAt = OPENS_AT + 10_000

    expect(outcomeOf({ hits: 6, tap: hitOn({ arrivedAt, step: 5 }) })).toBe(
      'uncounted'
    )
    expect(outcomeOf({ hits: 6, tap: hitOn({ arrivedAt, step: 7 }) })).toBe(
      'uncounted'
    )
  })

  it('[lights] counts a cell neither lit nor trapped nothing', () => {
    const { target, trap } = stepAt(2)
    const unlit = Array.from(
      { length: LIGHTS_CELL_COUNT },
      (_, cell) => cell
    ).find((cell) => cell !== target && cell !== trap)

    expect(
      outcomeOf({
        hits: 2,
        tap: { arrivedAt: OPENS_AT + 5_000, cell: unlit ?? 0, step: 2 }
      })
    ).toBe('uncounted')
  })

  it('[lights] records a trap, and moves nothing', () => {
    const trap = stepAt(TRAPPED_STEP).trap

    expect(
      outcomeOf({
        hits: TRAPPED_STEP,
        tap: {
          arrivedAt: OPENS_AT + 10_000,
          cell: trap ?? 0,
          step: TRAPPED_STEP
        }
      })
    ).toBe('trap')
  })

  it('[lights] runs as long as the most a seat can be counted, and no longer', () => {
    const lastStep = RUN.length - 1
    const lastCounted = WINDOW.closesAt + LATE_TAP_GRACE_MS

    expect(
      outcomeOf({
        hits: lastStep,
        tap: hitOn({ arrivedAt: lastCounted, step: lastStep })
      })
    ).toBe('hit')
    expect(OPENS_AT + (RUN.length + 1) * HIT_FLOOR_MS).toBeGreaterThan(
      lastCounted
    )
    expect(
      outcomeOf({
        hits: RUN.length,
        tap: { arrivedAt: lastCounted, cell: 0, step: RUN.length }
      })
    ).toBe('uncounted')
  })
})

describe('the lights pay', () => {
  it('[lights] pays the best count the whole round, half the best half of it', () => {
    expect(pointsForCount({ bestHits: 30, hits: 30 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForCount({ bestHits: 30, hits: 15 })).toBe(50 * POINT)
    expect(pointsForCount({ bestHits: 30, hits: 0 })).toBe(0)
  })

  it('[lights] pays nobody a round nobody hit', () => {
    expect(bestHitsOf([])).toBe(0)
    expect(bestHitsOf([0, 0])).toBe(0)
    expect(pointsForCount({ bestHits: 0, hits: 0 })).toBe(0)
    expect(isBestCount({ bestHits: 0, hits: 0 })).toBe(false)
  })

  it('[lights] finds the round’s best among its seats', () => {
    expect(bestHitsOf([12, 31, 7])).toBe(31)
  })

  it('[lights] prices a count verdict on the share, with no clock', () => {
    const verdict = { bestHits: 40, hits: 30, kind: 'count' } as const

    expect(pointsFor(verdict)).toBe(75 * POINT)
    expect(isPaidForSpeed(verdict)).toBe(false)
  })
})
