import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  comingRounds,
  listedOrder,
  orderWithEntryNext,
  orderWithLastRowSettled,
  scheduledEntryAt
} from './running-order'

const lineUp = [
  DEFAULT_GAME_SETTINGS.quiz,
  DEFAULT_GAME_SETTINGS.challenge,
  DEFAULT_GAME_SETTINGS.blindtest,
  DEFAULT_GAME_SETTINGS.slate
]

const ROLLS = [0, 0.34, 0.5, 0.67, 0.99]

const drawnAt = ({
  lastAt = null,
  order,
  played = lineUp.map(() => 0),
  roll = 0,
  roundAt
}: {
  lastAt?: number | null
  order: RoomSettings['runningOrder']
  played?: readonly number[]
  roll?: number
  roundAt: number
}) =>
  scheduledEntryAt({
    lastAt,
    lineUp,
    order,
    played,
    random: () => roll,
    roundAt,
    roundsLeft: null
  })

describe('scheduledEntryAt', () => {
  it('[running-order] plays the entry the host put on the round', () => {
    expect(drawnAt({ order: [3, 1, 0], roundAt: 0 })).toBe(3)
    expect(drawnAt({ order: [3, 1, 0], roundAt: 1 })).toBe(1)
  })

  it('[running-order] draws a chance round among the entries serving their own content', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(
        drawnAt({ order: [null, 1, 3], roll, roundAt: 0 })
      )
    }
  })

  it('[running-order] draws every round past the order’s end', () => {
    for (const roll of ROLLS) {
      expect([0, 2]).toContain(
        drawnAt({
          lastAt: 3,
          order: [1, 3],
          played: [0, 1, 0, 1],
          roll,
          roundAt: 2
        })
      )
    }
  })

  it('[running-order] leaves a row whose entry is played out to chance', () => {
    expect(
      drawnAt({ order: [1, 1], played: [0, 1, 0, 0], roundAt: 1 })
    ).not.toBe(1)
  })

  it('[running-order] leaves a row whose entry is gone to chance', () => {
    expect(drawnAt({ order: [7], roundAt: 0 })).not.toBeNull()
  })

  it('[running-order] draws as before with no order', () => {
    for (const roll of ROLLS) {
      expect(drawnAt({ lastAt: 0, order: null, roll, roundAt: 1 })).not.toBe(0)
    }
  })
})

describe('listedOrder', () => {
  it('[running-order] puts the next round first, then each entry owed, then chance to the count', () => {
    expect(
      listedOrder({
        lineUp,
        lineUpAt: 2,
        played: [0, 0, 0, 0],
        roundCount: 6,
        upcoming: 0
      })
    ).toEqual([2, 0, 1, 3, null, null])
  })

  it('[running-order] leaves the rounds already opened and the entries played out to chance', () => {
    expect(
      listedOrder({
        lineUp,
        lineUpAt: 0,
        played: [1, 1, 0, 0],
        roundCount: 5,
        upcoming: 2
      })
    ).toEqual([null, null, 0, 2, 3])
  })

  it('[running-order] gives an endless evening a row per entry', () => {
    expect(
      listedOrder({
        lineUp,
        lineUpAt: 1,
        played: [0, 0, 0, 0],
        roundCount: null,
        upcoming: 0
      })
    ).toEqual([1, 0, 2, 3])
  })
})

describe('comingRounds', () => {
  it('[running-order] starts on the next round’s entry whatever its row says', () => {
    expect(
      comingRounds({
        drawnAt: 3,
        order: [null, 0, 1, null],
        roundCount: 4,
        upcoming: 1
      }).map((round) => round.at)
    ).toEqual([3, 1, null])
  })

  it('[running-order] shows a row past the count only when it holds an entry', () => {
    expect(
      comingRounds({
        drawnAt: 0,
        order: [0, null, null, 1, null],
        roundCount: 2,
        upcoming: 0
      })
    ).toEqual([
      { at: 0, isPastTheEnd: false, roundAt: 0 },
      { at: null, isPastTheEnd: false, roundAt: 1 },
      { at: 1, isPastTheEnd: true, roundAt: 3 }
    ])
  })
})

describe('orderWithEntryNext', () => {
  it('[running-order] swaps the entry put first with the one that was there', () => {
    expect(
      orderWithEntryNext({ at: 2, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 2, 1, null])
  })

  it('[running-order] gives the displaced entry the first chance round when the other had no row', () => {
    expect(
      orderWithEntryNext({ at: 3, order: [0, 1, 2, null], upcoming: 1 })
    ).toEqual([0, 3, 2, 1])
  })

  it('[running-order] leaves an evening with no order alone', () => {
    expect(orderWithEntryNext({ at: 1, order: null, upcoming: 0 })).toBeNull()
  })
})

describe('orderWithLastRowSettled', () => {
  it('[running-order] moves an added entry onto the count’s last chance round', () => {
    expect(
      orderWithLastRowSettled({
        order: [0, 1, null, null, 2],
        roundCount: 4,
        upcoming: 0
      })
    ).toEqual([0, 1, null, 2])
  })

  it('[running-order] keeps it past the end when every round to come holds an entry', () => {
    expect(
      orderWithLastRowSettled({
        order: [null, 0, 1, 2],
        roundCount: 3,
        upcoming: 1
      })
    ).toEqual([null, 0, 1, 2])
  })
})
